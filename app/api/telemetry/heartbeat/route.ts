import { NextRequest, NextResponse } from "next/server";
import { TELEMETRY_CONFIG, TELEMETRY_KEYS, getRedis } from "@/lib/redis";

export const runtime = "edge";

type GeoPayload = {
  country: string;
  region: string;
};

type GeoHintRequest = NextRequest & {
  geo?: {
    country?: string;
    region?: string;
    city?: string;
  };
};

const BOT_UA_PATTERN = /(bot|crawler|spider|slurp|bingpreview|facebookexternalhit|linkedinbot|whatsapp|discordbot|headless|curl|wget|python-requests)/i;

function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || request.headers.get("x-real-ip") || "unknown";
}

async function hashText(value: string): Promise<string> {
  const data = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("")
    .slice(0, 20);
}

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

  return {
    country: country.toUpperCase().slice(0, 2) || "UN",
    region: region.slice(0, 80) || "Unknown",
  };
}

async function incrementRate(redis: ReturnType<typeof getRedis>, key: string): Promise<number> {
  const count = await redis.incr(key);
  if (count === 1) {
    await redis.expire(key, TELEMETRY_CONFIG.rateLimitWindowSec);
  }
  return count;
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

    const ipHash = await hashText(getClientIp(request));
    const redis = getRedis();

    const sessionRateKey = `telemetry:rl:session:${sessionId}`;
    const ipRateKey = `telemetry:rl:ip:${ipHash}`;

    const [sessionCount, ipCount] = await Promise.all([
      incrementRate(redis, sessionRateKey),
      incrementRate(redis, ipRateKey),
    ]);

    if (
      sessionCount > TELEMETRY_CONFIG.rateLimitMaxPerWindow ||
      ipCount > TELEMETRY_CONFIG.rateLimitMaxPerWindow
    ) {
      return NextResponse.json({ error: "rate_limited" }, { status: 429 });
    }

    const geo = getGeoFromRequest(request as GeoHintRequest);
    const nowMs = Date.now();
    const expiresAt = nowMs + TELEMETRY_CONFIG.sessionTtlSec * 1000;
    const sessionMember = `sid:${sessionId}`;
    const sessionKey = `${TELEMETRY_KEYS.sessionPrefix}${sessionId}`;

    await Promise.all([
      redis.set(sessionKey, "1", { ex: TELEMETRY_CONFIG.sessionTtlSec }),
      redis.zadd(TELEMETRY_KEYS.sessionsZset, { score: expiresAt, member: sessionMember }),
      redis.lpush(
        TELEMETRY_KEYS.geoPingsList,
        JSON.stringify({
          country: geo.country,
          region: geo.region,
          timestamp: nowMs,
        }),
      ),
    ]);

    await redis.ltrim(TELEMETRY_KEYS.geoPingsList, 0, TELEMETRY_CONFIG.recentPingLimit - 1);

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown telemetry heartbeat error";
    return NextResponse.json(
      {
        error: "telemetry_heartbeat_unavailable",
        message,
      },
      { status: 503 },
    );
  }
}
