/**
 * lib/ai/execute-ai-task.ts
 *
 * Canonical entry point for all AI task execution.
 * Re-exports runAITask from the orchestrator under the executeAiTask name.
 *
 * ALL AI work routes through here — no direct provider instantiation in
 * route handlers or components.
 *
 * Usage:
 *   import { executeAiTask } from '@/lib/ai/execute-ai-task';
 *
 *   const result = await executeAiTask({
 *     task: 'course_generation',
 *     prompt: 'HVAC EPA 608 certification prep',
 *     context: { programId: '...' },
 *   });
 *
 * Task types:
 *   'course_generation'        — blueprint + lesson generation
 *   'rag_query'                — RAG-augmented platform knowledge Q&A
 *   'career_path'              — career pathway planning
 *   'chat'                     — general assistant chat
 *   'prospective_student_chat' — public-facing prospective student chat
 *   'instructor_support'       — instructor-facing support
 *   'general_chat'             — fallback general chat
 *
 * See lib/ai/orchestrator.ts for the full AITask type and implementation.
 */

export {
  runAITask as executeAiTask,
  type AITask,
  type AITaskInput,
  type AITaskResult,
  type AITaskContext,
} from './orchestrator';
