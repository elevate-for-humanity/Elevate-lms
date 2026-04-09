
import { NextRequest, NextResponse } from 'next/server';
import { parseBody } from '@/lib/api-helpers';
import { createClient } from '@/lib/supabase/server';
import { getAdminClient } from '@/lib/supabase/admin';
import { logger } from '@/lib/logger';
import { applyRateLimit } from '@/lib/api/withRateLimit';

import { aiChat, isAIAvailable } from '@/lib/ai';
import { withApiAudit } from '@/lib/audit/withApiAudit';
export const runtime = 'nodejs';
export const maxDuration = 60;

export const dynamic = 'force-dynamic';

const SYSTEM_PROMPT = `You are an AI instructor assistant for Elevate for Humanity, a workforce training institution. Your role is to guide students through their programs and courses with consistent, helpful support.

## Your Responsibilities:
1. **Program Guidance**: Help students understand their program requirements, course sequences, and learning outcomes
2. **Course Navigation**: Guide students to the right courses and resources
3. **Learning Support**: Answer questions about course content, assignments, and assessments
4. **Progress Tracking**: Help students understand their progress and next steps
5. **Resource Direction**: Point students to handbooks, workbooks, and support services

## Available Programs:
1. **Barbering** (2,000 hours, 15-24 months) / **Cosmetology** (2,000 hours, 12-18 months)
2. **Certified Nursing Assistant (CNA)** (120 hours, 4-8 weeks)
3. **HVAC Technician** (400 hours) — EPA 608, NATE certification prep
4. **Tax Preparation** (240 hours, 8 weeks) — IRS PTIN, AFSP
5. **Commercial Driver's License (CDL)** (160 hours, 4-6 weeks) — Class A CDL

## Key Resources:
- Student Handbook: /student-handbook
- Hour Tracking: /lms/hours-tracking
- Career Services: /career-services
- Financial Aid: /funding
- Support Services: /support

## Communication Style:
- Be encouraging and supportive
- Provide specific, actionable guidance
- Reference official resources when appropriate
- Escalate complex issues to human staff
- Be concise but thorough`;

async function _POST(request: NextRequest) {
  try {
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;

    if (!isAIAvailable()) {
      return NextResponse.json(
        { error: 'AI Instructor is not configured. Please contact support.' },
        { status: 503 },
      );
    }

    const supabase = await createClient();
    const db = await getAdminClient();
  if (!db) throw new Error('Admin client failed to initialize');
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await parseBody<Record<string, any>>(request);
    const { message, conversationHistory = [] } = body;

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    // Get student context
    const { data: profile } = await db
      .from('profiles')
      .select('full_name')
      .eq('id', user.id)
      .single();

    const { data: enrollment } = await db
      .from('program_enrollments')
      .select('*, program:programs(*)')
      .eq('student_id', user.id)
      .eq('status', 'active')
      .single();

    let contextMessage = `Student: ${profile?.full_name || 'Unknown'}`;
    if (enrollment) {
      contextMessage += `\nEnrolled in: ${enrollment.program?.name}`;
      contextMessage += `\nProgress: ${enrollment.progress_percentage || 0}%`;
      contextMessage += `\nStatus: ${enrollment.status}`;
    } else {
      contextMessage += `\nNo active enrollment`;
    }

    const chatMessages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: `Current student context:\n${contextMessage}` },
      ...conversationHistory.map((msg: { role: string; content: string }) => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
      })),
      { role: 'user', content: message },
    ];

    let finalResponse: string;
    try {
      const result = await aiChat({ messages: chatMessages, temperature: 0.7, maxTokens: 800 });
      finalResponse = result.content;
    } catch (err) {
      logger.error('AI chat failed:', err instanceof Error ? err : new Error(String(err)));
      finalResponse = 'I apologize, but I was unable to generate a response. Please try again or contact student support.';
    }

    // Log conversation
    await db.from('ai_instructor_logs').insert({
      student_id: user.id,
      message,
      response: finalResponse,
      enrollment_id: enrollment?.id,
      created_at: new Date().toISOString(),
    });

    return NextResponse.json({ response: finalResponse });
  } catch (error) {
    logger.error('AI Instructor error:', error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json({ error: 'Failed to process request' }, { status: 500 });
  }
}

async function _GET(request: NextRequest) {
  try {
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;

    const supabase = await createClient();
    const db = await getAdminClient();
  if (!db) throw new Error('Admin client failed to initialize');
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: conversations } = await db
      .from('ai_instructor_logs')
      .select('*')
      .eq('student_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20);

    return NextResponse.json({ conversations });
  } catch (error) {
    logger.error('AI Instructor GET error:', error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json({ error: 'Failed to fetch conversations' }, { status: 500 });
  }
}
export const GET = withApiAudit('/api/ai-instructor', _GET);
export const POST = withApiAudit('/api/ai-instructor', _POST);
