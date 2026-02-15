
export const runtime = 'nodejs';
export const maxDuration = 60;

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  getInstructorByProgramId,
  getInstructorById,
} from '@/lms-data/instructors';
import { allPrograms } from '@/lms-data/programs';
import { logger } from '@/lib/logger';
import { applyRateLimit } from '@/lib/api/withRateLimit';

const apiKey = process.env.OPENAI_API_KEY;

interface HistoryMessage {
  role: 'user' | 'assistant';
  content: string;
}

export async function POST(req: Request) {
  try {
    const rateLimited = await applyRateLimit(req, 'api');
    if (rateLimited) return rateLimited;

    const body = await req.json().catch(() => ({}));
    const {
      programId,
      instructorId,
      history,
      latest,
    }: {
      programId?: string;
      instructorId?: string;
      history?: HistoryMessage[];
      latest?: string;
    } = body;

    if (!programId || !latest) {
      return NextResponse.json(
        { message: 'Missing programId or latest message.' },
        { status: 400 }
      );
    }

    const program = allPrograms.find((p) => p.id === programId);
    const instructor = instructorId
      ? getInstructorById(instructorId)
      : getInstructorByProgramId(programId);

    if (!program || !instructor) {
      return NextResponse.json(
        { message: 'Program or instructor not found.' },
        { status: 404 }
      );
    }

    // Fallback if OpenAI is not configured: simple canned response
    if (!apiKey) {
      const fallback =
        `I'm ${instructor.shortName}, your AI instructor for the ${program.title} program. ` +
        `Right now the full AI engine is not connected, but here's how you can think about your question:\n\n` +
        `1. Re-read the relevant module or lesson for this topic.\n` +
        `2. Write down what part is confusing you (steps, terms, or expectations).\n` +
        `3. Bring this to your live instructor, coach, or case manager so they can walk through it with you.\n\n` +
        `Once the AI engine is connected (with OPENAI_API_KEY configured), I will be able to give more detailed guidance in this chat.`;
      return NextResponse.json({ text: fallback });
    }

    // If OpenAI is configured, make the API call
    try {
      const OpenAI = (await import('openai')).default;
      const client = new OpenAI({ apiKey });

      const systemPrompt = `You are ${instructor.name}, an AI instructor for the ${program.title} program at Elevate for Humanity.

Your tone is: ${instructor.tone}
Your specialties: ${instructor.specialties.join(', ')}
Primary standards you align to: ${instructor.primaryStandards.join(', ')}
Partner sources you reference: ${instructor.partnerSources.join(', ')}

Style notes: ${instructor.humanStyleNotes}

SAFETY RULES: ${instructor.safetyNotes}

Keep responses concise (2-4 paragraphs max), practical, and encouraging. Focus on helping the student understand the program content and workplace expectations.`;

      const messages: any[] = [
        { role: 'system', content: systemPrompt },
        ...(history || []),
        { role: 'user', content: latest },
      ];

      const completion = await client.chat.completions.create({
        model: 'gpt-4o-mini',
        messages,
        temperature: 0.7,
        max_tokens: 500,
      });

      const reply =
        completion.choices[0]?.message?.content ||
        "I'm here to help. Please try asking your question again.";

      // Log interaction to database
      try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        await supabase.from('ai_instructor_interactions').insert({
          user_id: user?.id || null,
          program_id: programId,
          instructor_id: instructorId,
          user_message: latest,
          assistant_response: reply,
        }).catch(() => {});
      } catch {
        // DB logging is non-critical
      }

      return NextResponse.json({ text: reply });
    } catch (err: any) {
      logger.error('OpenAI API error:', err);
      return NextResponse.json(
        { message: 'AI service temporarily unavailable. Please try again.' },
        { status: 503 }
      );
    }
  } catch (error) {
    logger.error(
      'AI instructor route error:',
      error instanceof Error ? error : new Error(String(error))
    );
    return NextResponse.json(
      { message: 'Internal server error.' },
      { status: 500 }
    );
  }
}
