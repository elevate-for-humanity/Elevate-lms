'use client';

import { courseBuilderJsonHeaders } from '@/components/admin/course-builder/request';

export type CourseFactoryPipelineStage =
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
  courseId: string | null;
  title: string;
  modulesGenerated: number;
  lessonsGenerated: number;
  lessonsWithQuizzes: number;
  videosQueued: number;
  errors: string[];
  dryRun: boolean;
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
  hours?: number;
  deliveryFormat?: string;
  additionalRequirements?: string;
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  moduleCount?: number;
  lessonsPerModule?: number;
  includeVideos?: boolean;
  dryRun?: boolean;
};

/**
 * Shared browser client for every Course Builder creation surface.
 * All authoring UIs consume the single streaming Course Factory endpoint.
 */
export async function runCourseFactoryPipeline(
  input: CourseFactoryPipelineInput,
  onEvent?: (event: CourseFactoryPipelineEvent) => void,
): Promise<CourseFactoryPipelineResult> {
  const response = await fetch('/api/admin/course-builder', {
    method: 'POST',
    headers: { ...courseBuilderJsonHeaders('generate'), Accept: 'text/event-stream' },
    cache: 'no-store',
    body: JSON.stringify(input),
  });

  if (!response.ok || !response.body) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.error || `Course Factory request failed (HTTP ${response.status})`);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let finalResult: CourseFactoryPipelineResult | null = null;

  const consume = (chunk: string) => {
    if (!chunk.startsWith('data: ')) return;
    const event = JSON.parse(chunk.slice(6)) as CourseFactoryPipelineEvent;
    onEvent?.(event);
    if (event.stage === 'error') {
      throw new Error(event.message || 'Course Factory failed');
    }
    if (event.stage === 'complete' && event.result) finalResult = event.result;
  };

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const chunks = buffer.split('\n\n');
    buffer = chunks.pop() ?? '';
    for (const chunk of chunks) consume(chunk);
  }
  if (buffer.trim()) consume(buffer.trim());

  if (!finalResult) throw new Error('Course Factory completed without a result');
  const completed = finalResult as CourseFactoryPipelineResult;
  if (!completed.success) {
    throw new Error(completed.errors.join('; ') || 'Course Factory validation failed');
  }
  return completed;
}
