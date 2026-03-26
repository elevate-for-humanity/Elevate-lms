import { NextResponse } from "next/server";
import { detectAIBot, isRateLimited, logRequest } from '@/lib/security/ai-protection';

import { createClient } from "@/lib/supabase/server";
import { logger } from '@/lib/logger';
import { toErrorMessage } from '@/lib/safe';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';
export const runtime = 'nodejs';
export const maxDuration = 60;

export const dynamic = 'force-dynamic';

async function _POST(req: Request) {
    const rateLimited = await applyRateLimit(req, 'api');
    if (rateLimited) return rateLimited;

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
export const POST = withApiAudit('/api/security/scan-event', _POST);
