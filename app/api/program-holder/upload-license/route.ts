import { NextRequest, NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/supabase/admin';
import { createRouteHandlerClient } from '@/lib/auth';
import { cookies } from 'next/headers';
import { logger } from '@/lib/logger';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function _POST(req: NextRequest) {
  const rateLimited = await applyRateLimit(req, 'api');
  if (rateLimited) return rateLimited;

  const supabase = await createRouteHandlerClient({ cookies });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const adminClient = await getAdminClient();
  if (!adminClient) return NextResponse.json({ error: 'Server error' }, { status: 500 });

  const { data: prof } = await adminClient
    .from('profiles')
    .select('program_holder_id')
    .eq('id', user.id)
    .single();

  if (!prof?.program_holder_id) {
    return NextResponse.json({ error: 'No program holder assigned' }, { status: 400 });
  }

  const phId = prof.program_holder_id;

  const formData = await req.formData();
  const file = formData.get('license') as File | null;

  if (!file) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 });
  }

  // Validate file type
  const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];
  if (!allowedTypes.includes(file.type)) {
    return NextResponse.json({ error: 'File must be PDF, JPG, or PNG' }, { status: 400 });
  }

  // Max 10MB
  if (file.size > 10 * 1024 * 1024) {
    return NextResponse.json({ error: 'File must be under 10MB' }, { status: 400 });
  }

  const ext = file.name.split('.').pop() || 'pdf';
  const path = `program_holders/${phId}/hvac_license.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  const { error: uploadError } = await adminClient.storage
    .from('agreements')
    .upload(path, buffer, { contentType: file.type, upsert: true });

  if (uploadError) {
    logger.error('License upload failed', undefined, { detail: uploadError.message });
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }

  // Save path to program_holders
  const { error: updateError } = await adminClient
    .from('program_holders')
    .update({ hvac_license_url: path, hvac_license_uploaded_at: new Date().toISOString() })
    .eq('id', phId);

  if (updateError) {
    logger.error('License DB update failed', updateError);
    // Non-fatal — file is uploaded, just log it
  }

  // Notify admin
  try {
    const { data: holder } = await adminClient
      .from('program_holders')
      .select('organization_name, contact_name, contact_email')
      .eq('id', phId)
      .single();

    await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.SENDGRID_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        personalizations: [{
          to: [{ email: 'info@elevateforhumanity.org', name: 'Elevate for Humanity' }],
          subject: `HVAC License Uploaded — ${holder?.organization_name || 'Program Holder'}`,
        }],
        from: { email: 'info@elevateforhumanity.org', name: 'Elevate for Humanity' },
        content: [{
          type: 'text/html',
          value: `<!DOCTYPE html><html><body style="font-family: Arial, sans-serif; color: #1e293b; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #1e293b;">📄 HVAC License Uploaded</h2>
            <p><strong>${holder?.organization_name}</strong> has uploaded their HVAC contractor license.</p>
            <table style="width:100%; border-collapse:collapse; margin:16px 0;">
              <tr><td style="padding:8px; border:1px solid #e2e8f0; font-weight:600;">Organization</td><td style="padding:8px; border:1px solid #e2e8f0;">${holder?.organization_name}</td></tr>
              <tr><td style="padding:8px; border:1px solid #e2e8f0; font-weight:600;">Contact</td><td style="padding:8px; border:1px solid #e2e8f0;">${holder?.contact_name}</td></tr>
              <tr><td style="padding:8px; border:1px solid #e2e8f0; font-weight:600;">Email</td><td style="padding:8px; border:1px solid #e2e8f0;">${holder?.contact_email}</td></tr>
              <tr><td style="padding:8px; border:1px solid #e2e8f0; font-weight:600;">File</td><td style="padding:8px; border:1px solid #e2e8f0;">${path}</td></tr>
              <tr><td style="padding:8px; border:1px solid #e2e8f0; font-weight:600;">Uploaded</td><td style="padding:8px; border:1px solid #e2e8f0;">${new Date().toLocaleString('en-US', { timeZone: 'America/New_York' })} ET</td></tr>
            </table>
            <div style="text-align:center; margin:24px 0;">
              <a href="https://elevateforhumanity.org/admin/program-holders/${phId}" style="background-color:#2563eb; color:white; padding:12px 24px; border-radius:8px; text-decoration:none; font-weight:bold;">Review in Admin Dashboard</a>
            </div>
          </body></html>`,
        }],
      }),
    });
  } catch (emailErr) {
    logger.error('License upload admin notification failed', emailErr);
  }

  return NextResponse.json({ success: true, path });
}

export const POST = withApiAudit('/api/program-holder/upload-license', _POST);
