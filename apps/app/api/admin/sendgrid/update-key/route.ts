// Admin-only: validate and store a new SendGrid API key
// NOTE: This validates the key against SendGrid but cannot write to .env at runtime.
// It stores the key in the admin_settings table for runtime use.
import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth/require-role';
import { requireAdminClient } from '@/lib/supabase/admin';
import { applyRateLimit } from '@/lib/api/withRateLimit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const rateLimited = await applyRateLimit(req, 'strict');
  if (rateLimited) return rateLimited;
  try {
    await requireRole(['admin']);
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const apiKey = String(body?.apiKey ?? '').trim();

  if (!apiKey) return NextResponse.json({ error: 'Missing apiKey' }, { status: 400 });
  if (!apiKey.startsWith('SG.')) {
    return NextResponse.json({ error: 'Invalid SendGrid API key format — must start with SG.' }, { status: 400 });
  }

  // Validate the key against SendGrid before storing
  try {
    const res = await fetch('https://api.sendgrid.com/v3/user/profile', {
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    if (res.status === 401 || res.status === 403) {
      return NextResponse.json({ ok: false, error: 'SendGrid rejected this key — check it is correct and has Mail Send permissions.' }, { status: 400 });
    }
    if (!res.ok) {
      return NextResponse.json({ ok: false, error: `SendGrid validation failed: ${res.status}` }, { status: 400 });
    }
  } catch {
    return NextResponse.json({ ok: false, error: 'Could not reach SendGrid to validate key.' }, { status: 502 });
  }

  // Store in admin_settings table for runtime use
  try {
    const db = await requireAdminClient();
    await db.from('admin_settings').upsert(
      { key: 'SENDGRID_API_KEY', value: apiKey, updated_at: new Date().toISOString() },
      { onConflict: 'key' },
    );
  } catch {
    // Non-fatal — key is valid, just couldn't persist to DB
    return NextResponse.json({
      ok: true,
      message: 'Key validated successfully. Update SENDGRID_API_KEY in your environment variables to persist it.',
    });
  }

  return NextResponse.json({
    ok: true,
    message: 'SendGrid API key validated and saved. Redeploy to apply the new key.',
  });
}
