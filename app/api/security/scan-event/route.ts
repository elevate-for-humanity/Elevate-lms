import { NextResponse } from "next/server";

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;
import { createClient } from "@/lib/supabase/server";
import { logger } from '@/lib/logger';
import { toErrorMessage } from '@/lib/safe';

export async function POST(req: Request) {
  const auth = req.headers.get("authorization") || "";
  const token = auth.replace(/^Bearer\s+/i, "");

  if (token !== process.env.INTERNAL_API_TOKEN) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { type, tool, status, findings } = await req.json();

  if (!type || !tool || !status) {
    return NextResponse.json(
      { error: "Missing required fields" },
      { status: 400 }
    );
  }

  const supabase = await createClient();

  const { error } = await supabase.from("security_scan_events").insert({
    type,
    tool,
    status,
    findings: findings ?? {},
  });

  if (error) {
    logger.error("Failed to insert security scan event:", error);
    return NextResponse.json({ error: toErrorMessage(error) }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
