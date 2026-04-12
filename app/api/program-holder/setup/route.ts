import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@/lib/auth';
import { getAdminClient } from '@/lib/supabase/admin';
import { withApiAudit } from '@/lib/audit/withApiAudit';
import { trySendEmail } from '@/lib/email';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function _POST(req: NextRequest) {
  const supabase = await createRouteHandlerClient({ cookies });

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const {
    organizationName,
    programName,
    programType,
    programDuration,
    certificationOffered,
    targetIndustry,
    prerequisitesRequired,
    deliveryMethod,
    assessmentType,
    customInstructions,
    syllabusUrl,
    // Banking — stored in metadata; must be encrypted before production use
    accountHolderName,
    bankName,
    accountNumber,
    routingNumber,
    accountType,
    bankDocumentUrl,
  } = body;

  if (!organizationName || !programName || !programType) {
    return NextResponse.json(
      { error: 'organizationName, programName, and programType are required' },
      { status: 400 }
    );
  }

  // Reject banking submissions in production until column-level encryption is
  // implemented. Storing account/routing numbers in plaintext JSONB is unsafe.
  if (accountNumber && process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { error: 'Banking information cannot be submitted yet. Please contact support.' },
      { status: 422 }
    );
  }

  // Upsert into program_holders using user_id as the conflict key.
  // Uses admin client to bypass RLS — user is already authenticated above.
  const admin = await getAdminClient();
  const { data: holder, error: upsertError } = await admin
    .from('program_holders')
    .upsert(
      {
        user_id: user.id,
        organization_name: organizationName,
        name: organizationName,
        status: 'pending',
        metadata: {
          program_name: programName,
          program_type: programType,
          program_duration: programDuration || null,
          certification_offered: certificationOffered || null,
          target_industry: targetIndustry || null,
          prerequisites_required: prerequisitesRequired || null,
          delivery_method: deliveryMethod || null,
          assessment_type: assessmentType || null,
          custom_instructions: customInstructions || null,
          syllabus_url: syllabusUrl || null,
          // Banking stored only in non-production environments pending encryption.
          // In production the block above returns 422 before reaching here.
          banking: accountNumber
            ? {
                account_holder_name: accountHolderName || null,
                bank_name: bankName || null,
                account_type: accountType || 'checking',
                // Mask all but last 4 digits so the stored value is non-sensitive
                routing_number: routingNumber ? `****${String(routingNumber).slice(-4)}` : null,
                account_number: accountNumber ? `****${String(accountNumber).slice(-4)}` : null,
                bank_document_url: bankDocumentUrl || null,
              }
            : null,
          setup_submitted_at: new Date().toISOString(),
        },
      },
      { onConflict: 'user_id' }
    )
    .select('id')
    .maybeSingle();

  if (upsertError) {
    return NextResponse.json(
      { error: 'Failed to save setup data' },
      { status: 500 }
    );
  }

  // Assign program_holder role so the portal layout and auth guards work.
  await admin
    .from('profiles')
    .update({ role: 'program_holder' })
    .eq('id', user.id);

  // Notify admin of new program holder submission
  await trySendEmail({
    to: 'elevate4humanityedu@gmail.com',
    subject: `New Program Holder Submission — ${organizationName}`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px;">
        <div style="border-bottom:2px solid #111;padding-bottom:10px;margin-bottom:16px;">
          <div style="font-size:14px;font-weight:bold;text-transform:uppercase;letter-spacing:1px;">Elevate for Humanity</div>
          <div style="font-size:10px;color:#555;">Program Holder Application — Admin Notification</div>
        </div>
        <p style="font-size:13px;">A new program holder has completed onboarding and is awaiting approval.</p>
        <table style="width:100%;border-collapse:collapse;font-size:12px;margin:16px 0;">
          <tr><td style="padding:6px 10px;border-bottom:1px solid #ddd;font-weight:bold;width:40%;">Organization</td><td style="padding:6px 10px;border-bottom:1px solid #ddd;">${organizationName}</td></tr>
          <tr><td style="padding:6px 10px;border-bottom:1px solid #ddd;font-weight:bold;">Program</td><td style="padding:6px 10px;border-bottom:1px solid #ddd;">${body.programName || '—'}</td></tr>
          <tr><td style="padding:6px 10px;border-bottom:1px solid #ddd;font-weight:bold;">Program Type</td><td style="padding:6px 10px;border-bottom:1px solid #ddd;">${body.programType || '—'}</td></tr>
          <tr><td style="padding:6px 10px;border-bottom:1px solid #ddd;font-weight:bold;">User ID</td><td style="padding:6px 10px;border-bottom:1px solid #ddd;">${user.id}</td></tr>
        </table>
        <p style="font-size:12px;color:#555;">Log in to the admin dashboard to review and approve this application.</p>
        <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://www.elevateforhumanity.org'}/admin/program-holders"
           style="display:inline-block;margin-top:12px;background:#111;color:white;padding:10px 20px;text-decoration:none;font-size:12px;font-weight:bold;">
          Review Application →
        </a>
      </div>`,
  });

  return NextResponse.json({ success: true, holderId: holder?.id });
}

export const POST = withApiAudit('/api/program-holder/setup', _POST);
