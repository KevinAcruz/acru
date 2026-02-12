"use client";

import { useEffect, useState } from "react";

export type TelemetryPing = {
  country: string;
  region: string;
  latitude: number | null;
  longitude: number | null;
  timestamp: number;
};

export type TelemetrySummary = {
  activeUsers: number;
  recentPings: TelemetryPing[];
  updatedAt: string;
};

// Slower polling keeps Redis usage low while still showing useful live activity.
const HEARTBEAT_INTERVAL_MS = 60_000;
const SUMMARY_INTERVAL_MS = 15_000;

function getSessionId(): string {
  const key = "acru-telemetry-session-id";
  const existing = window.localStorage.getItem(key);
  if (existing) {
    return existing;
  }

  const sessionId = crypto.randomUUID().replace(/-/g, "");
  window.localStorage.setItem(key, sessionId);
  return sessionId;
}

async function postHeartbeat(sessionId: string): Promise<void> {
  await fetch("/api/telemetry/heartbeat", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ sessionId }),
  });
}

async function fetchSummary(): Promise<TelemetrySummary | null> {
  const response = await fetch("/api/telemetry/summary", {
    method: "GET",
    cache: "no-store",
  });

  if (!response.ok) {
    return null;
  }

  return (await response.json()) as TelemetrySummary;
}

export function useTelemetry() {
  const [summary, setSummary] = useState<TelemetrySummary | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const sessionId = getSessionId();
    let isCancelled = false;

    const sendBeat = async () => {
      try {
        await postHeartbeat(sessionId);
      } catch {
        if (!isCancelled) {
          setError("Telemetry heartbeat unavailable.");
        }
      }
    };

    const refreshSummary = async () => {
      try {
        const payload = await fetchSummary();
        if (!payload || isCancelled) {
          if (!isCancelled) {
            setError("Telemetry unavailable.");
          }
          return;
        }

        setSummary(payload);
        setError(null);
      } catch {
        if (!isCancelled) {
          setError("Telemetry summary unavailable.");
        }
      }
    };

    sendBeat();
    refreshSummary();

    const heartbeatTimer = window.setInterval(sendBeat, HEARTBEAT_INTERVAL_MS);
    const summaryTimer = window.setInterval(refreshSummary, SUMMARY_INTERVAL_MS);

    return () => {
      isCancelled = true;
      window.clearInterval(heartbeatTimer);
      window.clearInterval(summaryTimer);
    };
  }, []);

  return {
    summary,
    error,
  };
}
