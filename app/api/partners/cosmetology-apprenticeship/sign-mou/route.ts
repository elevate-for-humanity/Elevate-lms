// PUBLIC ROUTE: cosmetology MOU form
import { NextRequest, NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/supabase/admin';
import { logger } from '@/lib/logger';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withRuntime } from '@/lib/api/withRuntime';
import { safeError, safeInternalError } from '@/lib/api/safe-error';
import { generateCosmetologyMOUPdf } from '@/lib/documents/generate-cosmetology-mou-pdf';

export const runtime = 'nodejs';
export const maxDuration = 60;
export const dynamic = 'force-dynamic';

async function _POST(req: NextRequest) {
  try {
    const rateLimited = await applyRateLimit(req, 'contact');
    if (rateLimited) return rateLimited;

    const body = await req.json();
    const {
      salon_name,
      signer_name,
      signer_title,
      supervisor_name,
      supervisor_license,
      compensation_model,
      compensation_rate,
      signature_data,
      signed_at,
      mou_version,
    } = body || {};

    if (!salon_name || !signer_name || !signer_title) {
      return safeError('Salon name, signer name, and title are required.', 400);
    }
    if (!signature_data || !signature_data.startsWith('data:image/')) {
      return safeError('A valid digital signature is required.', 400);
    }
    if (!supervisor_name || !supervisor_license) {
      return safeError('Supervisor name and license number are required.', 400);
    }

    const db = await getAdminClient();

    const ipAddress =
      req.headers.get('x-forwarded-for') ||
      req.headers.get('x-real-ip') ||
      'unknown';
    const userAgent = req.headers.get('user-agent') || 'unknown';
    const now = new Date().toISOString();

    // Save MOU signature record
    const { data: mouRecord, error: insertError } = await db
      .from('mou_signatures')
      .insert({
        signer_name: signer_name.trim(),
        signer_title: signer_title.trim(),
        signature_data,
        signed_at: signed_at || now,
        agreed_at: now,
        ip_address: ipAddress,
        user_agent: userAgent,
        supervisor_name: supervisor_name?.trim(),
        supervisor_license: supervisor_license?.trim(),
        compensation_model,
        compensation_rate,
        mou_version: mou_version || '2025-cosmetology-01',
      })
      .select('id')
      .single();

    if (insertError) {
      logger.error('[cosmetology sign-mou] Insert error:', insertError);
      return safeInternalError(insertError, 'Failed to save MOU signature.');
    }

    // Audit record in partner_mous
    try {
      await db.from('partner_mous').insert({
        partner_id: '00000000-0000-0000-0000-000000000000',
        version: mou_version || '2025-cosmetology-01',
        status: 'signed',
        signed_at: signed_at || now,
        signed_by: signer_name.trim(),
        signature_ip: ipAddress,
      });
    } catch (e) {
      logger.warn('[cosmetology sign-mou] partner_mous insert failed (non-blocking):', e);
    }

    // Update matching partners row
    try {
      await db
        .from('partners')
        .update({
          mou_acknowledged: true,
          applied_at: signed_at || now,
          onboarding_step: 'mou_signed',
          updated_at: now,
        })
        .ilike('legal_name', salon_name.trim())
        .eq('program_type', 'cosmetology');
    } catch (e) {
      logger.warn('[cosmetology sign-mou] partners update failed (non-blocking):', e);
    }

    // Generate PDF and email
    try {
      const pdfBytes = await generateCosmetologyMOUPdf({
        salon_name,
        signer_name,
        signer_title,
        supervisor_name,
        supervisor_license,
        compensation_model,
        compensation_rate,
        signed_at: signed_at || now,
        signature_data,
        ip_address: ipAddress,
        mou_version: mou_version || '2025-cosmetology-01',
      });

      const pdfFileName = `cosmetology-mou/signed-mou-${Date.now()}-${signer_name.trim().replace(/\s+/g, '-').toLowerCase()}.pdf`;

      const { data: pdfUpload } = await db.storage
        .from('mous')
        .upload(pdfFileName, pdfBytes, { contentType: 'application/pdf', upsert: false });

      const { data: pdfUrlData } = db.storage.from('mous').getPublicUrl(pdfFileName);

      if (mouRecord?.id && pdfUpload) {
        await db
          .from('mou_signatures')
          .update({ pdf_url: pdfUrlData.publicUrl })
          .eq('id', mouRecord.id)
          .then(() => {})
          .catch(() => {});
      }

      const sgKey = process.env.SENDGRID_API_KEY;
      if (sgKey) {
        const pdfBase64 = Buffer.from(pdfBytes).toString('base64');
        const partnerEmail = body.contact_email;

        // Email copy to salon
        if (partnerEmail) {
          await fetch('https://api.sendgrid.com/v3/mail/send', {
            method: 'POST',
            headers: { Authorization: `Bearer ${sgKey}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
              personalizations: [{ to: [{ email: partnerEmail }] }],
              from: { email: 'noreply@elevateforhumanity.org', name: 'Elevate for Humanity' },
              reply_to: { email: 'elevate4humanityedu@gmail.com' },
              subject: `Your Signed MOU — ${salon_name} | Elevate Cosmetology Apprenticeship`,
              content: [{
                type: 'text/html',
                value: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
                  <div style="background:#581c87;padding:20px;border-radius:8px 8px 0 0;text-align:center">
                    <h1 style="color:#fff;margin:0;font-size:18px">Elevate for Humanity</h1>
                    <p style="color:#e9d5ff;margin:4px 0 0;font-size:12px">Technical and Career Institute · RAPIDS: 2025-IN-132302</p>
                  </div>
                  <div style="padding:28px;border:1px solid #e5e5e5;border-top:none">
                    <h2 style="color:#581c87">MOU Signed — Your Copy is Attached</h2>
                    <p>Hi ${signer_name},</p>
                    <p>Thank you for signing the Worksite Partner MOU for <strong>${salon_name}</strong>. Your fully executed copy is attached as a PDF.</p>
                    <p><strong>Both parties have signed:</strong></p>
                    <ul>
                      <li>✓ Elevate for Humanity — Elizabeth Greene, Founder & CEO</li>
                      <li>✓ ${salon_name} — ${signer_name}, ${signer_title}</li>
                    </ul>
                    <p><strong>Next step:</strong> Upload your required documents to complete onboarding.</p>
                    <p style="text-align:center;margin:24px 0">
                      <a href="https://www.elevateforhumanity.org/partners/cosmetology-apprenticeship/documents"
                        style="background:#7c3aed;color:#fff;padding:14px 28px;border-radius:8px;text-decoration:none;font-weight:bold">
                        Upload Required Documents
                      </a>
                    </p>
                    <p>Questions? Call <strong>(317) 314-3757</strong></p>
                    <p>Thank you,<br/><strong>Elizabeth Greene</strong><br/>Founder & CEO, Elevate for Humanity</p>
                  </div>
                </div>`,
              }],
              attachments: [{
                content: pdfBase64,
                filename: `Signed-MOU-${salon_name.replace(/\s+/g, '-')}.pdf`,
                type: 'application/pdf',
                disposition: 'attachment',
              }],
            }),
          });
        }

        // Admin copy
        const adminEmail = process.env.ALERT_EMAIL_TO || 'elevate4humanityedu@gmail.com';
        await fetch('https://api.sendgrid.com/v3/mail/send', {
          method: 'POST',
          headers: { Authorization: `Bearer ${sgKey}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            personalizations: [{ to: [{ email: adminEmail }] }],
            from: { email: 'noreply@elevateforhumanity.org', name: 'Elevate for Humanity' },
            subject: `[SIGNED MOU] ${salon_name} — Cosmetology Apprenticeship`,
            content: [{
              type: 'text/html',
              value: `<div style="font-family:Arial,sans-serif;max-width:600px">
                <h2>[MOU SIGNED] ${salon_name} — Cosmetology</h2>
                <table style="width:100%;border-collapse:collapse;font-size:13px">
                  <tr><td style="padding:6px;font-weight:bold;background:#f8f8f8">Salon</td><td style="padding:6px">${salon_name}</td></tr>
                  <tr><td style="padding:6px;font-weight:bold">Signer</td><td style="padding:6px">${signer_name} — ${signer_title}</td></tr>
                  <tr><td style="padding:6px;font-weight:bold;background:#f8f8f8">Supervisor</td><td style="padding:6px">${supervisor_name} — License: ${supervisor_license}</td></tr>
                  <tr><td style="padding:6px;font-weight:bold">Compensation</td><td style="padding:6px">${compensation_model || 'N/A'} — ${compensation_rate || 'N/A'}</td></tr>
                  <tr><td style="padding:6px;font-weight:bold;background:#f8f8f8">Signed At</td><td style="padding:6px">${now}</td></tr>
                  <tr><td style="padding:6px;font-weight:bold">IP</td><td style="padding:6px">${ipAddress}</td></tr>
                </table>
                <p>Signed PDF attached.</p>
              </div>`,
            }],
            attachments: [{
              content: Buffer.from(pdfBytes).toString('base64'),
              filename: `Signed-MOU-${salon_name.replace(/\s+/g, '-')}.pdf`,
              type: 'application/pdf',
              disposition: 'attachment',
            }],
          }),
        });
      }
    } catch (pdfErr) {
      logger.warn('[cosmetology sign-mou] PDF/email step failed (non-blocking):', pdfErr);
    }

    logger.info(`[cosmetology sign-mou] MOU signed by ${signer_name} for ${salon_name}`);

    return NextResponse.json({ ok: true, mou_id: mouRecord?.id }, { status: 201 });
  } catch (error) {
    logger.error('[cosmetology sign-mou] Error:', error);
    return safeInternalError(error, 'An unexpected error occurred. Please try again.');
  }
}

export const POST = withRuntime(_POST);
