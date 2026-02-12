import { NextRequest, NextResponse } from "next/server";
import { TELEMETRY_CONFIG, TELEMETRY_KEYS, getRedis } from "@/lib/redis";

export const runtime = "edge";

type GeoPayload = {
  country: string;
  region: string;
  latitude: number | null;
  longitude: number | null;
};

type GeoHintRequest = NextRequest & {
  geo?: {
    country?: string;
    region?: string;
    city?: string;
    latitude?: string;
    longitude?: string;
  };
};

const BOT_UA_PATTERN = /(bot|crawler|spider|slurp|bingpreview|facebookexternalhit|linkedinbot|whatsapp|discordbot|headless|curl|wget|python-requests)/i;

function parseSessionId(body: unknown): string | null {
  if (!body || typeof body !== "object") {
    return null;
  }

  const maybeSessionId = (body as { sessionId?: unknown }).sessionId;
  if (typeof maybeSessionId !== "string") {
    return null;
  }

  const trimmed = maybeSessionId.trim();
  if (!/^[a-zA-Z0-9_-]{8,128}$/.test(trimmed)) {
    return null;
  }

  return trimmed;
}

function parseCoordinate(value: string | null | undefined, min: number, max: number): number | null {
  if (!value) {
    return null;
  }

  const num = Number.parseFloat(value);
  if (!Number.isFinite(num) || num < min || num > max) {
    return null;
  }

  return num;
}

function getGeoFromRequest(request: GeoHintRequest): GeoPayload {
  const country =
    request.geo?.country?.trim() ||
    request.headers.get("x-vercel-ip-country")?.trim() ||
    request.headers.get("cf-ipcountry")?.trim() ||
    "UN";

  const region =
    request.geo?.region?.trim() ||
    request.headers.get("x-vercel-ip-country-region")?.trim() ||
    request.headers.get("x-vercel-ip-city")?.trim() ||
    country;

  const latitude = parseCoordinate(
    request.geo?.latitude || request.headers.get("x-vercel-ip-latitude"),
    -90,
    90,
  );
  const longitude = parseCoordinate(
    request.geo?.longitude || request.headers.get("x-vercel-ip-longitude"),
    -180,
    180,
  );

  return {
    country: country.toUpperCase().slice(0, 2) || "UN",
    region: region.slice(0, 80) || "Unknown",
    latitude,
    longitude,
  };
}

export async function POST(request: NextRequest) {
  try {
    const userAgent = request.headers.get("user-agent") || "";
    if (BOT_UA_PATTERN.test(userAgent)) {
      return NextResponse.json({ ignored: true, reason: "bot" }, { status: 202 });
    }

    const body = await request.json().catch(() => null);
    const sessionId = parseSessionId(body);
    if (!sessionId) {
      return NextResponse.json({ error: "sessionId is required" }, { status: 400 });
    }

    const redis = getRedis();
    const geo = getGeoFromRequest(request as GeoHintRequest);
    const nowMs = Date.now();
    const expiresAt = nowMs + TELEMETRY_CONFIG.sessionTtlSec * 1000;
    const sessionMember = `sid:${sessionId}`;
    const geoPingThrottleKey = `${TELEMETRY_KEYS.geoPingThrottlePrefix}${sessionId}`;

    const [, canWriteGeoPing] = await Promise.all([
      redis.zadd(TELEMETRY_KEYS.sessionsZset, { score: expiresAt, member: sessionMember }),
      // Only one geo ping write per minute per session to reduce Redis command volume.
      redis.set(geoPingThrottleKey, "1", { nx: true, ex: TELEMETRY_CONFIG.geoPingMinIntervalSec }),
    ]);

    if (canWriteGeoPing) {
      await Promise.all([
        redis.lpush(
          TELEMETRY_KEYS.geoPingsList,
          JSON.stringify({
            country: geo.country,
            region: geo.region,
            latitude: geo.latitude,
            longitude: geo.longitude,
            timestamp: nowMs,
          }),
        ),
        redis.ltrim(TELEMETRY_KEYS.geoPingsList, 0, TELEMETRY_CONFIG.recentPingLimit - 1),
      ]);
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      {
        error: "Telemetry unavailable",
      },
      { status: 500 },
    );
  }
}
