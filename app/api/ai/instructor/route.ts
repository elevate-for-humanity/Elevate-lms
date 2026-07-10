/**
 * @deprecated Route to lib/ai/orchestrator.ts for new callers.
 * This endpoint is preserved for backwards compatibility.
 * Migration: runAITask({ task: 'general_chat' | 'instructor_support', ... })
 */
import { NextResponse } from 'next/server';
import { aiChat } from '@/lib/ai/ai-service';
import { createClient } from '@/lib/supabase/server';
import { getInstructorByProgramId, getInstructorById } from '@/lms-data/instructors';
import { allPrograms } from '@/lms-data/programs';
import { logger } from '@/lib/logger';
import { withApiAudit } from '@/lib/audit/withApiAudit';
import { withRuntime } from '@/lib/api/withRuntime';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

export const runtime = 'nodejs';
export const maxDuration = 60;

interface HistoryMessage { role: 'user' | 'assistant'; content: string; }

async function _POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { programId, instructorId, history, latest } = body as {
      programId?: string; instructorId?: string;
      history?: HistoryMessage[]; latest?: string;
    };

    if (!programId || !latest) {
      return NextResponse.json({ message: 'Missing programId or latest message.' }, { status: 400 });
    }

    const program = allPrograms.find((p) => p.id === programId);
    const instructor = instructorId ? getInstructorById(instructorId) : getInstructorByProgramId(programId);

    if (!program || !instructor) {
      return NextResponse.json({ message: 'Program or instructor not found.' }, { status: 404 });
    }

    const systemPrompt = `You are ${instructor.name}, an AI instructor for the ${program.title} program at ${PLATFORM_DEFAULTS.orgName}.

Your tone is: ${instructor.tone}
Your specialties: ${instructor.specialties.join(', ')}
Primary standards you align to: ${instructor.primaryStandards.join(', ')}
Partner sources you reference: ${instructor.partnerSources.join(', ')}

Style notes: ${instructor.humanStyleNotes}

SAFETY RULES: ${instructor.safetyNotes}

Keep responses concise (2-4 paragraphs max), practical, and encouraging. Focus on helping the student understand the program content and workplace expectations.`;

    try {
      const completion = await aiChat({
        model: 'gpt-4.1-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          ...(history || []),
          { role: 'user', content: latest },
        ],
        temperature: 0.7,
        maxTokens: 500,
      });

      const reply = completion.content || "I'm here to help. Please try asking your question again.";

      try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        await supabase.from('ai_instructor_interactions').insert({
          user_id: user?.id || null, program_id: programId,
          instructor_id: instructorId, user_message: latest, assistant_response: reply,
        }).then(()=>{}, ()=>{});
      } catch (err) {
        logger.error('Unhandled error', err instanceof Error ? err : undefined);
      }

      return NextResponse.json({ text: reply });
    } catch (err: any) {
      // Fallback if AI is not configured
      const fallback = `I'm ${instructor.shortName}, your AI instructor for the ${program.title} program. ` +
        `Right now the full AI engine is not connected, but here's how you can think about your question:\n\n` +
        `1. Re-read the relevant module or lesson for this topic.\n` +
        `2. Write down what part is confusing you (steps, terms, or expectations).\n` +
        `3. Bring this to your live instructor, coach, or case manager so they can walk through it with you.`;
      return NextResponse.json({ text: fallback });
    }
  } catch (error) {
    logger.error('AI instructor route error:', error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json({ message: 'Internal server error.' }, { status: 500 });
  }
}
export const POST = withRuntime(withApiAudit('/api/ai/instructor', _POST));
