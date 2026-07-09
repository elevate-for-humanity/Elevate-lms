/**
 * PARIS — Personalized AI Recruitment, Interview & Success System
 * AI Career Guidance Interview Agent
 * 
 * This route handles the career guidance interview conversation.
 * It uses the existing AI orchestrator with 'career_guidance_interview' task type.
 */

import { NextRequest, NextResponse } from 'next/server';
import { executeAiTask } from '@/lib/ai/execute-ai-task';
import { createClient } from '@/lib/supabase/server';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';
import type { ChatMessage } from '@/lib/ai/types';
import { logger } from '@/lib/logger';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

// POST /api/paris — Send a message to PARIS
async function _POST(req: NextRequest) {
  try {
    // Rate limiting
    const rateLimited = await applyRateLimit(req, 'contact');
    if (rateLimited) return rateLimited;

    const { 
      message, 
      history = [], 
      sessionId,
      userId 
    } = await req.json();

    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'message is required' },
        { status: 400 }
      );
    }

    if (message.length > 2000) {
      return NextResponse.json(
        { error: 'Message too long (max 2000 characters)' },
        { status: 400 }
      );
    }

    // Get user context if authenticated
    let contextUserId = userId;
    let userContext = '';
    
    try {
      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        contextUserId = user.id;
        
        // Fetch user profile for context
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name, email')
          .eq('id', user.id)
          .single();
        
        if (profile) {
          userContext = `The student's name is ${profile.full_name ?? 'Unknown'}.`;
        }
      }
    } catch (e) {
      // Non-authenticated users are fine - they can still chat
      logger.debug('[paris] Could not fetch user context', { error: e });
    }

    // Build conversation history for context
    const conversationHistory: ChatMessage[] = history.map((h: { role: string; content: string }) => ({
      role: h.role as 'user' | 'assistant',
      content: h.content,
    }));

    // Add user context to the message
    const enrichedMessage = userContext 
      ? `${userContext} ${message}`
      : message;

    // Call the AI orchestrator with career_guidance_interview task
    const result = await executeAiTask({
      task: 'career_guidance_interview',
      prompt: enrichedMessage,
      context: {
        history: conversationHistory,
        userId: contextUserId,
        sessionId: sessionId,
      },
    });

    // Log the interaction
    logger.info('[paris] Career guidance message processed', {
      userId: contextUserId,
      sessionId,
      messageLength: message.length,
      responseLength: result.content.length,
      tokensUsed: result.tokensUsed,
    });

    return NextResponse.json({
      response: result.content,
      sessionId: sessionId,
      provider: result.provider,
    });

  } catch (error) {
    logger.error('[paris] Career guidance error', undefined, { error });
    
    return NextResponse.json(
      { error: 'Something went wrong. Please try again or contact support@elevateforhumanity.org' },
      { status: 500 }
    );
  }
}

export const POST = withApiAudit('/api/paris', _POST);
