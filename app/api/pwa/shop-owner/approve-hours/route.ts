import { logger } from '@/lib/logger';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    if (!supabase) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
    }

    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { entryId, action, reason } = await request.json();

    if (!entryId || !action) {
      return NextResponse.json({ error: 'Entry ID and action required' }, { status: 400 });
    }

    if (!['approve', 'reject'].includes(action)) {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    // Get user's partner association
    const { data: partnerUser } = await supabase
      .from('partner_users')
      .select('partner_id, role')
      .eq('user_id', user.id)
      .in('role', ['owner', 'manager', 'admin'])
      .single();

    if (!partnerUser) {
      return NextResponse.json({ 
        error: 'You are not authorized to approve hours',
      }, { status: 403 });
    }

    // Verify entry belongs to this partner
    const { data: entry } = await supabase
      .from('progress_entries')
      .select('id, partner_id, apprentice_id, hours_worked')
      .eq('id', entryId)
      .single();

    if (!entry) {
      return NextResponse.json({ error: 'Entry not found' }, { status: 404 });
    }

    if (entry.partner_id !== partnerUser.partner_id) {
      return NextResponse.json({ error: 'Not authorized for this entry' }, { status: 403 });
    }

    // Update entry status
    const newStatus = action === 'approve' ? 'approved' : 'rejected';
    
    const { error: updateError } = await supabase
      .from('progress_entries')
      .update({
        status: newStatus,
        approved_by: user.id,
        approved_at: new Date().toISOString(),
        rejection_reason: action === 'reject' ? reason : null,
      })
      .eq('id', entryId);

    if (updateError) {
      logger.error('Update error:', updateError);
      return NextResponse.json({ error: 'Failed to update entry' }, { status: 500 });
    }

    // If approved, update apprentice's total hours
    if (action === 'approve') {
      // Get current total
      const { data: currentProgress } = await supabase
        .from('apprentice_progress')
        .select('total_hours')
        .eq('user_id', entry.apprentice_id)
        .single();

      const currentHours = currentProgress?.total_hours || 0;
      const newTotal = currentHours + parseFloat(entry.hours_worked || 0);

      await supabase
        .from('apprentice_progress')
        .upsert({
          user_id: entry.apprentice_id,
          partner_id: entry.partner_id,
          total_hours: newTotal,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id',
        });
    }

    // Send notification to apprentice
    try {
      const notificationTitle = action === 'approve' 
        ? 'Hours Approved!' 
        : 'Hours Need Attention';
      
      const notificationBody = action === 'approve'
        ? `Your ${entry.hours_worked} hours have been approved.`
        : `Your hours submission needs revision. ${reason || ''}`.trim();

      await fetch(`${process.env.NEXT_PUBLIC_APP_URL || ''}/api/push/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: entry.apprentice_id,
          title: notificationTitle,
          body: notificationBody,
          url: '/pwa/barber/progress',
          tag: action === 'approve' ? 'hours_approved' : 'hours_rejected',
        }),
      });
    } catch (notifError) {
      logger.error('Notification error:', notifError);
      // Don't fail the request if notification fails
    }

    return NextResponse.json({ 
      success: true,
      action,
      entryId,
    });
  } catch (error) {
    logger.error('Approval error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
