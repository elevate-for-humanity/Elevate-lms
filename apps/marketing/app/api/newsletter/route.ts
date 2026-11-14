// PUBLIC ROUTE: public newsletter subscription
import { NextResponse } from 'next/server';
import { requireAdminClient } from '@/lib/supabase/admin';
import { headers } from 'next/headers';
import crypto from 'crypto';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { checkRateLimit } from '@/lib/rate-limit';
import { withApiAudit } from '@/lib/audit/withApiAudit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

function hashIp(ip: string): string {
  return crypto.createHash('sha256').update(ip).digest('hex').slice(0, 16);
}

async function _POST(req: Request) {
  const rateLimited = await applyRateLimit(req, 'api');
  if (rateLimited) return rateLimited;

  const headersList = await headers();
  const ip = headersList.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
  const ipHash = hashIp(ip);
  const ua = headersList.get('user-agent') ?? 'unknown';

  // Newsletter-specific shared Redis limit: 5 requests per 5 minutes per IP.
  const newsletterLimit = await checkRateLimit({
    key: `newsletter:${ipHash}`,
    limit: 5,
    windowSeconds: 300,
  });
  if (!newsletterLimit.ok) {
    return NextResponse.json(
      { error: 'Too many requests. Try again in a few minutes.' },
      { status: 429 },
    );
  }

  try {
    const { email, source } = await req.json();

    const normalized = typeof email === 'string' ? email.trim().toLowerCase() : '';

    if (!normalized || normalized.length > 254 || !normalized.includes('@')) {
      return NextResponse.json({ error: 'Invalid email' }, { status: 400 });
    }

    const supabase = await requireAdminClient();

    const { error } = await supabase
      .from('newsletter_subscribers')
      .insert([{ email: normalized, source: source ?? 'website' }]);

    const duplicate = error?.code === '23505';

    if (error && !duplicate) {
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }

    supabase
      .from('analytics_events')
      .insert([
        {
          event_type: 'newsletter_signup',
          event_data: {
            email_domain: normalized.split('@')[1],
            source: source ?? 'website',
            duplicate,
            ip_hash: ipHash,
            ua: ua.slice(0, 120),
          },
        },
      ])
      .then(() => {});

    return NextResponse.json({ ok: true, duplicate });
  } catch {
    return NextResponse.json({ error: 'Bad request' }, { status: 400 });
  }
}
export const POST = withApiAudit('/api/newsletter', _POST);
