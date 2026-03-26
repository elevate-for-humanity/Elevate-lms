import { logger } from '@/lib/logger';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';

async function _POST(request: NextRequest) {
    const rateLimited = await applyRateLimit(request, 'strict');
    if (rateLimited) return rateLimited;

  const supabase = await createClient();
  
  // Get current user
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { 
    programId, 
    certificationName, 
    provider,
    certificateUrl, 
    credentialNumber, 
    completionDate,
    expirationDate 
  } = body;

  if (!programId || !certificationName || !provider) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  // Check for existing pending submission
  const { data: existing } = await supabase
    .from('certification_submissions')
    .select('id, status')
    .eq('user_id', user.id)
    .eq('program_id', programId)
    .eq('certification_name', certificationName)
    .eq('status', 'pending_review')
    .single();

  if (existing) {
    return NextResponse.json({ 
      error: 'You already have a pending submission for this certification' 
    }, { status: 400 });
  }

  // Create submission
  const { data, error } = await supabase
    .from('certification_submissions')
    .insert({
      user_id: user.id,
      program_id: programId,
      certification_name: certificationName,
      provider,
      certificate_url: certificateUrl,
      credential_number: credentialNumber,
      completion_date: completionDate,
      expiration_date: expirationDate,
      status: 'pending_review',
    })
    .select()
    .single();

  if (error) {
    logger.error('Failed to create submission:', error);
    return NextResponse.json({ error: 'Failed to submit certification' }, { status: 500 });
  }

  // HVAC workflow: advance credential sequence when a cert is submitted for HVAC program
  if (programId === 'hvac-technician') {
    try {
      const { advanceHvacWorkflow } = await import('@/lib/courses/hvac-completion-workflow');
      const wfResult = await advanceHvacWorkflow(user.id);
      logger.info('[hvac-workflow] Advanced on cert submission', { userId: user.id, certificationName, ...wfResult });
    } catch (wfErr) {
      logger.error('[hvac-workflow] Advance failed (non-fatal):', wfErr);
    }
  }

  return NextResponse.json({ 
    success: true, 
    submission: data,
    message: 'Certification submitted for review' 
  });
}
export const POST = withApiAudit('/api/certifications/submit', _POST);
