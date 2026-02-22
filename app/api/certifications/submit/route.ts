import { logger } from '@/lib/logger';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { applyRateLimit } from '@/lib/api/withRateLimit';

export async function POST(request: NextRequest) {
    const rateLimited = await applyRateLimit(request, 'strict');
    if (rateLimited) return rateLimited;

  const supabase = await createClient();
  const _admin = createAdminClient(); const db = _admin || supabase;
  
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
  const { data: existing } = await db
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
  const { data, error } = await db
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

  return NextResponse.json({ 
    success: true, 
    submission: data,
    message: 'Certification submitted for review' 
  });
}
