import type { SupabaseClient } from '@supabase/supabase-js';
import { UltimateSupabasePersistence } from './supabase-persistence';

/** Every worker-owned write is checked in the SAME Postgres transaction as
 * the mutation. No direct PostgREST update is allowed in this adapter. */
export class UltimateFencedPersistence extends UltimateSupabasePersistence {
  constructor(
    private readonly client: SupabaseClient,
    private readonly jobId: string,
    private readonly workerId: string,
    private readonly generation: number,
  ) {
    super(client);
    if (!Number.isSafeInteger(generation) || generation < 1) {
      throw new Error('ULTIMATE_EXECUTION_GENERATION_REQUIRED');
    }
  }

  private async write(action: string, target: string, data: Record<string, unknown> = {}) {
    const { data: result, error } = await this.client.rpc('ultimate_fenced_write', {
      p_job: this.jobId,
      p_worker: this.workerId,
      p_generation: this.generation,
      p_action: action,
      p_target: target,
      p_data: data,
    });
    if (error) throw new Error('ULTIMATE_FENCED_WRITE_FAILED:' + action + ':' + error.message);
    return result as { id?: string; ok?: boolean };
  }

  override async createLesson(input: { buildId: string; lessonKey: string; competencyId: string }) {
    const result = await this.write('create_lesson', input.buildId, input);
    if (!result?.id) throw new Error('ULTIMATE_FENCED_CREATE_LESSON_MISSING_ID');
    return { id: result.id };
  }

  override async recordStep(input: any) {
    await this.write('record_step', input.lessonBuildId, input);
  }

  override async saveArtifact(input: any) {
    await this.write('save_artifact', input.lessonBuildId, { artifacts: input.artifacts });
  }

  override async recordFinding(input: any) {
    await this.write('record_finding', input.buildId, { finding: input.finding });
  }

  override async finishLesson(input: any) {
    await this.write('finish_lesson', input.lessonBuildId, input);
  }

  override async updateBuild(input: any) {
    await this.write('update_build', input.buildId, input);
  }
}
