import { logger } from '@/lib/logger';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { applyRateLimit } from '@/lib/api/withRateLimit';

import { auditMutation } from '@/lib/api/withAudit';
import { withApiAudit } from '@/lib/audit/withApiAudit';

async function _POST(request: NextRequest) {
  try {
    const rateLimited = await applyRateLimit(request, 'contact');
    if (rateLimited) return rateLimited;

    const supabase = await createClient();
  const _admin = createAdminClient(); const db = _admin || supabase;
    
    if (!supabase) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
    }

    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { partnerId, programId } = await request.json();

    if (!partnerId) {
      return NextResponse.json({ error: 'Partner ID required' }, { status: 400 });
    }

    // Check if user is already enrolled
    const { data: existingEnrollment } = await db
      .from('partner_users')
      .select('id')
      .eq('user_id', user.id)
      .eq('role', 'apprentice')
      .single();

    if (existingEnrollment) {
      return NextResponse.json({ 
        error: 'You are already enrolled in an apprenticeship program' 
      }, { status: 400 });
    }

    // Verify partner exists and is active
    const { data: partner } = await db
      .from('partners')
      .select('id, name, status')
      .eq('id', partnerId)
      .single();

    if (!partner) {
      return NextResponse.json({ error: 'Partner shop not found' }, { status: 404 });
    }

    if (partner.status !== 'active') {
      return NextResponse.json({ 
        error: 'This partner shop is not currently accepting apprentices' 
      }, { status: 400 });
    }

    // Create enrollment record
    const { error: enrollError } = await db
      .from('partner_users')
      .insert({
        user_id: user.id,
        partner_id: partnerId,
        role: 'apprentice',
        status: 'active',
      });

    if (enrollError) {
      logger.error('Enrollment error:', enrollError);
      return NextResponse.json({ error: 'Failed to enroll' }, { status: 500 });
    }

    // Update user profile with apprentice role if needed
    await db
      .from('profiles')
      .update({ 
        role: 'apprentice',
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id);

    // Create initial progress record
    await db
      .from('apprentice_progress')
      .insert({
        user_id: user.id,
        partner_id: partnerId,
        program_id: programId || 'BARBER',
        total_hours: 0,
        status: 'active',
      });

    return NextResponse.json({ 
      success: true,
      message: 'Enrollment successful',
      partnerId,
      partnerName: partner.name,
    });
  } catch (error) {
    logger.error('Enrollment error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
export const POST = withApiAudit('/api/enrollment/barber', _POST);
