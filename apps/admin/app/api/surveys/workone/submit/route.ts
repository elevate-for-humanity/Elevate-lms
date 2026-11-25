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

// Columns only the funding survey writes. The applicant's single
// workone_survey_responses row is shared with the WorkOne progress flow,
// which also stamps submitted_at — so submitted_at alone does not prove
// a survey submission. A survey submission is proven by one of these
// survey-only answer columns being filled.
const SURVEY_ANSWER_COLUMNS =
  'id, submitted_at, was_put_in_other_program, was_persuaded_away_from_elevate, other_program_details, preferred_contact_method';

type SurveyRow = {
  id: string;
  submitted_at: string | null;
  was_put_in_other_program: boolean | null;
  was_persuaded_away_from_elevate: boolean | null;
  other_program_details: string | null;
  preferred_contact_method: string | null;
};

function hasSurveySubmission(row: SurveyRow | null): boolean {
  return Boolean(
    row?.submitted_at &&
      (row.was_put_in_other_program !== null ||
        row.was_persuaded_away_from_elevate !== null ||
        row.other_program_details !== null ||
        row.preferred_contact_method !== null)
  );
}

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

    // One row per applicant: workone_survey_responses has a unique index
    // on application_id ALONE (workone_survey_application_unique), and the
    // applicant's row is normally created earlier by the WorkOne handoff
    // (lib/workone/handoff.ts). The old code upserted with onConflict
    // 'application_id,survey_label' — no such unique constraint exists, so
    // every submission failed with a constraint error. Record the answers
    // on the applicant's existing row instead; create the row only when
    // the applicant has none.
    const { data: existingRow, error: lookupError } = await supabase
      .from('workone_survey_responses')
      .select(SURVEY_ANSWER_COLUMNS)
      .eq('application_id', applicationId)
      .maybeSingle();

    if (lookupError) {
      console.error('Error looking up survey response:', lookupError);
      return NextResponse.json(
        { error: 'Failed to save survey response' },
        { status: 500 }
      );
    }

    if (hasSurveySubmission(existingRow as SurveyRow | null)) {
      return NextResponse.json(
        { error: 'You have already submitted this survey' },
        { status: 400 }
      );
    }

    const responseFields = {
      applicant_email: application.email,
      applicant_name: `${application.first_name} ${application.last_name}`.trim(),
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
    };

    if (existingRow) {
      const { error: updateError } = await supabase
        .from('workone_survey_responses')
        .update({ ...responseFields, updated_at: new Date().toISOString() })
        .eq('id', existingRow.id);

      if (updateError) {
        console.error('Error saving survey response:', updateError);
        return NextResponse.json(
          { error: 'Failed to save survey response' },
          { status: 500 }
        );
      }
    } else {
      const { error: insertError } = await supabase
        .from('workone_survey_responses')
        .insert({
          application_id: applicationId,
          // Canonical label the responses dashboard reads (the handoff
          // label — see /api/surveys/workone/responses).
          survey_label: 'workone-funding-progress',
          ...responseFields,
        });

      if (insertError) {
        console.error('Error saving survey response:', insertError);
        return NextResponse.json(
          { error: 'Failed to save survey response' },
          { status: 500 }
        );
      }
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

    // Check if already submitted (same one-row lookup as POST)
    const { data: existingRow } = await supabase
      .from('workone_survey_responses')
      .select(SURVEY_ANSWER_COLUMNS)
      .eq('application_id', applicationId)
      .maybeSingle();

    return NextResponse.json({
      valid: true,
      applicant: {
        name: `${application.first_name} ${application.last_name}`.trim(),
      },
      alreadySubmitted: hasSurveySubmission(existingRow as SurveyRow | null),
      survey: WORKONE_SURVEY,
    });

  } catch {
    return NextResponse.json({ error: 'Invalid survey token' }, { status: 400 });
  }
}
