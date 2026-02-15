import { logger } from '@/lib/logger';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
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

  return NextResponse.json({ 
    success: true, 
    submission: data,
    message: 'Certification submitted for review' 
  });
}
