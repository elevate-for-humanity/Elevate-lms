import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { logger } from '@/lib/logger';
import { applyRateLimit } from '@/lib/api/withRateLimit';

export async function POST(req: Request) {
  try {
    const rateLimited = await applyRateLimit(req, 'api');
    if (rateLimited) return rateLimited;

    const body = await req.json();
    const { orgName, contactName, title, email, signature, agreed } =
      body || {};

    // Validation
    if (!orgName || !contactName || !title || !email || !signature) {
      return NextResponse.json(
        { error: 'All fields are required.' },
        { status: 400 }
      );
    }

    if (!agreed) {
      return NextResponse.json(
        { error: 'You must agree to the terms.' },
        { status: 400 }
      );
    }

    // Verify signature matches contact name (basic validation)
    if (signature.toLowerCase().trim() !== contactName.toLowerCase().trim()) {
      return NextResponse.json(
        { error: 'Digital signature must match your name exactly.' },
        { status: 400 }
      );
    }

    const supabase = await createClient();
  const _admin = createAdminClient(); const db = _admin || supabase;

    // Insert into mou_signatures table
    const { error } = await db.from('mou_signatures').insert({
      organization_name: orgName,
      contact_name: contactName,
      contact_title: title,
      contact_email: email,
      digital_signature: signature,
      agreed: true,
      ip_address:
        req.headers.get('x-forwarded-for') ||
        req.headers.get('x-real-ip') ||
        'unknown',
      user_agent: req.headers.get('user-agent') || 'unknown',
    });

    if (error) {
      logger.error('Supabase insert error:', error);
      return NextResponse.json(
        { error: 'Unable to save MOU signature.' },
        { status: 500 }
      );
    }

    // Note: Send confirmation email to partner
    // Note: Send notification email to admin

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    logger.error(
      'API error:',
      err instanceof Error ? err : new Error(String(err))
    );
    return NextResponse.json({ error: 'Unexpected error.' }, { status: 500 });
  }
}
