/**
 * Admin MOU management API.
 * POST { action: 'create' | 'send' | 'void' }
 * Writes to existing partner_mous + mou_templates tables.
 */
import { NextRequest, NextResponse } from 'next/server';
import { apiRequireAdmin } from '@/lib/admin/guards';
import { getAdminClient } from '@/lib/supabase/admin';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { safeError, safeInternalError } from '@/lib/api/safe-error';
import { trySendEmail } from '@/lib/email/sendgrid';
import { logger } from '@/lib/logger';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;

  const auth = await apiRequireAdmin(request);
  if (auth.error) return auth.error;

  let body: Record<string, unknown>;
  try { body = await request.json(); }
  catch { return safeError('Invalid request body', 400); }

  const { action } = body;
  const supabase = await getAdminClient();
  if (!supabase) return safeInternalError(new Error('DB unavailable'), 'Failed');

  // ── CREATE ──────────────────────────────────────────────────────────────────
  if (action === 'create') {
    const { template_id, title, content, partner_name, partner_email, expiry_date } = body as Record<string, string>;

    let mouContent = content ?? null;
    let mouTitle = title ?? null;
    let mouVersion = '1.0';

    // If using a template, fetch its content
    if (template_id) {
      const { data: tmpl } = await supabase
        .from('mou_templates')
        .select('title, content, version')
        .eq('id', template_id)
        .single();
      if (!tmpl) return safeError('Template not found', 404);
      mouContent = tmpl.content;
      mouTitle = tmpl.title ?? mouTitle;
      mouVersion = tmpl.version ?? '1.0';
    }

    if (!mouContent) return safeError('MOU content required', 400);

    // Find or create partner record
    let partnerId: string | null = null;
    if (partner_name) {
      const { data: existing } = await supabase
        .from('partners')
        .select('id')
        .ilike('name', partner_name)
        .maybeSingle();

      if (existing) {
        partnerId = existing.id;
      } else {
        const { data: newPartner } = await supabase
          .from('partners')
          .insert({ name: partner_name, email: partner_email ?? null, status: 'pending', created_at: new Date().toISOString() })
          .select('id')
          .single()
          .catch(() => ({ data: null }));
        partnerId = newPartner?.id ?? null;
      }
    }

    // Insert into partner_mous
    const { data: mou, error: mouErr } = await supabase
      .from('partner_mous')
      .insert({
        partner_id: partnerId,
        mou_version: mouVersion,
        status: 'pending',
        expiry_date: expiry_date || null,
        content: mouContent,
        title: mouTitle,
        created_by: auth.id,
        created_at: new Date().toISOString(),
      })
      .select('*, partners:partner_id(name)')
      .single();

    if (mouErr) {
      logger.error('[admin/mou] create failed', mouErr);
      return safeInternalError(mouErr, 'Failed to create MOU');
    }

    // Send email if partner_email provided
    if (partner_email && mou) {
      await trySendEmail({
        to: partner_email,
        subject: `MOU from ${PLATFORM_DEFAULTS.orgName} — ${mouTitle ?? 'Partnership Agreement'}`,
        html: `
          <p>Dear ${partner_name ?? 'Partner'},</p>
          <p>${PLATFORM_DEFAULTS.orgName} has prepared a Memorandum of Understanding for your review.</p>
          <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:24px;margin:16px 0">
            ${mouContent}
          </div>
          <p>Please review and reply to this email to confirm your agreement, or contact us at
          <a href="mailto:partnerships@${PLATFORM_DEFAULTS.canonicalDomain}">partnerships@${PLATFORM_DEFAULTS.canonicalDomain}</a>.</p>
          <p>— ${PLATFORM_DEFAULTS.orgName}</p>
        `,
        text: `MOU from ${PLATFORM_DEFAULTS.orgName}\n\n${mouContent?.replace(/<[^>]+>/g, ' ')}\n\nContact: partnerships@${PLATFORM_DEFAULTS.canonicalDomain}`,
        replyTo: 'partnerships@${PLATFORM_DEFAULTS.canonicalDomain}',
      });

      // Update status to sent
      await supabase.from('partner_mous').update({ status: 'sent' }).eq('id', mou.id);
    }

    return NextResponse.json({ success: true, mou: { ...mou, status: partner_email ? 'sent' : 'pending' } });
  }

  // ── VOID ────────────────────────────────────────────────────────────────────
  if (action === 'void') {
    const { mou_id } = body as { mou_id: string };
    if (!mou_id) return safeError('mou_id required', 400);

    const { error } = await supabase
      .from('partner_mous')
      .update({ status: 'void', updated_at: new Date().toISOString() })
      .eq('id', mou_id);

    if (error) return safeInternalError(error, 'Failed to void MOU');
    return NextResponse.json({ success: true });
  }

  // ── RESEND ──────────────────────────────────────────────────────────────────
  if (action === 'resend') {
    const { mou_id, partner_email } = body as { mou_id: string; partner_email: string };
    if (!mou_id || !partner_email) return safeError('mou_id and partner_email required', 400);

    const { data: mou } = await supabase
      .from('partner_mous')
      .select('title, content')
      .eq('id', mou_id)
      .single();

    if (!mou) return safeError('MOU not found', 404);

    await trySendEmail({
      to: partner_email,
      subject: `MOU from ${PLATFORM_DEFAULTS.orgName} — ${mou.title ?? 'Partnership Agreement'}`,
      html: `<p>Please review the attached MOU from ${PLATFORM_DEFAULTS.orgName}.</p><div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:24px">${mou.content ?? ''}</div>`,
      text: mou.content?.replace(/<[^>]+>/g, ' ') ?? '',
      replyTo: 'partnerships@${PLATFORM_DEFAULTS.canonicalDomain}',
    });

    await supabase.from('partner_mous').update({ status: 'sent', sent_at: new Date().toISOString() }).eq('id', mou_id);
    return NextResponse.json({ success: true, message: `Resent to ${partner_email}` });
  }

  return safeError('Unknown action', 400);
}
