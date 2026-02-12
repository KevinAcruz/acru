import { Redis } from "@upstash/redis";

let cachedRedis: Redis | null = null;

function normalizeEnv(value: string | undefined): string {
  if (!value) {
    return "";
  }

  const trimmed = value.trim();
  const withoutQuotes = trimmed.replace(/^['"]|['"]$/g, "");
  return withoutQuotes.trim();
}

export function getRedis(): Redis {
  if (cachedRedis) {
    return cachedRedis;
  }

  const redisUrl = normalizeEnv(process.env.UPSTASH_REDIS_REST_URL);
  const redisToken = normalizeEnv(process.env.UPSTASH_REDIS_REST_TOKEN);

  if (!redisUrl || !redisToken) {
    throw new Error("Missing Upstash Redis env vars: UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN");
  }

  if (!/^https:\/\//i.test(redisUrl)) {
    throw new Error("Invalid UPSTASH_REDIS_REST_URL. Expected an https URL.");
  }

  cachedRedis = new Redis({
    url: redisUrl,
    token: redisToken,
  });

  return cachedRedis;
}

export const TELEMETRY_KEYS = {
  sessionsZset: "telemetry:sessions:z",
  sessionPrefix: "telemetry:session:",
  geoPingsList: "telemetry:geo-pings",
};

export const TELEMETRY_CONFIG = {
  sessionTtlSec: 45,
  recentPingLimit: 50,
  rateLimitWindowSec: 60,
  rateLimitMaxPerWindow: 20,
};
