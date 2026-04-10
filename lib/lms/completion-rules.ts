/**
 * Program-specific completion rules engine.
 *
 * Each program defines its own completion criteria via the
 * programs.completion_criteria JSONB column.
 *
 * Supported rule types:
 * - lessons_complete: all required lessons must be completed
 * - quizzes_passed: all required quizzes must be passed with minimum score
 * - min_hours: minimum total hours spent
 * - external_modules: external certifications or modules required
 *
 * Example completion_criteria:
 * {
 *   "rules": [
 *     { "type": "lessons_complete", "required": true },
 *     { "type": "quizzes_passed", "minScore": 80 },
 *     { "type": "min_hours", "hours": 40 }
 *   ]
 * }
 */

import { getAdminClient } from '@/lib/supabase/admin';

export interface CompletionRule {
  type: 'lessons_complete' | 'quizzes_passed' | 'min_hours' | 'external_modules';
  required?: boolean;
  minScore?: number;
  hours?: number;
  modules?: string[];
}

export interface CompletionCriteria {
  rules: CompletionRule[];
}

export interface CompletionStatus {
  isComplete: boolean;
  progressPercent: number;
  ruleResults: {
    rule: CompletionRule;
    passed: boolean;
    detail: string;
  }[];
}

/**
 * Default completion criteria if none is set on the program.
 */
const DEFAULT_CRITERIA: CompletionCriteria = {
  rules: [
    { type: 'lessons_complete', required: true },
  ],
};

/**
 * Evaluate completion status for a user in a program.
 */
export async function evaluateCompletion(
  userId: string,
  programId: string,
  courseId: string
): Promise<CompletionStatus> {
  const db = await getAdminClient();
  if (!db) return { isComplete: false, progressPercent: 0, ruleResults: [] };

  // Get program completion criteria
  const { data: program } = await db
    .from('programs')
    .select('completion_criteria')
    .eq('id', programId)
    .single();

  const criteria: CompletionCriteria = program?.completion_criteria?.rules
    ? program.completion_criteria
    : DEFAULT_CRITERIA;

  const ruleResults: CompletionStatus['ruleResults'] = [];

  for (const rule of criteria.rules) {
    switch (rule.type) {
      case 'lessons_complete': {
        const { count: totalLessons } = await db
          .from('training_lessons')
          .select('id', { count: 'exact', head: true })
          .eq('course_id', courseId)
          .eq('is_required', true);

        const { count: completedLessons } = await db
          .from('lesson_progress')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', userId)
          .eq('course_id', courseId)
          .eq('completed', true);

        const total = totalLessons || 0;
        const completed = completedLessons || 0;
        const passed = total > 0 && completed >= total;

        ruleResults.push({
          rule,
          passed,
          detail: `${completed}/${total} required lessons completed`,
        });
        break;
      }

      case 'quizzes_passed': {
        const minScore = rule.minScore || 70;
        const { data: attempts } = await db
          .from('quiz_attempts')
          .select('score, quiz_id')
          .eq('user_id', userId);

        // Get quizzes for this course
        const { data: quizzes } = await db
          .from('quizzes')
          .select('id')
          .eq('course_id', courseId);

        const quizIds = new Set((quizzes || []).map((q: any) => q.id));
        const passedQuizzes = new Set(
          (attempts || [])
            .filter((a: any) => quizIds.has(a.quiz_id) && a.score >= minScore)
            .map((a: any) => a.quiz_id)
        );

        const passed = quizIds.size > 0 && passedQuizzes.size >= quizIds.size;

        ruleResults.push({
          rule,
          passed,
          detail: `${passedQuizzes.size}/${quizIds.size} quizzes passed (min ${minScore}%)`,
        });
        break;
      }

      case 'min_hours': {
        const requiredHours = rule.hours || 0;
        const { data: progress } = await db
          .from('lesson_progress')
          .select('time_spent_seconds')
          .eq('user_id', userId)
          .eq('course_id', courseId);

        const totalSeconds = (progress || []).reduce(
          (sum: number, p: any) => sum + (p.time_spent_seconds || 0), 0
        );
        const totalHours = totalSeconds / 3600;
        const passed = totalHours >= requiredHours;

        ruleResults.push({
          rule,
          passed,
          detail: `${totalHours.toFixed(1)}/${requiredHours} hours completed`,
        });
        break;
      }

      default:
        ruleResults.push({
          rule,
          passed: false,
          detail: `Unknown rule type: ${rule.type}`,
        });
    }
  }

  const passedCount = ruleResults.filter(r => r.passed).length;
  const totalRules = ruleResults.length;
  const isComplete = totalRules > 0 && passedCount === totalRules;
  const progressPercent = totalRules > 0 ? Math.round((passedCount / totalRules) * 100) : 0;

  return { isComplete, progressPercent, ruleResults };
}
