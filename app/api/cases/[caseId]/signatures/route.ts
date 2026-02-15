import { logger } from '@/lib/logger';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { addSignature, checkSignatureCompleteness } from '@/lib/workflow/case-management';
import { applyRateLimit } from '@/lib/api/withRateLimit';

export async function POST(req: Request, { params }: { params: Promise<{ caseId: string }> }) {
  try {
    const rateLimited = await applyRateLimit(req, 'api');
    if (rateLimited) return rateLimited;

    const supabase = await createClient();
    const { data: { user }, error: authErr } = await supabase.auth.getUser();
    
    if (authErr || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { caseId } = await params;
    const body = await req.json();
    const { signerRole, signerName, signerEmail, agreementType, agreementVersion, signatureData } = body;

    if (!signerRole || !agreementType) {
      return NextResponse.json({ error: 'signerRole and agreementType are required' }, { status: 400 });
    }

    const { data: enrollmentCase } = await supabase
      .from('enrollment_cases')
      .select('student_id, program_holder_id, employer_id')
      .eq('id', caseId)
      .single();

    if (!enrollmentCase) {
      return NextResponse.json({ error: 'Case not found' }, { status: 404 });
    }

    const isAuthorized = 
      user.id === enrollmentCase.student_id ||
      user.id === enrollmentCase.program_holder_id ||
      user.id === enrollmentCase.employer_id;

    if (!isAuthorized) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();
      
      if (!profile || !['admin', 'staff'].includes(profile.role)) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    const result = await addSignature({
      caseId,
      signerRole,
      signerId: user.id,
      signerName: signerName || user.email || 'Unknown',
      signerEmail: signerEmail || user.email || '',
      agreementType,
      agreementVersion,
      signatureData,
    });

    if (!result.success) {
      return NextResponse.json({ error: 'Failed to add signature' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      completeness: result.completeness,
      message: result.completeness.complete 
        ? 'All signatures complete. Case activated.' 
        : `Signature added. Missing: ${result.completeness.missing.join(', ')}`,
    });
  } catch (err: any) {
    logger.error('[POST /api/cases/[caseId]/signatures] Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(req: Request, { params }: { params: Promise<{ caseId: string }> }) {
  try {
    const rateLimited = await applyRateLimit(req, 'api');
    if (rateLimited) return rateLimited;

    const supabase = await createClient();
    const { data: { user }, error: authErr } = await supabase.auth.getUser();
    
    if (authErr || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { caseId } = await params;

    const { data: signatures, error } = await supabase
      .from('apprentice_agreements')
      .select('id, signer_role, signer_name, signer_email, agreement_type, agreement_version, signed_at, created_at')
      .eq('case_id', caseId)
      .order('created_at', { ascending: true });

    if (error) {
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }

    const completeness = await checkSignatureCompleteness(caseId);

    return NextResponse.json({
      signatures: signatures || [],
      completeness,
    });
  } catch (err: any) {
    logger.error('[GET /api/cases/[caseId]/signatures] Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
