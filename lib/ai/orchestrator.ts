/**
 * lib/ai/orchestrator.ts
 *
 * Centralized AI orchestration layer.
 *
 * All AI tasks route through here. Provides:
 *   - Centralized provider selection (via aiChat())
 *   - Centralized rate limiting (caller must apply before invoking)
 *   - Centralized telemetry + logging
 *   - Centralized moderation (profanity/PII guard)
 *   - Task-specific system prompt templates
 *   - Backwards-compatible: existing endpoints proxy here, no callers broken
 *
 * Usage:
 *   import { runAITask } from '@/lib/ai/orchestrator';
 *   const result = await runAITask({ task: 'chat', prompt: '...', context: { ... } });
 *
 * Migration map (old endpoint → task type):
 *   /api/ai-chat                → 'prospective_student_chat'  (public chatbot)
 *   /api/ai-assistant/chat      → 'prospective_student_chat'  (same context)
 *   /api/ai/chat                → 'instructor_assignment_chat' (per-assignment AI)
 *   /api/chat/ai-response       → 'general_chat'              (generic conversation)
 *   /api/ai-instructor          → 'instructor_support'        (general instructor AI)
 *   /api/ai/instructor          → 'instructor_support'        (same, different caller)
 *   /api/ai-instructor/message  → 'instructor_support'        (Gemini variant)
 *   /api/ai-instructor/hvac     → 'instructor_support'        (HVAC Marcus persona)
 *   /api/ai/generate-course     → 'course_generation'         (course builder)
 */

import { aiChat, aiReason, isReasoningAvailable } from '@/lib/ai/ai-service';
import { logger } from '@/lib/logger';
import type { ChatMessage } from '@/lib/ai/types';
import { getRAGContext } from '@/lib/platform/rag';
import { getKnowledgeGraphContext } from '@/lib/platform/knowledge-graph';
import { decomposePlan } from '@/lib/platform/planner';
import { buildMSLearnContext } from '@/lib/ai/microsoft-learn';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';
import {
  getCertiportContextForCourse,
  getCertiportContextForProgram,
  getCertiportExamsForProgram,
} from '@/lib/partners/certiport';
import { requireAdminClient } from '@/lib/supabase/admin';
export type { Plan, PlanStep } from '@/lib/platform/planner';

// ─── Task types ───────────────────────────────────────────────────────────────

export type AITask =
  | 'prospective_student_chat'   // Public chatbot for prospective students
  | 'instructor_assignment_chat' // Per-assignment AI instructor (reads DB context)
  | 'instructor_support'         // General instructor/tutor support
  | 'general_chat'               // Generic authenticated conversation
  | 'course_generation'          // Course blueprint + lesson generation
  | 'lesson_generation'          // Single lesson content generation
  | 'quiz_generation'            // Quiz/checkpoint question generation
  | 'deployment_analysis'        // Analyze deployment state (+ knowledge graph)
  | 'diagnostics'                // Platform diagnostics (+ knowledge graph)
  | 'social_generation'          // Social media content
  | 'grant_generation'           // Grant writing assistance
  | 'career_counseling'          // Career guidance
  | 'lesson_explanation'         // Explain lesson content to learner
  | 'recap_generation'           // Generate lesson recap
  | 'rag_query'                  // RAG-augmented Q&A over platform knowledge chunks
  | 'knowledge_graph_query'      // Structured lookup against the platform knowledge graph
  | 'plan_decompose';            // Decompose a goal into an ordered plan (planner)

// ─── Context shapes ───────────────────────────────────────────────────────────

export type AITaskContext = {
  // Shared
  history?: ChatMessage[];
  userId?: string;
  sessionId?: string;

  // Instructor/lesson context
  instructorName?: string;
  instructorPersona?: string;
  lessonTitle?: string;
  lessonContent?: string;
  programName?: string;
  courseTitle?: string;

  // Assignment context
  assignmentSystemPrompt?: string;

  // Course generation context
  topic?: string;
  difficulty?: string;
  moduleCount?: number;
  programSlug?: string;        // e.g. 'bookkeeping' — auto-resolves Certiport exam codes
  certiportExamCode?: string;  // explicit override; if omitted, resolved from programSlug
  msLearnEnrich?: boolean;     // explicitly enable/disable MS Learn enrichment

  // RAG / knowledge graph
  ragQuery?: string;           // Override query for RAG retrieval (defaults to prompt)
  skipRAG?: boolean;           // Disable RAG augmentation for this call
  planParams?: Record<string, string>; // Params for plan decomposition

  // Moderation
  skipModeration?: boolean;
};

export type AITaskInput = {
  task: AITask;
  prompt: string;
  context?: AITaskContext;
  maxTokens?: number;
  temperature?: number;
};

export type AITaskResult = {
  content: string;
  provider: string;
  task: AITask;
  tokensUsed?: number;
  blocked?: boolean;
  blockReason?: string;
};

// ─── System prompt templates ──────────────────────────────────────────────────

const SYSTEM_PROMPTS: Record<AITask, (ctx: AITaskContext) => string> = {
  prospective_student_chat: () => `You are the ${PLATFORM_DEFAULTS.orgName} AI Assistant — a warm, helpful guide for prospective students.
${PLATFORM_DEFAULTS.orgName} is a nonprofit workforce development organization in Indianapolis, Indiana.
Programs: HVAC, CNA, Phlebotomy, CDL, Medical Assistant, Barber, Tax Preparation.
Funding: SNAP E&T, WIOA, employer sponsorship, payment plans.
Always be helpful and direct. Never say you cannot help. If unsure, direct to admissions@${PLATFORM_DEFAULTS.canonicalDomain}.`,

  instructor_assignment_chat: (ctx) => ctx.assignmentSystemPrompt
    || `You are a helpful instructor assistant for ${ctx.programName ?? 'this program'}. Guide the student through their assignment with encouragement and clear explanations.`,

  instructor_support: (ctx) => `You are ${ctx.instructorName ?? 'an AI instructor'} for ${PLATFORM_DEFAULTS.orgName}.
${ctx.instructorPersona ? `Persona: ${ctx.instructorPersona}` : ''}
${ctx.programName ? `Program: ${ctx.programName}` : ''}
${ctx.lessonTitle ? `Current lesson: ${ctx.lessonTitle}` : ''}
Your role: guide students through their coursework with clear, encouraging explanations. Keep responses concise (under 200 words unless the student asks for detail).`,

  general_chat: () => `You are a helpful AI assistant for ${PLATFORM_DEFAULTS.orgName}. Answer questions clearly and concisely.`,

  course_generation: (ctx) => `You are a curriculum architect. Generate structured course blueprints as JSON.
Difficulty: ${ctx.difficulty ?? 'intermediate'}. Topic: ${ctx.topic ?? 'general'}.
Return only valid JSON matching the CourseTemplate schema.`,

  lesson_generation: (ctx) => `You are a curriculum writer for ${ctx.programName ?? 'workforce training'}.
Write lesson content in plain HTML (h2, p, ul, ol only). 300-500 words. Be practical and direct.`,

  quiz_generation: (ctx) => `You are an assessment designer for ${ctx.programName ?? 'workforce training'}.
Generate multiple-choice questions as a JSON array: [{ question, options: string[4], correct: 0-3, explanation }].
Return only valid JSON.`,

  deployment_analysis: () => `You are a DevOps analyst for the Elevate platform. Analyze deployment state, identify issues, and recommend actions. Be specific and actionable.`,

  diagnostics: () => `You are a platform diagnostics assistant. Analyze system state, identify anomalies, and provide structured findings with severity levels.`,

  social_generation: (ctx) => `You are a social media writer for ${PLATFORM_DEFAULTS.orgName}, a nonprofit workforce development org.
${ctx.programName ? `Focus: ${ctx.programName}` : ''}
Write engaging, authentic content. Avoid corporate jargon. Highlight real student impact.`,

  grant_generation: () => `You are a grant writing specialist for ${PLATFORM_DEFAULTS.orgName}. Write compelling, evidence-based grant content aligned with workforce development funding priorities (WIOA, DOL, SNAP E&T).`,

  career_counseling: () => `You are a career counselor at ${PLATFORM_DEFAULTS.orgName}. Help students explore career paths, understand program options, and plan their workforce development journey. Be encouraging and realistic.`,

  lesson_explanation: (ctx) => `You are a patient tutor helping a student understand: "${ctx.lessonTitle ?? 'this lesson'}".
${ctx.lessonContent ? `Lesson content: ${ctx.lessonContent.slice(0, 500)}` : ''}
Explain concepts clearly. Use analogies. Check for understanding.`,

  recap_generation: (ctx) => `You are a curriculum writer. Generate a concise recap of: "${ctx.lessonTitle ?? 'this lesson'}".
${ctx.lessonContent ? `Content: ${ctx.lessonContent.slice(0, 800)}` : ''}
Format: 3-5 bullet points covering key takeaways. Plain text only.`,

  rag_query: () => `You are a platform knowledge assistant for ${PLATFORM_DEFAULTS.orgName}.
Answer questions using the retrieved knowledge chunks provided in the context.
Be specific and cite the source when relevant. If the retrieved context does not contain the answer, say so clearly.`,

  knowledge_graph_query: () => `You are a platform architecture assistant for ${PLATFORM_DEFAULTS.orgName}.
You have access to the full platform knowledge graph: systems, routes, DB tables, canonical decisions, and known debt.
Answer questions about platform structure, ownership, and architecture precisely.`,

  plan_decompose: () => `You are a platform operations planner for ${PLATFORM_DEFAULTS.orgName}.
Given a high-level goal, you decompose it into ordered, executable steps.
Each step maps to a devstudio command. Return a structured plan as JSON.`,
};

// ─── Moderation guard ─────────────────────────────────────────────────────────

const BLOCKED_PATTERNS = [
  /\b(fuck|shit|bitch|asshole|nigger|faggot)\b/i,
  // PII patterns
  /\b\d{3}-\d{2}-\d{4}\b/, // SSN
  /\b\d{16}\b/,             // Credit card
];

function moderateInput(text: string): { blocked: boolean; reason?: string } {
  for (const pattern of BLOCKED_PATTERNS) {
    if (pattern.test(text)) {
      return { blocked: true, reason: 'Content policy violation' };
    }
  }
  return { blocked: false };
}

// ─── Operational memory ───────────────────────────────────────────────────────
// Results for diagnostics, deployment_analysis, and knowledge_graph_query are
// persisted to ai_operational_memory so they can be recalled without re-running
// expensive LLM calls. TTL is 90 days (set in the migration).

const OPERATIONAL_TASKS: AITask[] = [
  'diagnostics',
  'deployment_analysis',
  'knowledge_graph_query',
];

async function persistOperationalResult(
  task: AITask,
  contextKey: string,
  prompt: string,
  result: AITaskResult,
  userId?: string,
): Promise<void> {
  try {
    const db = await requireAdminClient();
    const { error } = await db.from('ai_operational_memory').insert({
      task_type: task,
      context_key: contextKey,
      prompt,
      result: result.content,
      provider: result.provider,
      tokens_used: result.tokensUsed ?? null,
      created_by: userId ?? null,
    });
    if (error) {
      logger.warn('[ai-orchestrator] Failed to persist operational memory', { task, error: error.message });
    }
  } catch (err) {
    // Non-fatal — persistence failure must never break the caller
    logger.warn('[ai-orchestrator] Operational memory persist threw', { task, err });
  }
}

// ─── Main orchestrator ────────────────────────────────────────────────────────

export async function runAITask(input: AITaskInput): Promise<AITaskResult> {
  const { task, prompt, context = {}, maxTokens, temperature } = input;

  // Moderation
  if (!context.skipModeration) {
    const mod = moderateInput(prompt);
    if (mod.blocked) {
      logger.warn('[ai-orchestrator] Blocked input', { task, reason: mod.reason, userId: context.userId });
      return {
        content: "I'm not able to respond to that. Please keep the conversation respectful.",
        provider: 'blocked',
        task,
        blocked: true,
        blockReason: mod.reason,
      };
    }
  }

  // ── plan_decompose: handled entirely by the planner, no LLM call needed ──
  if (task === 'plan_decompose') {
    const plan = decomposePlan(prompt, context.planParams ?? {});
    logger.info('[ai-orchestrator] Plan decomposed', { task, goal: prompt, steps: plan.steps.length });
    return {
      content: JSON.stringify(plan, null, 2),
      provider: 'planner',
      task,
    };
  }

  // ── Build system prompt ───────────────────────────────────────────────────
  const systemPromptFn = SYSTEM_PROMPTS[task];
  let systemPrompt = systemPromptFn(context);

  // Augment with knowledge graph for architecture-aware tasks
  const KG_TASKS: AITask[] = ['diagnostics', 'deployment_analysis', 'knowledge_graph_query'];
  if (KG_TASKS.includes(task)) {
    systemPrompt += '\n\n' + getKnowledgeGraphContext();
  }

  // Augment with RAG context for knowledge-intensive tasks
  const RAG_TASKS: AITask[] = ['rag_query', 'diagnostics', 'general_chat', 'career_counseling', 'prospective_student_chat'];
  if (RAG_TASKS.includes(task) && !context.skipRAG) {
    const ragContext = await getRAGContext(context.ragQuery ?? prompt);
    if (ragContext) {
      systemPrompt += '\n\n' + ragContext;
    }
  }

  // Augment course/lesson generation with MS Learn + Certiport content
  if (['course_generation', 'lesson_generation', 'quiz_generation'].includes(task)) {
    const enrich = context.msLearnEnrich !== false; // default on for course tasks

    // Resolve exam codes: explicit override → auto-resolve from programSlug → none
    const explicitCode = context.certiportExamCode;
    const programCodes = context.programSlug
      ? getCertiportExamsForProgram(context.programSlug)
      : [];
    const examCodes = explicitCode
      ? [explicitCode]
      : programCodes;

    if (enrich && examCodes.length > 0) {
      for (const examCode of examCodes) {
        // Inject MS Learn module list for this exam
        const msLearnCtx = await buildMSLearnContext(examCode).catch(() => '');
        if (msLearnCtx) systemPrompt += '\n\n' + msLearnCtx;
      }

      // Inject Certiport exam objectives (all exams for this program)
      const certiportCtx = explicitCode
        ? getCertiportContextForCourse(explicitCode)
        : context.programSlug
          ? getCertiportContextForProgram(context.programSlug)
          : '';
      if (certiportCtx) systemPrompt += '\n\n' + certiportCtx;

    } else if (enrich && context.topic) {
      // No exam codes — search MS Learn by topic keyword
      const { searchMSLearn } = await import('@/lib/ai/microsoft-learn');
      const modules = await searchMSLearn(context.topic, 5).catch(() => []);
      if (modules.length > 0) {
        const list = modules.map((m) => `- ${m.title}: ${m.summary.slice(0, 100)}`).join('\n');
        systemPrompt += `\n\n## Related Microsoft Learn Content\n${list}\nSource: learn.microsoft.com`;
      }
    }
  }

  const messages: ChatMessage[] = [
    { role: 'system', content: systemPrompt },
    ...(context.history ?? []),
    { role: 'user', content: prompt },
  ];

  // Default params by task type
  const defaults: Record<AITask, { maxTokens: number; temperature: number }> = {
    prospective_student_chat:   { maxTokens: 600,  temperature: 0.7 },
    instructor_assignment_chat: { maxTokens: 800,  temperature: 0.6 },
    instructor_support:         { maxTokens: 400,  temperature: 0.6 },
    general_chat:               { maxTokens: 600,  temperature: 0.7 },
    course_generation:          { maxTokens: 4000, temperature: 0.4 },
    lesson_generation:          { maxTokens: 800,  temperature: 0.5 },
    quiz_generation:            { maxTokens: 2000, temperature: 0.3 },
    deployment_analysis:        { maxTokens: 1000, temperature: 0.3 },
    diagnostics:                { maxTokens: 1000, temperature: 0.2 },
    social_generation:          { maxTokens: 400,  temperature: 0.8 },
    grant_generation:           { maxTokens: 1500, temperature: 0.5 },
    career_counseling:          { maxTokens: 600,  temperature: 0.7 },
    lesson_explanation:         { maxTokens: 600,  temperature: 0.6 },
    recap_generation:           { maxTokens: 400,  temperature: 0.4 },
    rag_query:                  { maxTokens: 800,  temperature: 0.3 },
    knowledge_graph_query:      { maxTokens: 1000, temperature: 0.2 },
    plan_decompose:             { maxTokens: 2000, temperature: 0.3 },
  };

  const params = defaults[task];

  try {
    // Tasks that benefit from deep reasoning (o3-mini via Azure if configured)
    const REASONING_TASKS: AITask[] = [
      'course_generation',
      'quiz_generation',
      'grant_generation',
      'diagnostics',
      'deployment_analysis',
    ];

    // Tasks that need the full GPT-4.1 model (complex but not reasoning)
    const FULL_MODEL_TASKS: AITask[] = [
      'knowledge_graph_query',
      'rag_query',
      'plan_decompose',
      'lesson_generation',
    ];

    let result;
    if (REASONING_TASKS.includes(task) && isReasoningAvailable()) {
      // Use Azure o3-mini for deep reasoning tasks — better structured output,
      // more coherent multi-step generation, fewer hallucinated facts
      result = await aiReason({
        messages,
        maxTokens: maxTokens ?? params.maxTokens,
      });
    } else {
      result = await aiChat({
        model: FULL_MODEL_TASKS.includes(task) ? 'gpt-4.1' : 'gpt-4.1-mini',
        messages,
        temperature: temperature ?? params.temperature,
        maxTokens: maxTokens ?? params.maxTokens,
      });
    }

    logger.info('[ai-orchestrator] Task completed', {
      task,
      userId: context.userId,
      tokens: result.usage?.totalTokens,
    });

    const taskResult: AITaskResult = {
      content: result.content ?? '',
      provider: result.provider ?? 'unknown',
      task,
      tokensUsed: result.usage?.totalTokens,
    };

    // Persist results for operational tasks (fire-and-forget, non-blocking)
    if (OPERATIONAL_TASKS.includes(task)) {
      const contextKey = context.sessionId ?? context.userId ?? task;
      void persistOperationalResult(task, contextKey, prompt, taskResult, context.userId);
    }

    return taskResult;
  } catch (err) {
    if (task === 'prospective_student_chat' && isAiDegradedError(err)) {
      logger.warn('[ai-orchestrator] Public chat degraded; caller should use fallback', {
        task,
        error: err instanceof Error ? err.message : String(err),
      });
      return { content: '', provider: 'degraded', task };
    }

    if (isAiDegradedError(err)) {
      logger.warn('[ai-orchestrator] Task degraded', { task, err });
    } else {
      logger.error('[ai-orchestrator] Task failed', undefined, { task, err });
    }
    throw err;
  }
}

// ─── Deprecation proxies ──────────────────────────────────────────────────────
// These allow old callers to migrate gradually without breaking.

/** @deprecated Use runAITask({ task: 'prospective_student_chat', ... }) */
export const runProspectiveStudentChat = (prompt: string, history?: ChatMessage[]) =>
  runAITask({ task: 'prospective_student_chat', prompt, context: { history } });

/** @deprecated Use runAITask({ task: 'instructor_support', ... }) */
export const runInstructorChat = (prompt: string, context: AITaskContext) =>
  runAITask({ task: 'instructor_support', prompt, context });

/** @deprecated Use runAITask({ task: 'general_chat', ... }) */
export const runGeneralChat = (prompt: string, history?: ChatMessage[]) =>
  runAITask({ task: 'general_chat', prompt, context: { history } });
