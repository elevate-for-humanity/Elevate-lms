import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';

// GET /api/chat/messages?session_id=xxx — fetch messages for a session
async function _GET(req: NextRequest) {
  
    const rateLimited = await applyRateLimit(req, 'api');
    if (rateLimited) return rateLimited;
const sessionId = req.nextUrl.searchParams.get("session_id");

  if (!sessionId) {
    return NextResponse.json(
      { error: "session_id is required" },
      { status: 400 }
    );
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data, error } = await supabase
    .from("live_chat_messages")
    .select("id, sender_type, body, created_at")
    .eq("session_id", sessionId)
    .order("created_at", { ascending: true });

  if (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }

  return NextResponse.json(data || []);
}
export const GET = withApiAudit('/api/chat/messages', _GET);
