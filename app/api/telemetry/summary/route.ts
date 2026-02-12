import { NextResponse } from "next/server";
import { TELEMETRY_CONFIG, TELEMETRY_KEYS, getRedis } from "@/lib/redis";

export const runtime = "edge";

type TelemetryPing = {
  country: string;
  region: string;
  timestamp: number;
};

function parsePing(raw: unknown): TelemetryPing | null {
  try {
    if (!raw) {
      return null;
    }

    const parsed =
      typeof raw === "string"
        ? (JSON.parse(raw) as TelemetryPing)
        : (raw as TelemetryPing);

    if (
      typeof parsed.country !== "string" ||
      typeof parsed.region !== "string" ||
      typeof parsed.timestamp !== "number"
    ) {
      return null;
    }

    return {
      country: parsed.country,
      region: parsed.region,
      timestamp: parsed.timestamp,
    };
  } catch {
    return null;
  }
}

export async function GET() {
  try {
    const redis = getRedis();
    const nowMs = Date.now();

    await redis.zremrangebyscore(TELEMETRY_KEYS.sessionsZset, 0, nowMs);

    const [activeUsers, recentPingRaw] = await Promise.all([
      redis.zcard(TELEMETRY_KEYS.sessionsZset),
      redis.lrange(TELEMETRY_KEYS.geoPingsList, 0, TELEMETRY_CONFIG.recentPingLimit - 1),
    ]);

    const recentPings = recentPingRaw
      .map((entry) => parsePing(entry))
      .filter((entry): entry is TelemetryPing => Boolean(entry));

    return NextResponse.json({
      activeUsers,
      recentPings,
      updatedAt: new Date(nowMs).toISOString(),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown telemetry summary error";
    return NextResponse.json(
      {
        error: "telemetry_summary_unavailable",
        message,
      },
      { status: 503 },
    );
  }
}
