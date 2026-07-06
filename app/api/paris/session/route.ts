/**
 * PARIS Session Management
 * 
 * Manages career guidance interview sessions.
 * Sessions track conversation state, user progress, and assessment results.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';
import { logger } from '@/lib/logger';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// GET /api/paris/session — Get or create a session
async function _GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Check for existing active session
    const { data: existingSession } = await supabase
      .from('ai_interview_sessions')
      .select('*')
      .eq('user_id', user.id)
      .eq('session_type', 'career_guidance')
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (existingSession) {
      // Fetch conversation history
      const { data: messages } = await supabase
        .from('ai_interview_messages')
        .select('*')
        .eq('session_id', existingSession.id)
        .order('created_at', { ascending: true });

      return NextResponse.json({
        session: existingSession,
        messages: messages || [],
      });
    }

    // Create new session
    const { data: newSession, error } = await supabase
      .from('ai_interview_sessions')
      .insert({
        user_id: user.id,
        session_type: 'career_guidance',
        status: 'active',
        current_step: 'greeting',
        session_data: {
          started_at: new Date().toISOString(),
          goals: [],
          barriers: [],
          program_recommendations: [],
        },
      })
      .select()
      .single();

    if (error) {
      logger.error('[paris] Failed to create session', undefined, { error });
      return NextResponse.json(
        { error: 'Failed to create session' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      session: newSession,
      messages: [],
    });

  } catch (error) {
    logger.error('[paris] Session error', undefined, { error });
    return NextResponse.json(
      { error: 'Failed to access session' },
      { status: 500 }
    );
  }
}

// PATCH /api/paris/session — Update session state
async function _PATCH(req: NextRequest) {
  try {
    const rateLimited = await applyRateLimit(req, 'api');
    if (rateLimited) return rateLimited;

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { sessionId, currentStep, sessionData, status } = await req.json();

    if (!sessionId) {
      return NextResponse.json({ error: 'sessionId required' }, { status: 400 });
    }

    const updates: Record<string, unknown> = {};
    if (currentStep) updates.current_step = currentStep;
    if (sessionData) updates.session_data = sessionData;
    if (status) updates.status = status;
    updates.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from('ai_interview_sessions')
      .update(updates)
      .eq('id', sessionId)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) {
      logger.error('[paris] Failed to update session', undefined, { error });
      return NextResponse.json({ error: 'Failed to update session' }, { status: 500 });
    }

    return NextResponse.json({ session: data });

  } catch (error) {
    logger.error('[paris] Session update error', undefined, { error });
    return NextResponse.json({ error: 'Failed to update session' }, { status: 500 });
  }
}

export const GET = withApiAudit('/api/paris/session', _GET);
export const PATCH = withApiAudit('/api/paris/session', _PATCH);
