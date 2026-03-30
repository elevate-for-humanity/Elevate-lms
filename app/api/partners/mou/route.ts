import { NextResponse } from 'next/server';

import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';
import { trySendEmail } from '@/lib/email/resend';
export const runtime = 'nodejs';
export const maxDuration = 60;

export const dynamic = 'force-dynamic';

async function _POST(req: Request) {
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

    // Insert into mou_signatures table
    const { error } = await supabase.from('mou_signatures').insert({
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

    const adminEmail = process.env.ADMIN_EMAIL || 'admin@elevateforhumanity.org';

    // Confirmation to partner — fire-and-forget
    trySendEmail({
      to: email,
      subject: 'MOU Signed — Elevate for Humanity',
      html: `<p>Hi ${contactName},</p>
<p>Thank you for signing the Memorandum of Understanding on behalf of <strong>${orgName}</strong>. We have received your signature and will be in touch shortly to discuss next steps.</p>
<p>If you have any questions, reply to this email or call us at (317) 314-3757.</p>
<p>— Elevate for Humanity Partnership Team</p>`,
    });

    // Internal notification to admin — fire-and-forget
    trySendEmail({
      to: adminEmail,
      subject: `New MOU Signed — ${orgName}`,
      html: `<p>A new MOU has been signed.</p>
<ul>
  <li><strong>Organization:</strong> ${orgName}</li>
  <li><strong>Contact:</strong> ${contactName} (${title})</li>
  <li><strong>Email:</strong> ${email}</li>
  <li><strong>Signed:</strong> ${new Date().toLocaleString()}</li>
</ul>
<p><a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://app.elevateforhumanity.org'}/admin/partners">View in Admin →</a></p>`,
    });

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    logger.error(
      'API error:',
      err instanceof Error ? err : new Error(String(err))
    );
    return NextResponse.json({ error: 'Unexpected error.' }, { status: 500 });
  }
}
export const POST = withApiAudit('/api/partners/mou', _POST);
