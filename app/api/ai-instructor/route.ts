export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

import { NextRequest, NextResponse } from 'next/server';
import { parseBody } from '@/lib/api-helpers';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { logger } from '@/lib/logger';
import { applyRateLimit } from '@/lib/api/withRateLimit';

const GEMINI_MODELS = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-2.0-flash-lite'];

async function callGemini(
  systemPrompt: string,
  messages: Array<{ role: string; content: string }>,
): Promise<string | null> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;

  const contents = messages.map((m) => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }],
  }));

  for (const model of GEMINI_MODELS) {
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            system_instruction: { parts: [{ text: systemPrompt }] },
            contents,
            generationConfig: { maxOutputTokens: 800, temperature: 0.7 },
          }),
        },
      );
      if (!res.ok) continue;
      const data = await res.json();
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (text) return text;
    } catch (err) {
      logger.error(`Gemini ${model} error:`, err as Error);
    }
  }
  return null;
}

const SYSTEM_PROMPT = `You are an AI instructor assistant for Elevate for Humanity, a workforce training institution. Your role is to guide students through their programs and courses with consistent, helpful support.

## Your Responsibilities:
1. **Program Guidance**: Help students understand their program requirements, course sequences, and learning outcomes
2. **Course Navigation**: Guide students to the right courses and resources
3. **Learning Support**: Answer questions about course content, assignments, and assessments
4. **Progress Tracking**: Help students understand their progress and next steps
5. **Resource Direction**: Point students to handbooks, workbooks, and support services

## Available Programs:
1. **Barbering** (2,000 hours, 15-24 months) / **Cosmetology** (1,500 hours, 12-18 months)
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

export async function POST(request: NextRequest) {
  try {
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        { error: 'AI Instructor is not configured. Please contact support.' },
        { status: 503 },
      );
    }

    const supabase = await createClient();
    const db = createAdminClient() || supabase;
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

    const chatMessages = [
      { role: 'user', content: `Current student context:\n${contextMessage}` },
      ...conversationHistory.map((msg: { role: string; content: string }) => ({
        role: msg.role,
        content: msg.content,
      })),
      { role: 'user', content: message },
    ];

    const response = await callGemini(SYSTEM_PROMPT, chatMessages);

    const finalResponse =
      response ||
      'I apologize, but I was unable to generate a response. Please try again or contact student support.';

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

export async function GET(request: NextRequest) {
  try {
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;

    const supabase = await createClient();
    const db = createAdminClient() || supabase;
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
