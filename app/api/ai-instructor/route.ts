export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

import { NextRequest, NextResponse } from 'next/server';
import { parseBody } from '@/lib/api-helpers';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import OpenAI from 'openai';
import { applyRateLimit } from '@/lib/api/withRateLimit';

// Initialize OpenAI client only if API key is available
const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })
  : null;

// AI Instructor System Prompt
const SYSTEM_PROMPT = `You are an AI instructor assistant for Elevate for Humanity, a workforce training institution. Your role is to guide students through their programs and courses with consistent, helpful support.

## Your Responsibilities:
1. **Program Guidance**: Help students understand their program requirements, course sequences, and learning outcomes
2. **Course Navigation**: Guide students to the right courses and resources
3. **Learning Support**: Answer questions about course content, assignments, and assessments
4. **Progress Tracking**: Help students understand their progress and next steps
5. **Resource Direction**: Point students to handbooks, workbooks, and support services

## Available Programs:
1. **Barbering** (2,000 hours, 15-24 months) / **Cosmetology** (1,500 hours, 12-18 months)
   - State licensure preparation
   - Theory + practical skills
   - Milady CIMA integration for theory
   - Hands-on training in salon techniques

2. **Certified Nursing Assistant (CNA)** (120 hours, 4-8 weeks)
   - State certification preparation
   - Clinical skills training
   - Patient care fundamentals
   - Healthcare career pathway

3. **HVAC Technician** (360 hours, 8-12 weeks)
   - EPA 608 certification
   - NATE certification preparation
   - Residential and commercial systems
   - Hands-on equipment training

4. **Tax Preparation** (240 hours, 8 weeks)
   - IRS PTIN certification
   - AFSP (Annual Filing Season Program)
   - Individual and business tax returns
   - Tax software training

5. **Commercial Driver's License (CDL)** (160 hours, 4-6 weeks)
   - Class A CDL preparation
   - DOT regulations and safety
   - Pre-trip inspection
   - Road test preparation

## Key Resources:
- Student Handbook: /student-handbook
- Course Syllabi: /syllabi
- Hour Tracking: /lms/hours-tracking
- Milady CIMA: /lms/milady
- Career Services: /career-services
- Financial Aid: /funding
- Support Services: /support

## Communication Style:
- Be encouraging and supportive
- Provide specific, actionable guidance
- Reference official resources when appropriate
- Escalate complex issues to human staff
- Use clear, professional language
- Be concise but thorough

## Important Notes:
- Always verify student enrollment before providing program-specific advice
- Direct financial questions to financial aid office
- Direct technical issues to IT support
- Direct personal/crisis situations to student services
- Remind students of important deadlines and requirements

When a student asks a question, provide helpful guidance while directing them to the appropriate resources or staff when needed.`;

export async function POST(request: NextRequest) {
  try {
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;

    // Check if OpenAI is configured
    if (!openai) {
      return NextResponse.json(
        { error: 'AI Instructor is not configured. Please contact support.' },
        { status: 503 }
      );
    }

    const supabase = await createClient();
  const _admin = createAdminClient(); const db = _admin || supabase;
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await parseBody<Record<string, any>>(request);
    const { message, conversationHistory = [] } = body;

    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    // Get student context
    const { data: profile } = await db
      .from('profiles')
      .select('full_name')
      .eq('id', user.id)
      .single();

    const { data: enrollment } = await db
      .from('enrollments')
      .select(
        `
        *,
        program:programs(*)
      `
      )
      .eq('student_id', user.id)
      .eq('status', 'active')
      .single();

    // Build context message
    let contextMessage = `Student: ${profile?.full_name || 'Unknown'}`;
    if (enrollment) {
      contextMessage += `\nEnrolled in: ${enrollment.program?.name}`;
      contextMessage += `\nProgress: ${enrollment.progress_percentage || 0}%`;
      contextMessage += `\nStatus: ${enrollment.status}`;
    } else {
      contextMessage += `\nNo active enrollment`;
    }

    // Prepare messages for OpenAI
    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      {
        role: 'system',
        content: SYSTEM_PROMPT,
      },
      {
        role: 'system',
        content: `Current student context:\n${contextMessage}`,
      },
      ...conversationHistory.map((msg: { role: string; content: string }) => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
      })),
      {
        role: 'user',
        content: message,
      },
    ];

    // Call OpenAI API
    const completion = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages,
      temperature: 0.7,
      max_tokens: 800,
    });

    const response =
      completion.choices[0]?.message?.content ||
      'I apologize, but I was unable to generate a response. Please try again or contact student support.';

    // Log conversation
    await db.from('ai_instructor_logs').insert({
      student_id: user.id,
      message,
      response,
      enrollment_id: enrollment?.id,
      created_at: new Date().toISOString(),
    });

    return NextResponse.json({
      response,
      conversationId: completion.id,
    });
  } catch (error) { 
    // Error: $1
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    );
  }
}

// Get conversation history
export async function GET(request: NextRequest) {
  try {
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;

    // Check if OpenAI is configured
    if (!openai) {
      return NextResponse.json(
        { error: 'AI Instructor is not configured' },
        { status: 503 }
      );
    }

    const supabase = await createClient();
  const _admin = createAdminClient(); const db = _admin || supabase;
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
    // Error: $1
    return NextResponse.json(
      { error: 'Failed to fetch conversations' },
      { status: 500 }
    );
  }
}
