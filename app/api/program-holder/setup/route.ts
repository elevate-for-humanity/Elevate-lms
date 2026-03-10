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

  // Upsert into program_holders using user_id as the conflict key.
  // Program details and banking info go into metadata since the table
  // has no dedicated columns for them yet.
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
          // Banking — plaintext for now; encrypt before production
          banking: accountNumber
            ? {
                account_holder_name: accountHolderName || null,
                bank_name: bankName || null,
                account_type: accountType || 'checking',
                routing_number: routingNumber || null,
                account_number: accountNumber || null,
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

  return NextResponse.json({ success: true, holderId: holder?.id });
}

export const POST = withApiAudit('/api/program-holder/setup', _POST);
