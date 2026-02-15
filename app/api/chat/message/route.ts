import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { headers } from "next/headers";
import crypto from "crypto";

const ratelimit =
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
    ? new Ratelimit({
        redis: new Redis({
          url: process.env.UPSTASH_REDIS_REST_URL,
          token: process.env.UPSTASH_REDIS_REST_TOKEN,
        }),
        limiter: Ratelimit.slidingWindow(30, "5 m"),
        prefix: "chat_msg",
      })
    : null;

function hashIp(ip: string): string {
  return crypto.createHash("sha256").update(ip).digest("hex").slice(0, 16);
}

// POST /api/chat/message — send a message in a session
export async function POST(req: Request) {
  const headersList = await headers();
  const ip =
    headersList.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const ipHash = hashIp(ip);

  if (ratelimit) {
    const { success } = await ratelimit.limit(ipHash);
    if (!success) {
      return NextResponse.json(
        { error: "Slow down — too many messages." },
        { status: 429 }
      );
    }
  }

  try {
    const { session_id, body, sender_type } = await req.json();

    if (!session_id || !body || !sender_type) {
      return NextResponse.json(
        { error: "session_id, body, and sender_type are required" },
        { status: 400 }
      );
    }

    if (typeof body !== "string" || body.length > 2000) {
      return NextResponse.json(
        { error: "Message too long (max 2000 chars)" },
        { status: 400 }
      );
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Verify session exists and is open
    const { data: session } = await supabase
      .from("live_chat_sessions")
      .select("id, status")
      .eq("id", session_id)
      .single();

    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    if (session.status !== "open") {
      return NextResponse.json({ error: "Session is closed" }, { status: 410 });
    }

    const { data, error } = await supabase
      .from("live_chat_messages")
      .insert({
        session_id,
        sender_type,
        body: body.trim(),
      })
      .select("id, created_at")
      .single();

    if (error) {
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }

    // Audit log (fire-and-forget)
    supabase
      .from("analytics_events")
      .insert([
        {
          event_type: "chat_message",
          event_data: {
            session_id,
            sender_type,
            ip_hash: ipHash,
            body_length: body.trim().length,
          },
        },
      ])
      .then(() => {});

    return NextResponse.json({
      id: data.id,
      created_at: data.created_at,
    });
  } catch {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }
}
