import { logger } from '@/lib/logger';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { checkNewMilestone, BARBER_MILESTONES } from '@/lib/pwa/milestones';

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

    const body = await request.json();
    const { date, hours, notes } = body;

    if (!date || !hours) {
      return NextResponse.json({ error: 'Date and hours are required' }, { status: 400 });
    }

    // Get user's partner assignment
    const { data: partnerUser } = await supabase
      .from('partner_users')
      .select('partner_id')
      .eq('user_id', user.id)
      .single();

    if (!partnerUser) {
      return NextResponse.json({ 
        error: 'You are not assigned to a partner shop yet' 
      }, { status: 400 });
    }

    // Calculate week ending (Friday)
    const entryDate = new Date(date);
    const dayOfWeek = entryDate.getDay();
    const daysUntilFriday = (5 - dayOfWeek + 7) % 7 || 7;
    const weekEnding = new Date(entryDate);
    weekEnding.setDate(entryDate.getDate() + daysUntilFriday);
    const weekEndingStr = weekEnding.toISOString().split('T')[0];

    // Check for existing entry for this week
    const { data: existingEntry } = await supabase
      .from('progress_entries')
      .select('id, hours_worked')
      .eq('apprentice_id', user.id)
      .eq('partner_id', partnerUser.partner_id)
      .eq('program_id', 'BARBER')
      .eq('week_ending', weekEndingStr)
      .single();

    if (existingEntry) {
      // Update existing entry
      const { error: updateError } = await supabase
        .from('progress_entries')
        .update({
          hours_worked: existingEntry.hours_worked + parseFloat(hours),
          notes: notes ? `${existingEntry.notes || ''}\n${date}: ${notes}`.trim() : existingEntry.notes,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingEntry.id);

      if (updateError) {
        logger.error('Failed to update progress entry:', updateError);
        return NextResponse.json({ error: 'Failed to log hours' }, { status: 500 });
      }
    } else {
      // Create new entry
      const { error: insertError } = await supabase
        .from('progress_entries')
        .insert({
          apprentice_id: user.id,
          partner_id: partnerUser.partner_id,
          program_id: 'BARBER',
          week_ending: weekEndingStr,
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

    // Check for milestone achievement
    const { data: totalProgress } = await supabase
      .from('progress_entries')
      .select('hours_worked')
      .eq('apprentice_id', user.id)
      .eq('program_id', 'BARBER');

    const totalHours = totalProgress?.reduce(
      (sum, entry) => sum + parseFloat(entry.hours_worked || 0), 0
    ) || 0;
    
    const previousHours = totalHours - parseFloat(hours);
    const newMilestone = checkNewMilestone(previousHours, totalHours);

    // Send milestone notification if achieved
    if (newMilestone) {
      try {
        await fetch(`${process.env.NEXT_PUBLIC_APP_URL || ''}/api/push/send`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: user.id,
            title: `${newMilestone.badge} ${newMilestone.title}!`,
            body: newMilestone.description,
            url: '/pwa/barber/progress',
            tag: 'milestone_achieved',
          }),
        });
      } catch (notifError) {
        logger.error('Milestone notification error:', notifError);
      }
    }

    return NextResponse.json({ 
      success: true,
      totalHours,
      milestone: newMilestone,
    });
  } catch (error) {
    logger.error('Error logging hours:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
