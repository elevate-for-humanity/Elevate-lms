/**
 * POST /api/surveys/workone/send
 * Send WorkOne survey emails to applicants
 * 
 * Body: {
 *   applicationIds?: string[]  // Send to specific applications
 *   sendToAll?: boolean       // Send to all applicants with status in review/enrolled
 * }
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { sendWorkOneSurveyEmail, sendWorkOneSurveyBatch } from '@/lib/notifications/workone-survey-email';
import { WORKONE_SURVEY } from '@/lib/surveys/workone-survey';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Verify admin/staff access
    const { data: { user }, } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile?.role || !['admin', 'super_admin', 'staff'].includes(profile.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { applicationIds, sendToAll } = body;

    let query = supabase
      .from('applications')
      .select(`
        id,
        first_name,
        last_name,
        email,
        status,
        program_interest
      `);

    // Filter by specific application IDs
    if (applicationIds?.length > 0) {
      query = query.in('id', applicationIds);
    }

    // Or send to all eligible applicants
    if (sendToAll) {
      // Send to all applicants who have submitted (not drafts)
      query = query.not('submitted_at', 'is', null);
    }

    const { data: applications, error } = await query;

    if (error) {
      console.error('Error fetching applications:', error);
      return NextResponse.json({ error: 'Failed to fetch applications' }, { status: 500 });
    }

    if (!applications?.length) {
      return NextResponse.json({ 
        message: 'No applications found to send survey',
        sent: 0,
      });
    }

    // Send emails in batches of 10 to avoid rate limits
    const BATCH_SIZE = 10;
    const recipients = [];

    for (const app of applications) {
      // Generate a unique survey token (base64url encoded)
      const token = Buffer.from(`${app.id}:${Date.now()}`).toString('base64url');
      
      recipients.push({
        email: app.email,
        name: `${app.first_name} ${app.last_name}`.trim(),
        applicationId: app.id,
        surveyToken: token,
      });

      // Record that survey was sent
      await supabase
        .from('workone_survey_responses')
        .insert({
          application_id: app.id,
          applicant_email: app.email,
          applicant_name: `${app.first_name} ${app.last_name}`.trim(),
          survey_label: WORKONE_SURVEY.label,
          sent_at: new Date().toISOString(),
        })
        .select('id')
        .single();
    }

    // Send emails in batches
    const results = { total: 0, successful: 0, failed: 0 };
    
    for (let i = 0; i < recipients.length; i += BATCH_SIZE) {
      const batch = recipients.slice(i, i + BATCH_SIZE);
      const batchResults = await sendWorkOneSurveyBatch(batch);
      
      results.total += batchResults.total;
      results.successful += batchResults.successful;
      results.failed += batchResults.failed;

      // Small delay between batches to avoid rate limits
      if (i + BATCH_SIZE < recipients.length) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }

    return NextResponse.json({
      message: `Survey sent to ${results.successful} applicants`,
      total: results.total,
      successful: results.successful,
      failed: results.failed,
    });

  } catch (error) {
    console.error('Error sending WorkOne survey:', error);
    return NextResponse.json(
      { error: 'Failed to send survey' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/surveys/workone/send
 * Check how many surveys have been sent
 */
export async function GET() {
  try {
    const supabase = await createClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile?.role || !['admin', 'super_admin', 'staff'].includes(profile.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Count surveys sent and responded
    const { count: sent } = await supabase
      .from('workone_survey_responses')
      .select('*', { count: 'exact', head: true })
      .not('sent_at', 'is', null);

    const { count: responded } = await supabase
      .from('workone_survey_responses')
      .select('*', { count: 'exact', head: true })
      .not('submitted_at', 'is', null);

    const { data: recent } = await supabase
      .from('workone_survey_responses')
      .select(`
        applicant_email,
        applicant_name,
        sent_at,
        submitted_at
      `)
      .not('sent_at', 'is', null)
      .order('sent_at', { ascending: false })
      .limit(10);

    return NextResponse.json({
      stats: {
        sent: sent || 0,
        responded: responded || 0,
        responseRate: sent ? Math.round(((responded || 0) / sent) * 100) : 0,
      },
      recent,
    });

  } catch (error) {
    console.error('Error fetching survey stats:', error);
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
  }
}
