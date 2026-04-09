
import { NextRequest, NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/supabase/admin';
import { logger } from '@/lib/logger';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';
import { generateMOUPdf } from '@/lib/documents/generate-mou-pdf';
import { withRuntime } from '@/lib/api/withRuntime';

export const runtime = 'nodejs';
export const maxDuration = 60;

export const dynamic = 'force-dynamic';

async function _POST(req: NextRequest) {
  try {
    const rateLimited = await applyRateLimit(req, 'contact');
    if (rateLimited) return rateLimited;

    const body = await req.json();
    const {
      shop_name,
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

    // Validation
    if (!shop_name || !signer_name || !signer_title) {
      return NextResponse.json(
        { error: 'Shop name, signer name, and title are required.' },
        { status: 400 }
      );
    }

    if (!signature_data || !signature_data.startsWith('data:image/')) {
      return NextResponse.json(
        { error: 'A valid digital signature is required.' },
        { status: 400 }
      );
    }

    if (!supervisor_name || !supervisor_license) {
      return NextResponse.json(
        { error: 'Supervisor name and license number are required.' },
        { status: 400 }
      );
    }

    const supabase = await getAdminClient();
    if (!supabase) {
      return NextResponse.json({ error: 'Database unavailable' }, { status: 503 });
    }

    const ipAddress =
      req.headers.get('x-forwarded-for') ||
      req.headers.get('x-real-ip') ||
      'unknown';
    const userAgent = req.headers.get('user-agent') || 'unknown';

    // Find the matching application by shop name
    const { data: application } = await supabase
      .from('barbershop_partner_applications')
      .select('id, status')
      .ilike('shop_legal_name', shop_name.trim())
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    const now = new Date().toISOString();

    // Upload signature image to Supabase Storage (agreements bucket)
    // Store path reference instead of raw base64 blob in DB
    let signaturePath: string | null = null;
    try {
      const base64Data = signature_data.replace(/^data:image\/\w+;base64,/, '');
      const buffer = Buffer.from(base64Data, 'base64');
      const fileName = `barber-mou/${Date.now()}-${signer_name.trim().replace(/\s+/g, '-').toLowerCase()}.png`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('agreements')
        .upload(fileName, buffer, { contentType: 'image/png', upsert: false });
      if (!uploadError && uploadData) {
        signaturePath = uploadData.path;
      } else {
        logger.warn('[sign-mou] Storage upload failed, falling back to DB blob:', uploadError);
      }
    } catch (uploadErr) {
      logger.warn('[sign-mou] Storage upload exception, falling back to DB blob:', uploadErr);
    }

    // Insert MOU signature — use storage path if available, else fall back to data URL
    const { data: mouRecord, error: insertError } = await supabase
      .from('mou_signatures')
      .insert({
        signer_name: signer_name.trim(),
        signer_title: signer_title.trim(),
        signature_data: signaturePath ? null : signature_data,
        signature_path: signaturePath,
        signed_at: signed_at || now,
        ip_address: ipAddress,
        user_agent: userAgent,
        agreed_at: now,
        supervisor_name: supervisor_name?.trim(),
        supervisor_license: supervisor_license?.trim(),
        compensation_model,
        compensation_rate,
        mou_version: mou_version || '2025-01',
      })
      .select('id')
      .single();

    if (insertError) {
      logger.error('[sign-mou] Insert error:', insertError);
      return NextResponse.json(
        { error: 'Failed to save MOU signature. Please try again.' },
        { status: 500 }
      );
    }

    // Store in partner_mous (optional audit record — primary MOU signature already saved above)
    try {
      await supabase.from('partner_mous').insert({
        partner_id: application?.id || '00000000-0000-0000-0000-000000000000',
        version: mou_version || '2025-01',
        status: 'signed',
        signed_at: signed_at || now,
        signed_by: signer_name.trim(),
        signature_ip: ipAddress,
      });
    } catch (e) {
      logger.warn('[sign-mou] partner_mous insert failed (non-blocking):', e);
    }

    // Update application status if found
    if (application?.id) {
      await supabase
        .from('barbershop_partner_applications')
        .update({
          status: 'mou_signed',
          mou_acknowledged: true,
          updated_at: now,
        })
        .eq('id', application.id);

      logger.info(`[sign-mou] Application ${application.id} updated to mou_signed`);
    }

    // Generate signed PDF and email to partner + Elevate
    try {
      const pdfBytes = await generateMOUPdf({
        shop_name,
        signer_name,
        signer_title,
        supervisor_name,
        supervisor_license,
        compensation_model,
        compensation_rate,
        signed_at: signed_at || now,
        signature_data,
        ip_address: ipAddress,
        mou_version: mou_version || '2.0',
      });

      // Upload PDF to Supabase storage
      const pdfFileName = `barber-mou/signed-mou-${Date.now()}-${signer_name.trim().replace(/\s+/g, '-').toLowerCase()}.pdf`;
      const { data: pdfUpload } = await supabase.storage
        .from('mous')
        .upload(pdfFileName, pdfBytes, { contentType: 'application/pdf', upsert: false });

      // Get public URL
      const { data: pdfUrl } = supabase.storage.from('mous').getPublicUrl(pdfFileName);

      // Update mou_signatures with PDF path
      if (mouRecord?.id && pdfUpload) {
        await supabase.from('mou_signatures').update({ mou_final_pdf_url: pdfUrl.publicUrl }).eq('id', mouRecord.id);
      }

      // Update partners table
      await supabase.from('partners').update({
        mou_signed: true,
        mou_signed_at: signed_at || now,
        mou_final_pdf_url: pdfUrl.publicUrl,
        onboarding_step: 'mou_signed',
        updated_at: now,
      }).ilike('contact_email', '%' + (body.contact_email || shop_name) + '%');

      const pdfBase64 = Buffer.from(pdfBytes).toString('base64');
      const sgKey = process.env.SENDGRID_API_KEY;

      if (sgKey) {
        // Email PDF to partner
        const partnerEmail = body.contact_email;
        if (partnerEmail) {
          await fetch('https://api.sendgrid.com/v3/mail/send', {
            method: 'POST',
            headers: { Authorization: `Bearer ${sgKey}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
              personalizations: [{ to: [{ email: partnerEmail }] }],
              from: { email: 'noreply@elevateforhumanity.org', name: 'Elevate for Humanity' },
              reply_to: { email: 'elevate4humanityedu@gmail.com' },
              subject: `Your Signed MOU — ${shop_name} | Elevate for Humanity Barber Apprenticeship`,
              content: [{
                type: 'text/html',
                value: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
                  <div style="background:#1a1a2e;padding:20px;border-radius:8px 8px 0 0;text-align:center">
                    <h1 style="color:#fff;margin:0;font-size:18px">Elevate for Humanity</h1>
                    <p style="color:#aaa;margin:4px 0 0;font-size:12px">Technical and Career Institute · RAPIDS: 2025-IN-132301</p>
                  </div>
                  <div style="padding:28px;border:1px solid #e5e5e5;border-top:none">
                    <h2 style="color:#1a1a2e">MOU Signed — Your Copy is Attached</h2>
                    <p>Hi ${signer_name},</p>
                    <p>Thank you for signing the Employer Training Site MOU for <strong>${shop_name}</strong>. Your fully executed copy is attached to this email as a PDF.</p>
                    <p><strong>Both parties have signed:</strong></p>
                    <ul>
                      <li>✓ Elevate for Humanity — Elizabeth Greene, Founder & CEO</li>
                      <li>✓ ${shop_name} — ${signer_name}, ${signer_title}</li>
                    </ul>
                    <p><strong>Next step:</strong> Complete your Employer Agreement to finalize RAPIDS registration.</p>
                    <p style="text-align:center;margin:24px 0">
                      <a href="https://www.elevateforhumanity.org/partners/barbershop-apprenticeship/forms"
                        style="background:#1a1a2e;color:#fff;padding:14px 28px;border-radius:8px;text-decoration:none;font-weight:bold">
                        Complete Employer Agreement
                      </a>
                    </p>
                    <p>Questions? Call <strong>(317) 314-3757</strong></p>
                    <p>Thank you,<br/><strong>Elizabeth Greene</strong><br/>Founder & CEO, Elevate for Humanity</p>
                  </div>
                </div>`,
              }],
              attachments: [{
                content: pdfBase64,
                filename: `Signed-MOU-${shop_name.replace(/\s+/g, '-')}.pdf`,
                type: 'application/pdf',
                disposition: 'attachment',
              }],
            }),
          });
        }

        // Email PDF copy to Elevate
        const adminEmail = process.env.ALERT_EMAIL_TO || 'elevate4humanityedu@gmail.com';
        await fetch('https://api.sendgrid.com/v3/mail/send', {
          method: 'POST',
          headers: { Authorization: `Bearer ${sgKey}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            personalizations: [{ to: [{ email: adminEmail }] }],
            from: { email: 'noreply@elevateforhumanity.org', name: 'Elevate for Humanity' },
            subject: `[SIGNED MOU + PDF] ${shop_name} — ${signer_name}`,
            content: [{
              type: 'text/html',
              value: `<div style="font-family:Arial,sans-serif;max-width:600px">
                <h2>[MOU SIGNED] ${shop_name}</h2>
                <table style="width:100%;border-collapse:collapse;font-size:13px">
                  <tr><td style="padding:6px;font-weight:bold;background:#f8f8f8">Shop</td><td style="padding:6px">${shop_name}</td></tr>
                  <tr><td style="padding:6px;font-weight:bold">Signer</td><td style="padding:6px">${signer_name} — ${signer_title}</td></tr>
                  <tr><td style="padding:6px;font-weight:bold;background:#f8f8f8">Supervisor</td><td style="padding:6px">${supervisor_name || 'N/A'} — License: ${supervisor_license || 'N/A'}</td></tr>
                  <tr><td style="padding:6px;font-weight:bold">Compensation</td><td style="padding:6px">${compensation_model || 'N/A'} — ${compensation_rate || 'N/A'}</td></tr>
                  <tr><td style="padding:6px;font-weight:bold;background:#f8f8f8">Signed At</td><td style="padding:6px">${now}</td></tr>
                  <tr><td style="padding:6px;font-weight:bold">IP</td><td style="padding:6px">${ipAddress}</td></tr>
                </table>
                <p>Signed PDF attached. Also stored in Supabase mous bucket.</p>
              </div>`,
            }],
            attachments: [{
              content: pdfBase64,
              filename: `Signed-MOU-${shop_name.replace(/\s+/g, '-')}.pdf`,
              type: 'application/pdf',
              disposition: 'attachment',
            }],
          }),
        });
      }
    } catch (pdfErr) {
      logger.warn('[sign-mou] PDF generation failed (non-blocking):', pdfErr);
    }

    // Send admin notification email
    try {
      const ADMIN_EMAIL = process.env.PARTNER_NOTIFICATION_EMAIL || 'elevate4humanityedu@gmail.com';
      const sgKey = process.env.SENDGRID_API_KEY;
      if (sgKey) {
        await fetch('https://api.sendgrid.com/v3/mail/send', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${sgKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            personalizations: [{ to: [{ email: ADMIN_EMAIL }] }],
            from: { email: 'noreply@elevateforhumanity.org', name: 'Elevate for Humanity' },
            reply_to: { email: 'elevate4humanityedu@gmail.com' },
            subject: `[MOU SIGNED] ${shop_name.trim()} — Barber Apprenticeship Partnership`,
            content: [{
              type: 'text/html',
              value: `<div style="font-family:Arial,sans-serif;max-width:600px">
                <h2 style="color:#1e293b">MOU Signed — Barber Apprenticeship</h2>
                <table style="width:100%;border-collapse:collapse;margin:16px 0">
                  <tr><td style="padding:8px;border-bottom:1px solid #e5e7eb;font-weight:bold;width:180px">Shop Name</td><td style="padding:8px;border-bottom:1px solid #e5e7eb">${shop_name.trim()}</td></tr>
                  <tr><td style="padding:8px;border-bottom:1px solid #e5e7eb;font-weight:bold">Signer</td><td style="padding:8px;border-bottom:1px solid #e5e7eb">${signer_name.trim()} (${signer_title.trim()})</td></tr>
                  <tr><td style="padding:8px;border-bottom:1px solid #e5e7eb;font-weight:bold">Supervising Barber</td><td style="padding:8px;border-bottom:1px solid #e5e7eb">${supervisor_name?.trim() || 'N/A'} — License: ${supervisor_license?.trim() || 'N/A'}</td></tr>
                  <tr><td style="padding:8px;border-bottom:1px solid #e5e7eb;font-weight:bold">Compensation</td><td style="padding:8px;border-bottom:1px solid #e5e7eb">${compensation_model || 'N/A'} — ${compensation_rate || 'N/A'}</td></tr>
                  <tr><td style="padding:8px;border-bottom:1px solid #e5e7eb;font-weight:bold">Signed At</td><td style="padding:8px;border-bottom:1px solid #e5e7eb">${now}</td></tr>
                  <tr><td style="padding:8px;font-weight:bold">IP Address</td><td style="padding:8px">${ipAddress}</td></tr>
                </table>
                <p style="color:#64748b;font-size:13px">Application match: ${application?.id ? 'Yes — status updated to mou_signed' : 'No matching application found'}</p>
              </div>`,
            }],
          }),
        });
      }
    } catch (emailErr) {
      logger.warn('[sign-mou] Admin notification email failed:', emailErr);
    }

    logger.info(`[sign-mou] MOU signed by ${signer_name} for ${shop_name}`);

    return NextResponse.json({
      ok: true,
      mou_id: mouRecord?.id,
      application_updated: !!application?.id,
    });
  } catch (err) {
    logger.error('[sign-mou] Error:', err instanceof Error ? err : new Error(String(err)));
    return NextResponse.json(
      { error: 'An unexpected error occurred. Please try again.' },
      { status: 500 }
    );
  }
}

export const POST = withRuntime(withApiAudit('/api/partners/barbershop-apprenticeship/sign-mou', _POST));
