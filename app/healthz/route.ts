import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    status: "ok",
    service: "portfolio-web",
    timestamp: new Date().toISOString(),
  });
}
