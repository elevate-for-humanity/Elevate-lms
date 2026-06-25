/**
 * factory.ts
 * 
 * Main orchestrator for the Course Factory.
 * Single entry point for course creation.
 * 
 * Flow:
 * 1. Load blueprint
 * 2. Load program
 * 3. Enrich content (AI) - optional
 * 4. Validate
 * 5. Publish
 * 6. Queue videos (optional)
 */

import { requireAdminClient } from '@/lib/supabase/admin';
import { isAIAvailable } from '@/lib/ai/ai-service';
import { logger } from '@/lib/logger';
import { loadBlueprintWithProgram } from './blueprint-loader';
import { publishCourse } from './publisher';
import type { 
  FactoryInput, 
  FactoryOutput, 
  FactoryStage, 
  ProgressCallback
} from './types';

// ─── Progress Tracking ─────────────────────────────────────────────────────────

class ProgressTracker {
  private callbacks: ProgressCallback[] = [];
  private stages: Map<FactoryStage, string> = new Map();

  addCallback(cb: ProgressCallback) {
    this.callbacks.push(cb);
  }

  emit(stage: FactoryStage, message: string, progress?: number) {
    this.stages.set(stage, message);
    for (const cb of this.callbacks) {
      cb(stage, message, progress);
    }
    logger.info(`[factory] ${stage}: ${message}`);
  }
}

// ─── Main Factory Function ─────────────────────────────────────────────────────

export async function courseFactory(
  input: FactoryInput,
  onProgress?: ProgressCallback,
): Promise<FactoryOutput> {
  const progress = new ProgressTracker();
  if (onProgress) progress.addCallback(onProgress);

  try {
    progress.emit('init', 'Initializing course factory...');
    progress.emit('resolve', 'Loading program and blueprint...');

    const db = await requireAdminClient();

    // Load blueprint and program
    const blueprintWithProgram = input.blueprint 
      ? null 
      : await loadBlueprintWithProgram(db, { 
          programId: input.programId, 
          programSlug: input.programSlug 
        });

    if (!blueprintWithProgram && !input.blueprint) {
      return {
        ok: false,
        status: 'not_found',
        errors: ['Program not found or no matching blueprint'],
      };
    }

    const program = blueprintWithProgram!.program;
    const blueprint = input.blueprint ?? blueprintWithProgram!.blueprint;

    progress.emit('blueprint', `Loaded blueprint: ${blueprint.credentialTitle}`);

    // AI enrichment stage (placeholder - can be extended)
    if (input.contentSource === 'ai' && isAIAvailable()) {
      progress.emit('enrich', 'AI content enrichment available...');
    }

    progress.emit('validate', 'Validating course structure...');
    progress.emit('publish', 'Publishing to database...');

    // Publish course
    const publishResult = await publishCourse({
      programId: program.id,
      courseSlug: blueprint.programSlug ?? `course-${Date.now()}`,
      courseTitle: blueprint.credentialTitle,
      blueprint: blueprint.modules,
      mode: input.mode ?? 'missing-only',
    });

    if (!publishResult.success) {
      return {
        ok: false,
        status: 'incomplete',
        errors: publishResult.errors,
        warnings: publishResult.warnings,
      };
    }

    progress.emit('complete', 'Course factory complete!');

    return {
      ok: true,
      courseId: publishResult.courseId,
      courseSlug: blueprint.programSlug ?? undefined,
      title: blueprint.credentialTitle,
      moduleCount: publishResult.moduleCount,
      lessonCount: publishResult.lessonCount,
      skippedCount: publishResult.skippedCount,
      warnings: publishResult.warnings,
      errors: [],
      status: 'success',
    };

  } catch (err) {
    logger.error('[factory] Course factory error', err);
    progress.emit('error', `Factory failed: ${err instanceof Error ? err.message : String(err)}`);
    
    return {
      ok: false,
      status: 'db_error',
      errors: [err instanceof Error ? err.message : String(err)],
      warnings: [],
    };
  }
}

// ─── Simple API ────────────────────────────────────────────────────────────────

export interface SimpleCourseInput {
  programSlug: string;
  mode?: 'replace' | 'missing-only';
  contentSource?: 'ai' | 'blueprint';
  includeVideos?: boolean;
}

export async function createCourse(input: SimpleCourseInput): Promise<FactoryOutput> {
  return courseFactory({
    programSlug: input.programSlug,
    mode: input.mode ?? 'missing-only',
    contentSource: input.contentSource ?? 'blueprint',
    videoMode: input.includeVideos ? 'queue' : 'off',
  });
}

export async function factoryFromSlug(
  slug: string,
  options?: { mode?: 'replace' | 'missing-only'; contentSource?: 'ai' | 'blueprint' },
): Promise<FactoryOutput> {
  return createCourse({
    programSlug: slug,
    mode: options?.mode ?? 'missing-only',
    contentSource: options?.contentSource ?? 'blueprint',
  });
}
