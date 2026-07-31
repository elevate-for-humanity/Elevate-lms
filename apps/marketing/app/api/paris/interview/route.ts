export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { createClient as createSupabaseServerClient } from '@supabase/supabase-js';
import type { InterviewSession, ConversationMessage } from '@/lib/paris/interview/types';
import { ConversationEngine } from '@/lib/paris/interview/conversation-engine';
import { scoreResponse, calculateInterviewScore } from '@/lib/paris/interview/scoring-engine';
import { determineEligibility } from '@/lib/paris/interview/eligibility-engine';
import { provisionStudentFromInterview } from '@/lib/paris/interview/provisioning-service';
import { getQuestionsForProgram } from '@/lib/paris/interview/question-bank';

// Initialize Supabase clients
function getSupabaseAdmin(): SupabaseClient {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  );
}

async function getSupabaseUser(request: NextRequest) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return null;
  }
  
  const token = authHeader.substring(7);
  const supabase = createSupabaseServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  
  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) {
    return null;
  }
  
  return user;
}

// In-memory session storage (in production, use Redis or database)
const sessionStore: Map<string, InterviewSession> = new Map();

/**
 * POST /api/paris/interview
 * Submit interview response or complete interview
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      applicationRef, 
      questionId, 
      response, 
      isComplete,
      sessionId 
    } = body;

    // Validate required fields
    if (!applicationRef) {
      return NextResponse.json(
        { error: 'Missing required field: applicationRef' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();

    // Fetch application from database
    const { data: application, error: appError } = await supabase
      .from('paris_applications')
      .select('*')
      .eq('application_ref', applicationRef)
      .single();

    if (appError || !application) {
      return NextResponse.json(
        { error: 'Application not found', code: 'APPLICATION_NOT_FOUND' },
        { status: 404 }
      );
    }

    // Check if program is eligible for PARS interview
    const supportedPrograms = ['barber-apprenticeship', 'cdl-training', 'hvac', 'medical-assistant', 'cosmetology', 'phlebotomy'];
    const programSlug = application.program_slug || application.program_id;
    
    if (!supportedPrograms.includes(programSlug)) {
      return NextResponse.json(
        { error: 'Program does not support PARS interview', code: 'PROGRAM_NOT_SUPPORTED' },
        { status: 400 }
      );
    }

    // Get or create session
    let session: InterviewSession;
    let engine: ConversationEngine;

    if (sessionId && sessionStore.has(sessionId)) {
      session = sessionStore.get(sessionId)!;
      engine = ConversationEngine.fromJSON(session);
    } else {
      // Create new session
      session = ConversationEngine.createSession(applicationRef, programSlug);
      sessionStore.set(session.sessionId, session);
      engine = new ConversationEngine(session);

      // If this is a new session, start the interview
      if (session.status === 'not_started') {
        engine.startInterview();
        session = engine.getSession();
        sessionStore.set(session.sessionId, session);
      }
    }

    // Save current state to database
    await supabase
      .from('paris_interview_sessions')
      .upsert({
        session_id: session.sessionId,
        application_ref: applicationRef,
        program_slug: programSlug,
        current_question_index: session.currentQuestionIndex,
        responses: session.responses,
        status: session.status,
        messages: session.messages.map(m => ({
          ...m,
          timestamp: m.timestamp instanceof Date ? m.timestamp.toISOString() : m.timestamp
        })),
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'session_id'
      });

    // If completing interview
    if (isComplete) {
      const finalScore = engine.completeInterview();
      session = engine.getSession();

      // Calculate eligibility
      const eligibility = determineEligibility(finalScore, programSlug);

      // Update session status in database
      await supabase
        .from('paris_interview_sessions')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          total_score: finalScore.percentage,
          risk_score: eligibility.riskLevel,
          eligibility_status: eligibility.status
        })
        .eq('session_id', session.sessionId);

      // Update application status
      await supabase
        .from('paris_applications')
        .update({
          status: eligibility.eligible ? 'interview_eligible' : 
                  eligibility.status === 'review' ? 'interview_review' : 'interview_denied',
          interview_completed_at: new Date().toISOString(),
          interview_score: finalScore.percentage,
          eligibility_status: eligibility.status,
          risk_level: eligibility.riskLevel,
          updated_at: new Date().toISOString()
        })
        .eq('application_ref', applicationRef);

      // Provision student (create enrollment, binder, onboarding plan)
      const provisioningResult = await provisionStudentFromInterview(session, finalScore, eligibility);

      // Clean up session from memory
      sessionStore.delete(session.sessionId);

      return NextResponse.json({
        sessionId: session.sessionId,
        isComplete: true,
        finalScore: {
          totalScore: finalScore.totalScore,
          maxScore: finalScore.maxScore,
          percentage: finalScore.percentage,
          riskLevel: finalScore.riskLevel,
          eligibility: finalScore.eligibility
        },
        eligibility: {
          eligible: eligibility.eligible,
          status: eligibility.status,
          reason: eligibility.reason,
          riskLevel: eligibility.riskLevel,
          fundingRecommendations: eligibility.fundingRecommendations,
          nextSteps: eligibility.nextSteps
        },
        provisioning: provisioningResult
      });
    }

    // Score the response
    const questions = getQuestionsForProgram(programSlug);
    const question = questions.find(q => q.id === questionId || q.id === questionId.split('-followup-')[0]);
    
    let score = 5; // Default score
    if (question && response) {
      const scoreResult = scoreResponse(questionId, response, question.domain);
      score = scoreResult.score;
    }

    // Store message in database
    const message: ConversationMessage = {
      id: `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      role: 'applicant',
      content: response || '[SKIPPED]',
      timestamp: new Date(),
      questionId,
      score
    };

    await supabase
      .from('paris_interview_messages')
      .insert({
        session_id: session.sessionId,
        role: message.role,
        content: message.content,
        question_id: questionId,
        score: message.score,
        created_at: new Date().toISOString()
      });

    // Get PARS response
    const parisMessages = response ? engine.submitResponse(response) : [engine.skipQuestion()];
    session = engine.getSession();
    sessionStore.set(session.sessionId, session);

    // Get current question for next iteration
    const currentQuestion = engine.getCurrentQuestion();
    const progress = engine.getProgress();

    // Store PARS messages in database
    for (const parisMsg of parisMessages) {
      await supabase
        .from('paris_interview_messages')
        .insert({
          session_id: session.sessionId,
          role: parisMsg.role,
          content: parisMsg.content,
          question_id: parisMsg.questionId,
          score: parisMsg.score,
          created_at: new Date().toISOString()
        });
    }

    return NextResponse.json({
      sessionId: session.sessionId,
      questionId: currentQuestion?.id || null,
      score,
      nextQuestion: currentQuestion ? {
        id: currentQuestion.id,
        question: currentQuestion.question,
        domain: currentQuestion.domain,
        followUps: currentQuestion.followUps
      } : null,
      isComplete: engine.isComplete(),
      progress,
      messages: parisMessages
    });

  } catch (error) {
    console.error('PARS Interview API Error:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/paris/interview
 * Get interview status for an application
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const applicationRef = searchParams.get('applicationRef');
    const sessionId = searchParams.get('sessionId');

    if (!applicationRef && !sessionId) {
      return NextResponse.json(
        { error: 'Missing required parameter: applicationRef or sessionId' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();

    // Try to find session
    let session: InterviewSession | null = null;

    if (sessionId) {
      // Check memory first
      if (sessionStore.has(sessionId)) {
        session = sessionStore.get(sessionId)!;
      } else {
        // Check database
        const { data: dbSession, error } = await supabase
          .from('paris_interview_sessions')
          .select('*')
          .eq('session_id', sessionId)
          .single();

        if (!error && dbSession) {
          session = {
            sessionId: dbSession.session_id,
            applicationRef: dbSession.application_ref,
            programSlug: dbSession.program_slug,
            currentQuestionIndex: dbSession.current_question_index,
            messages: (dbSession.messages || []).map((m: any) => ({
              ...m,
              timestamp: new Date(m.timestamp)
            })),
            responses: dbSession.responses || {},
            status: dbSession.status,
            startedAt: new Date(dbSession.started_at || dbSession.created_at),
            completedAt: dbSession.completed_at ? new Date(dbSession.completed_at) : undefined
          };
        }
      }
    } else if (applicationRef) {
      // Find most recent session for application
      const { data: dbSession, error } = await supabase
        .from('paris_interview_sessions')
        .select('*')
        .eq('application_ref', applicationRef)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (!error && dbSession) {
        session = {
          sessionId: dbSession.session_id,
          applicationRef: dbSession.application_ref,
          programSlug: dbSession.program_slug,
          currentQuestionIndex: dbSession.current_question_index,
          messages: (dbSession.messages || []).map((m: any) => ({
            ...m,
            timestamp: new Date(m.timestamp)
          })),
          responses: dbSession.responses || {},
          status: dbSession.status,
          startedAt: new Date(dbSession.started_at || dbSession.created_at),
          completedAt: dbSession.completed_at ? new Date(dbSession.completed_at) : undefined
        };
      }
    }

    // If no session found
    if (!session) {
      return NextResponse.json({
        exists: false,
        canStart: true,
        message: 'No interview session found. Interview can be started.'
      });
    }

    const engine = ConversationEngine.fromJSON(session);
    const currentQuestion = engine.getCurrentQuestion();
    const progress = engine.getProgress();

    return NextResponse.json({
      exists: true,
      sessionId: session.sessionId,
      applicationRef: session.applicationRef,
      programSlug: session.programSlug,
      status: session.status,
      currentQuestion: currentQuestion ? {
        id: currentQuestion.id,
        question: currentQuestion.question,
        domain: currentQuestion.domain
      } : null,
      progress,
      canResume: engine.canResume(),
      canStart: session.status === 'not_started',
      messages: session.messages.slice(-5), // Last 5 messages
      responses: session.responses,
      completedAt: session.completedAt
    });

  } catch (error) {
    console.error('PARS Interview GET Error:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
