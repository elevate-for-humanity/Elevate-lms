import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@/lib/auth';
import { withApiAudit } from '@/lib/audit/withApiAudit';

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
  // Program details go into metadata; banking is omitted until encryption is ready.
  const { data: holder, error: upsertError } = await supabase
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
    .single();

  if (upsertError) {
    return NextResponse.json(
      { error: 'Failed to save setup data' },
      { status: 500 }
    );
  }

  // Assign program_holder role so the portal layout and auth guards work.
  // Uses service role to bypass RLS on profiles.
  const { createAdminClient } = await import('@/lib/supabase/admin');
  const admin = createAdminClient();
  if (admin) {
    await admin
      .from('profiles')
      .update({ role: 'program_holder' })
      .eq('id', user.id);
  }

  return NextResponse.json({ success: true, holderId: holder?.id });
}

export const POST = withApiAudit('/api/program-holder/setup', _POST);
