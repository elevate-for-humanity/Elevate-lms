/**
 * POST /api/surveys/workone/submit
 * Submit survey answers
 * 
 * Body: {
 *   token: string,       // Survey token (base64 encoded applicationId:timestamp)
 *   answers: {}          // Survey answers
 * }
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { parseSurveyAnswers } from '@/lib/surveys/workone-survey';
import { WORKONE_SURVEY } from '@/lib/surveys/workone-survey';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();
    const { token, answers } = body;

    if (!token || !answers) {
      return NextResponse.json(
        { error: 'Missing token or answers' },
        { status: 400 }
      );
    }

    // Decode token to get application ID
    let applicationId: string;
    try {
      const decoded = Buffer.from(token, 'base64url').toString('utf8');
      const [appId] = decoded.split(':');
      applicationId = appId;
    } catch {
      return NextResponse.json(
        { error: 'Invalid survey token' },
        { status: 400 }
      );
    }

    // Get application info
    const { data: application } = await supabase
      .from('applications')
      .select('id, first_name, last_name, email')
      .eq('id', applicationId)
      .single();

    if (!application) {
      return NextResponse.json(
        { error: 'Application not found' },
        { status: 404 }
      );
    }

    // Parse answers into database fields
    const parsedAnswers = parseSurveyAnswers(answers);

    // Check if response already exists
    const { data: existing } = await supabase
      .from('workone_survey_responses')
      .select('id')
      .eq('application_id', applicationId)
      .eq('survey_label', WORKONE_SURVEY.label)
      .not('submitted_at', 'is', null)
      .single();

    if (existing) {
      return NextResponse.json(
        { error: 'You have already submitted this survey' },
        { status: 400 }
      );
    }

    // Update or insert the response
    const { error: upsertError } = await supabase
      .from('workone_survey_responses')
      .upsert(
        {
          application_id: applicationId,
          applicant_email: application.email,
          applicant_name: `${application.first_name} ${application.last_name}`.trim(),
          survey_label: WORKONE_SURVEY.label,
          submitted_at: new Date().toISOString(),
          went_to_workone: parsedAnswers.went_to_workone ?? false,
          signed_up_for_funding: parsedAnswers.signed_up_for_funding ?? false,
          still_needs_to_go: parsedAnswers.still_needs_to_go ?? false,
          was_put_in_other_program: parsedAnswers.was_put_in_other_program ?? false,
          was_persuaded_away_from_elevate: parsedAnswers.was_persuaded_away_from_elevate ?? false,
          other_program_details: parsedAnswers.other_program_details,
          feedback: parsedAnswers.feedback,
          wants_callback: parsedAnswers.wants_callback ?? false,
          preferred_contact_method: parsedAnswers.preferred_contact_method,
          best_phone: parsedAnswers.best_phone,
        },
        {
          onConflict: 'application_id,survey_label',
        }
      );

    if (upsertError) {
      console.error('Error saving survey response:', upsertError);
      return NextResponse.json(
        { error: 'Failed to save survey response' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Thank you for completing the survey!',
    });

  } catch (error) {
    console.error('Error submitting survey:', error);
    return NextResponse.json(
      { error: 'Failed to submit survey' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/surveys/workone/submit?token=xxx
 * Verify survey token is valid
 */
export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('token');

  if (!token) {
    return NextResponse.json({ error: 'Missing token' }, { status: 400 });
  }

  try {
    // Decode token
    const decoded = Buffer.from(token, 'base64url').toString('utf8');
    const [applicationId] = decoded.split(':');

    const supabase = await createClient();
    
    const { data: application } = await supabase
      .from('applications')
      .select('id, first_name, last_name, email')
      .eq('id', applicationId)
      .single();

    if (!application) {
      return NextResponse.json({ error: 'Invalid survey link' }, { status: 404 });
    }

    // Check if already submitted
    const { data: existing } = await supabase
      .from('workone_survey_responses')
      .select('id')
      .eq('application_id', applicationId)
      .eq('survey_label', WORKONE_SURVEY.label)
      .not('submitted_at', 'is', null)
      .single();

    return NextResponse.json({
      valid: true,
      applicant: {
        name: `${application.first_name} ${application.last_name}`.trim(),
      },
      alreadySubmitted: !!existing,
      survey: WORKONE_SURVEY,
    });

  } catch {
    return NextResponse.json({ error: 'Invalid survey token' }, { status: 400 });
  }
}
