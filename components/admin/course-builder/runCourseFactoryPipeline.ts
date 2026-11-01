'use client';

import { courseBuilderJsonHeaders } from '@/components/admin/course-builder/request';

export type CourseFactoryPipelineStage =
  | 'queued'
  | 'blueprint'
  | 'lessons'
  | 'quizzes'
  | 'validate'
  | 'publish'
  | 'videos'
  | 'complete'
  | 'error';

export type CourseFactoryPipelineResult = {
  success: boolean;
  queued?: boolean;
  buildId?: string;
  jobId?: string;
  courseId: string | null;
  title: string;
  modulesGenerated: number;
  lessonsGenerated: number;
  lessonsWithQuizzes: number;
  videosQueued: number;
  errors: string[];
  dryRun: boolean;
  governance?: unknown;
  completionState?: 'content_only' | 'media_pending' | 'ready_for_review';
};

export type CourseFactoryPipelineEvent = {
  stage: CourseFactoryPipelineStage;
  message?: string;
  progress?: number;
  result?: CourseFactoryPipelineResult;
};

export type CourseFactoryPipelineInput = {
  title: string;
  topic: string;
  programId: string;
  programSlug?: string;
  audience?: string;
  state?: string;
  credential?: string;
  credentialRegistryKey?: string;
  hours?: number;
  deliveryFormat?: string;
  additionalRequirements?: string;
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  moduleCount?: number;
  lessonsPerModule?: number;
  buildScope?: 'lesson' | 'course';
  includeVideos?: boolean;
  dryRun?: boolean;
  studioConversationId?: string;
  studioTaskId?: string;
};

/** Existing creation surfaces hand off to the same asynchronous production owner. */
export async function runCourseFactoryPipeline(
  input: CourseFactoryPipelineInput,
  onEvent?: (event: CourseFactoryPipelineEvent) => void,
): Promise<CourseFactoryPipelineResult> {
  const response = await fetch('/api/admin/course-builder', {
    method: 'POST',
    headers: { ...courseBuilderJsonHeaders('generate'), Accept: 'application/json' },
    cache: 'no-store',
    body: JSON.stringify(input),
  });
  const body = await response.json().catch(() => null);
  if (!response.ok || body?.ok !== true)
    throw new Error(body?.error || body?.errors?.join('; ') || `Course Builder request failed (HTTP ${response.status})`);
  if (!body.dryRun && (!body.queued || !body.buildId || !body.jobId || !body.courseId))
    throw new Error('Course Builder did not confirm a saved production job');
  const result: CourseFactoryPipelineResult = {
    success: true, courseId: body.courseId || null, title: input.title,
    queued: body.queued === true, buildId: body.buildId, jobId: body.jobId,
    modulesGenerated: 0, lessonsGenerated: 0, lessonsWithQuizzes: 0,
    videosQueued: 0, errors: [], dryRun: body.dryRun === true,
    completionState: body.dryRun ? undefined : 'media_pending',
  };
  onEvent?.({ stage: body.dryRun ? 'complete' : 'queued',
    message: body.dryRun ? 'Request validated. No generation started.' : 'Production job saved. Follow its progress in the course workspace.', result });
  return result;
}
