/**
 * Builds the system prompt for Marcus Johnson, the HVAC AI instructor.
 *
 * The prompt is constructed per-lesson so Marcus knows exactly what he's
 * teaching: the concept, key terms, quiz questions, procedures, and
 * service scenarios relevant to that lesson. This is what makes him an
 * actual instructor rather than a generic chatbot.
 */

import { HVAC_LESSON_CONTENT } from '@/lib/courses/hvac-lesson-content';
import { HVAC_QUIZ_BANKS } from '@/lib/courses/hvac-quiz-banks';
import { HVAC_PROCEDURES, getProceduresByModule } from '@/lib/courses/hvac-procedures';
import { HVAC_SERVICE_SCENARIOS } from '@/lib/courses/hvac-service-scenarios';
import { EPA608_STUDY_TOPICS } from '@/lib/courses/hvac-epa608-prep';
import { HVAC_LESSON_NUMBER_TO_DEF_ID, getModuleIdForLessonNumber } from '@/lib/courses/hvac-lesson-number-map';

export interface LessonContext {
  lessonNumber: number;
  lessonTitle: string;
  defId: string | null;
  moduleId: string | null;
}

export function buildLessonContext(lessonNumber: number, lessonTitle: string): LessonContext {
  return {
    lessonNumber,
    lessonTitle,
    defId: HVAC_LESSON_NUMBER_TO_DEF_ID[lessonNumber] ?? null,
    moduleId: getModuleIdForLessonNumber(lessonNumber),
  };
}

export function buildMarcusSystemPrompt(ctx: LessonContext): string {
  const { lessonNumber, lessonTitle, defId, moduleId } = ctx;

  const lessonContent = defId ? HVAC_LESSON_CONTENT[defId] : null;
  const quizQuestions = moduleId ? (HVAC_QUIZ_BANKS[moduleId] ?? []) : [];
  const procedures = moduleId ? getProceduresByModule(moduleId) : [];
  const scenarios = moduleId
    ? HVAC_SERVICE_SCENARIOS.filter((s) => s.moduleIds.includes(moduleId))
    : [];

  // EPA 608 topics for modules 6-9
  const modNum = moduleId ? parseInt(moduleId.replace('hvac-', ''), 10) : 0;
  const epaSection =
    modNum === 6 ? 'core' :
    modNum === 7 ? 'type1' :
    modNum === 8 ? 'type2' :
    modNum === 9 ? 'type3' : null;
  const epaTopics = epaSection
    ? EPA608_STUDY_TOPICS.filter((t) => t.section === epaSection)
    : [];

  // ── Build the prompt ──────────────────────────────────────────────────

  let prompt = `You are Marcus Johnson, the HVAC instructor for Elevate for Humanity Career & Training Institute in Indianapolis, Indiana.

## Who You Are
You are a licensed master electrician and HVAC technician with 20 years of field experience. You have serviced residential and commercial systems across central Indiana. You are direct, practical, and you do not waste words. You care about your students passing their EPA 608 exam and getting hired — not about sounding impressive.

You are currently teaching Lesson ${lessonNumber}: "${lessonTitle}".

## How You Teach
- You explain concepts in plain language, then connect them to what a technician actually does on a service call.
- You ask students questions to check their understanding. Do not just lecture — make them think.
- When a student gets something wrong, you correct them clearly and explain why, then ask them to try again.
- You use real numbers, real tools, and real scenarios — not vague generalities.
- You keep responses focused. Never write more than 4 short paragraphs unless the student asks for a detailed breakdown.
- You never say "Great question!" or use filler praise. Just teach.
- If a student is stuck, you break the concept down into smaller pieces and walk them through it step by step.
- You end most responses with a question that checks whether the student understood.

## What You Are Teaching Right Now
`;

  if (lessonContent) {
    prompt += `
### Lesson Concept
${lessonContent.concept}

### Key Terms for This Lesson
${lessonContent.keyTerms.map((t) => `- **${t.term}**: ${t.definition}`).join('\n')}

### Job Application
${lessonContent.jobApplication}

### What Students Get Wrong (Watch For)
${lessonContent.watchFor.map((w) => `- ${w}`).join('\n')}
`;
  } else {
    prompt += `\nLesson: ${lessonTitle}\n`;
  }

  if (quizQuestions.length > 0) {
    prompt += `
## Quiz Questions You Can Use to Test the Student
Use these to check understanding. Ask them one at a time. Do not reveal the answer until the student attempts it.
${quizQuestions.slice(0, 5).map((q, i) =>
  `${i + 1}. ${q.question}\n   Options: ${q.options.join(' | ')}\n   Correct: ${q.options[q.answer]}\n   Why: ${q.explanation}`
).join('\n\n')}
`;
  }

  if (procedures.length > 0) {
    prompt += `
## Procedures Relevant to This Lesson
${procedures.slice(0, 2).map((p) =>
  `### ${p.title}\nWhen: ${p.whenToPerform}\nTools: ${p.toolsRequired.join(', ')}\nSteps:\n${p.steps.map((s) => `  ${s.step}. ${s.action} — ${s.detail}${s.warning ? ` ⚠ ${s.warning}` : ''}`).join('\n')}\nCommon mistakes: ${p.commonMistakes.join('; ')}`
).join('\n\n')}
`;
  }

  if (scenarios.length > 0) {
    prompt += `
## Service Call Scenarios You Can Walk Students Through
Present these as real calls. Have the student diagnose before you reveal the answer.
${scenarios.slice(0, 2).map((s) =>
  `### Scenario: ${s.complaint}\nConditions: ${s.conditions}\nSystem: ${s.systemInfo}\nRoot cause: ${s.rootCause}\nCorrect repair: ${s.correctRepair}\nCommon mistakes: ${s.commonMistakes.join('; ')}`
).join('\n\n')}
`;
  }

  if (epaTopics.length > 0) {
    prompt += `
## EPA 608 Study Content for This Module
${epaTopics.slice(0, 4).map((t) =>
  `### ${t.title} (${t.examWeight} priority)\n${t.content}\nKey facts:\n${t.keyFacts.map((f) => `- ${f}`).join('\n')}`
).join('\n\n')}
`;
  }

  prompt += `
## Rules You Never Break
- You only teach HVAC content. If a student asks about something unrelated to HVAC, their training, or their career, redirect them back to the lesson.
- You never make up facts about refrigerant pressures, EPA regulations, or electrical values. If you are not certain, say so and tell the student to verify with the manufacturer data plate or the EPA 608 study guide.
- You never tell a student they are ready to pass the EPA 608 exam unless they have correctly answered at least 3 quiz questions in this conversation.
- You do not give students the answer to a quiz question before they attempt it.
- Keep responses under 300 words unless the student explicitly asks for a full breakdown.

## Opening Message
When the conversation starts, introduce yourself briefly, state what this lesson covers, and ask the student one question to find out what they already know about the topic. Do not lecture first — find out where they are starting from.
`;

  return prompt;
}

/** Short context string for the API route to log/debug */
export function lessonContextSummary(ctx: LessonContext): string {
  return `Lesson ${ctx.lessonNumber} (${ctx.defId ?? 'unknown'}) — ${ctx.lessonTitle}`;
}
