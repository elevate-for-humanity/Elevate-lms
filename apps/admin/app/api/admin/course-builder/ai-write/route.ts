import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { apiRequireAdmin } from '@/lib/admin/guards';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { safeError } from '@/lib/api/safe-error';
import { aiChat, isAIAvailable } from '@/lib/ai/ai-service';
import { hydrateProcessEnv } from '@/lib/secrets';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const BodySchema = z.object({
  lessonTitle: z.string().min(1).max(200),
  courseTitle: z.string().min(1).max(200),
  moduleTitle: z.string().max(200).optional(),
  existingContent: z.string().max(20000).optional(),
  instruction: z.string().max(1000).optional(),
});

function deterministicExperience(input: z.infer<typeof BodySchema>) {
  const topic = input.lessonTitle.trim();
  const moduleName = input.moduleTitle?.trim() || 'Core Skills';
  const existing = input.existingContent?.trim();
  const content = existing || `<h2>${topic}</h2><p>This lesson develops practical, job-ready knowledge for <strong>${topic}</strong> within ${input.courseTitle}. Work through each example, practice the procedure, and use the checks below to confirm understanding.</p><h2>Why this skill matters</h2><p>Professionals must combine correct technique, safe work habits, quality control, and clear communication. Before beginning, review the goal, identify the tools or information required, and define what acceptable work looks like.</p><h2>Work process</h2><ol><li>Review the assignment, desired outcome, and any safety or compliance requirements.</li><li>Prepare the workspace, files, tools, and reference materials.</li><li>Complete the task in a deliberate sequence and verify each important decision.</li><li>Inspect the result for accuracy, accessibility, quality, and professional presentation.</li><li>Save or document the work using the required naming and submission standard.</li></ol><h2>Quality and safety</h2><ul><li>Use only approved tools, assets, and procedures.</li><li>Protect private, licensed, or confidential information.</li><li>Stop and ask an instructor when requirements conflict or a hazard is present.</li><li>Keep evidence of the completed work for instructor review.</li></ul><h2>Practice</h2><p>Complete the hands-on task, explain the choices you made, and use the scenario and knowledge checks to identify any area that needs more practice.</p>`;
  return {
    content,
    narrationScript: `Welcome to ${topic}, part of ${moduleName}. In this lesson, focus on the purpose of the task, the correct work sequence, safe and ethical decisions, and the evidence that shows the work meets a professional standard. Pause to practice each major step before moving on.`,
    visualPrompt: `Create a clean instructional sequence for "${topic}" showing preparation, the core workflow, a safety or quality checkpoint, and the finished result. Use accessible labels and a professional workforce-training style.`,
    flashcards: [
      { front: 'Purpose', back: `Explain why ${topic} matters in a professional workflow.`, tags: ['foundation'] },
      { front: 'Preparation', back: 'Confirm the goal, requirements, tools, files, and safety controls before starting.', tags: ['workflow'] },
      { front: 'Quality check', back: 'Compare the result with the stated requirements and correct errors before submission.', tags: ['quality'] },
      { front: 'Evidence', back: 'Save an observable work product or verification record for instructor review.', tags: ['assessment'] },
    ],
    knowledgeChecks: [
      { question: `What should you do first when beginning a ${topic} task?`, options: ['Start immediately', 'Confirm the goal and requirements', 'Skip preparation', 'Submit a draft'], correct: 1, explanation: 'Clear requirements prevent rework and establish the quality standard.' },
      { question: 'Which action best demonstrates quality control?', options: ['Checking the finished work against requirements', 'Ignoring warnings', 'Using unapproved assets', 'Deleting evidence'], correct: 0, explanation: 'A documented comparison to requirements is an observable quality check.' },
      { question: 'What should happen when a safety, privacy, or licensing concern appears?', options: ['Continue without review', 'Hide the concern', 'Stop and follow the approved escalation process', 'Share protected information'], correct: 2, explanation: 'Professionals stop and use the approved escalation path when a material concern appears.' },
    ],
    scenario: {
      title: `${topic}: workplace decision`,
      question: 'A deadline is close, but the work does not yet meet the stated quality or safety requirement. What should you do?',
      options: [
        { text: 'Document the gap, correct it, and notify the appropriate reviewer if timing is affected.', isCorrect: true, feedback: 'Correct. Quality and safety requirements remain part of the assignment.' },
        { text: 'Submit it without checking.', isCorrect: false, feedback: 'Submitting unchecked work can create safety, quality, and compliance problems.' },
        { text: 'Remove the requirement from the instructions.', isCorrect: false, feedback: 'Requirements may only be changed by an authorized reviewer.' },
      ],
    },
    practicalTask: {
      title: `Demonstrate: ${topic}`,
      instructions: ['Prepare the workspace and list the requirements.', 'Complete the core task using the approved process.', 'Perform and document a quality, safety, and accessibility check.', 'Submit the finished artifact and a short explanation of your decisions.'],
      evidence: 'Finished work product, quality-control checklist, and instructor or supervisor verification.',
    },
  };
}

function parseJsonObject(raw: string) {
  const cleaned = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
  const first = cleaned.indexOf('{');
  const last = cleaned.lastIndexOf('}');
  if (first < 0 || last <= first) throw new Error('AI did not return a JSON object');
  return JSON.parse(cleaned.slice(first, last + 1));
}

export async function POST(req: NextRequest) {
  await hydrateProcessEnv();
  const rateLimited = await applyRateLimit(req, 'api');
  if (rateLimited) return rateLimited;
  const auth = await apiRequireAdmin(req);
  if (auth.error) return auth.error;
  const parsed = BodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return safeError('Invalid input', 400);

  const fallback = deterministicExperience(parsed.data);
  if (!isAIAvailable()) {
    return NextResponse.json({ ok: true, provider: 'deterministic-fallback', experience: fallback });
  }

  const { lessonTitle, courseTitle, moduleTitle, existingContent, instruction } = parsed.data;
  const prompt = `Create a complete interactive workforce-training lesson experience as JSON.
Course: ${courseTitle}
Module: ${moduleTitle ?? 'General'}
Lesson: ${lessonTitle}
${instruction ? `Additional instruction: ${instruction}` : ''}
${existingContent ? `Existing lesson to improve:\n${existingContent}` : ''}

Return ONLY valid JSON with this shape:
{"content":"500-900 words of practical HTML using h2,p,ul,ol,li","narrationScript":"natural spoken narration","visualPrompt":"specific visual direction","flashcards":[{"front":"term","back":"answer","tags":["topic"]}],"knowledgeChecks":[{"question":"question","options":["A","B","C","D"],"correct":0,"explanation":"why"}],"scenario":{"title":"situation","question":"decision","options":[{"text":"choice","isCorrect":true,"feedback":"feedback"}]},"practicalTask":{"title":"hands-on task","instructions":["step 1"],"evidence":"verification"}}
Include at least 4 flashcards and 3 knowledge checks. Make the task observable and assessable.`;

  try {
    const result = await aiChat({
      model: 'gpt-4.1',
      messages: [
        { role: 'system', content: 'You are an expert vocational instructional designer. Return only valid JSON.' },
        { role: 'user', content: prompt },
      ],
      temperature: 0.45,
      maxTokens: 4500,
    });
    const experience = parseJsonObject(result.content ?? '');
    return NextResponse.json({ ok: true, provider: 'ai', experience });
  } catch (error) {
    console.error('[course-builder/ai-write] AI unavailable; using deterministic fallback', error);
    return NextResponse.json({ ok: true, provider: 'deterministic-fallback', experience: fallback });
  }
}
