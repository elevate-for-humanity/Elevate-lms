import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { headers } from "next/headers";
import crypto from "crypto";
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';

// 5 requests per 5 minutes per IP
const ratelimit =
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
    ? new Ratelimit({
        redis: new Redis({
          url: process.env.UPSTASH_REDIS_REST_URL,
          token: process.env.UPSTASH_REDIS_REST_TOKEN,
        }),
        limiter: Ratelimit.slidingWindow(5, "5 m"),
        prefix: "newsletter",
      })
    : null;

function hashIp(ip: string): string {
  return crypto.createHash("sha256").update(ip).digest("hex").slice(0, 16);
}

async function _POST(req: Request) {
    const rateLimited = await applyRateLimit(req, 'api');
    if (rateLimited) return rateLimited;

  const headersList = await headers();
  const ip =
    headersList.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const ipHash = hashIp(ip);
  const ua = headersList.get("user-agent") ?? "unknown";

  // Rate limit check
  if (ratelimit) {
    const { success } = await ratelimit.limit(ipHash);
    if (!success) {
      return NextResponse.json(
        { error: "Too many requests. Try again in a few minutes." },
        { status: 429 }
      );
    }
  }

  try {
    const { email, source } = await req.json();

    const normalized =
      typeof email === "string" ? email.trim().toLowerCase() : "";

    if (!normalized || normalized.length > 254 || !normalized.includes("@")) {
      return NextResponse.json({ error: "Invalid email" }, { status: 400 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { error } = await supabase
      .from("newsletter_subscribers")
      .insert([{ email: normalized, source: source ?? "website" }]);

    const duplicate = error?.code === "23505";

    if (error && !duplicate) {
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }

    // Lightweight audit log (fire-and-forget)
    supabase
      .from("analytics_events")
      .insert([
        {
          event_type: "newsletter_signup",
          event_data: {
            email_domain: normalized.split("@")[1],
            source: source ?? "website",
            duplicate,
            ip_hash: ipHash,
            ua: ua.slice(0, 120),
          },
        },
      ])
      .then(() => {});

    return NextResponse.json({ ok: true, duplicate });
  } catch {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }
}
export const POST = withApiAudit('/api/newsletter', _POST);
