// AUTH: Intentionally public — no authentication required
import { NextResponse } from "next/server";
import { getRuntimeReadiness } from "@/lib/tax-software/config/runtime-readiness";

export const dynamic = "force-dynamic";

export async function GET() {
  const readiness = getRuntimeReadiness();

  return NextResponse.json(readiness, {
    status: readiness.ok ? 200 : 503,
  });
}
