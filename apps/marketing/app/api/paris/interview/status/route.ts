export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const referenceNumber = searchParams.get('referenceNumber');

  if (!referenceNumber) {
    return NextResponse.json(
      { error: 'Reference number is required' },
      { status: 400 }
    );
  }

  try {
    const { data: application, error } = await supabase
      .from('paris_applications')
      .select('*')
      .eq('reference_number', referenceNumber)
      .single();

    if (error || !application) {
      return NextResponse.json(
        { error: 'Application not found' },
        { status: 404 }
      );
    }

    const currentQuestionIndex = application.interview_current_question || 0;
    const responses = application.interview_responses || {};
    const completed = application.interview_completed || false;
    const status = application.status;

    // Calculate progress percentage
    const totalQuestions = 8; // Each program has 8 questions
    const answeredQuestions = Object.keys(responses).length;
    const progressPercentage = completed ? 100 : Math.round((answeredQuestions / totalQuestions) * 100);

    return NextResponse.json({
      referenceNumber: application.reference_number,
      programId: application.program_id,
      programName: application.program_name,
      currentQuestionIndex,
      totalQuestions,
      answeredQuestions,
      progressPercentage,
      responses,
      completed,
      status,
      interviewStartedAt: application.interview_started_at,
      interviewCompletedAt: application.interview_completed_at,
      score: application.interview_score,
      fundingTier: application.funding_tier,
      fundingPercentage: application.funding_percentage
    });

  } catch (error) {
    console.error('Interview status error:', error);
    return NextResponse.json(
      { error: 'Internal server error fetching interview status' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { referenceNumber, action } = body;

    if (!referenceNumber) {
      return NextResponse.json(
        { error: 'Reference number is required' },
        { status: 400 }
      );
    }

    const { data: application, error } = await supabase
      .from('paris_applications')
      .select('*')
      .eq('reference_number', referenceNumber)
      .single();

    if (error || !application) {
      return NextResponse.json(
        { error: 'Application not found' },
        { status: 404 }
      );
    }

    // Handle different status actions
    switch (action) {
      case 'start':
        if (!application.interview_started_at) {
          await supabase
            .from('paris_applications')
            .update({
              interview_started_at: new Date().toISOString(),
              status: 'in_interview'
            })
            .eq('id', application.id);
        }
        break;

      case 'pause':
        // Just save current state, nothing to update
        break;

      case 'resume':
        // Resume is handled by GET, just return current state
        break;

      case 'complete':
        if (!application.interview_completed) {
          await supabase
            .from('paris_applications')
            .update({
              interview_completed: true,
              interview_completed_at: new Date().toISOString(),
              status: 'interview_completed'
            })
            .eq('id', application.id);
        }
        break;

      default:
        return NextResponse.json(
          { error: 'Invalid action. Use: start, pause, resume, or complete' },
          { status: 400 }
        );
    }

    // Return updated status
    const { data: updatedApp } = await supabase
      .from('paris_applications')
      .select('*')
      .eq('reference_number', referenceNumber)
      .single();

    return NextResponse.json({
      success: true,
      referenceNumber: updatedApp.reference_number,
      currentQuestionIndex: updatedApp.interview_current_question || 0,
      completed: updatedApp.interview_completed || false,
      status: updatedApp.status
    });

  } catch (error) {
    console.error('Interview status update error:', error);
    return NextResponse.json(
      { error: 'Internal server error updating interview status' },
      { status: 500 }
    );
  }
}