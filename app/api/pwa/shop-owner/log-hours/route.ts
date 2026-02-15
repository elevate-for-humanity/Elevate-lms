import { logger } from '@/lib/logger';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { applyRateLimit } from '@/lib/api/withRateLimit';

export async function POST(request: NextRequest) {
  try {
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;

    const supabase = await createClient();
    
    if (!supabase) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
    }

    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's partner association
    const { data: partnerUser } = await supabase
      .from('partner_users')
      .select('partner_id, role')
      .eq('user_id', user.id)
      .single();

    if (!partnerUser) {
      return NextResponse.json({ error: 'You are not associated with a partner shop' }, { status: 403 });
    }

    const body = await request.json();
    const { apprenticeId, weekEnding, hours, notes, attestation } = body;

    if (!apprenticeId || !weekEnding || !hours) {
      return NextResponse.json({ error: 'Apprentice, week ending date, and hours are required' }, { status: 400 });
    }

    if (!attestation) {
      return NextResponse.json({ error: 'Attestation is required' }, { status: 400 });
    }

    // Verify apprentice is assigned to this partner
    const { data: apprenticeAssignment } = await supabase
      .from('partner_users')
      .select('id')
      .eq('user_id', apprenticeId)
      .eq('partner_id', partnerUser.partner_id)
      .single();

    if (!apprenticeAssignment) {
      return NextResponse.json({ error: 'Apprentice is not assigned to your shop' }, { status: 403 });
    }

    // Check for existing entry
    const { data: existingEntry } = await supabase
      .from('progress_entries')
      .select('id, hours_worked')
      .eq('apprentice_id', apprenticeId)
      .eq('partner_id', partnerUser.partner_id)
      .eq('program_id', 'BARBER')
      .eq('week_ending', weekEnding)
      .single();

    if (existingEntry) {
      // Update existing entry
      const { error: updateError } = await supabase
        .from('progress_entries')
        .update({
          hours_worked: parseFloat(hours),
          notes: notes || null,
          submitted_by: user.id,
          status: 'submitted',
        })
        .eq('id', existingEntry.id);

      if (updateError) {
        logger.error('Failed to update progress entry:', updateError);
        return NextResponse.json({ error: 'Failed to update hours' }, { status: 500 });
      }
    } else {
      // Create new entry
      const { error: insertError } = await supabase
        .from('progress_entries')
        .insert({
          apprentice_id: apprenticeId,
          partner_id: partnerUser.partner_id,
          program_id: 'BARBER',
          week_ending: weekEnding,
          hours_worked: parseFloat(hours),
          notes: notes || null,
          submitted_by: user.id,
          status: 'submitted',
        });

      if (insertError) {
        logger.error('Failed to create progress entry:', insertError);
        return NextResponse.json({ error: 'Failed to log hours' }, { status: 500 });
      }
    }

    // Log to audit
    await supabase.from('partner_audit_log').insert({
      partner_id: partnerUser.partner_id,
      user_id: user.id,
      action: existingEntry ? 'update_hours' : 'log_hours',
      entity_type: 'progress_entry',
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('Error logging hours:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
