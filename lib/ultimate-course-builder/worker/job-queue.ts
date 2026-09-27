import type { SupabaseClient } from '@supabase/supabase-js';

export class UltimateJobQueue {
  constructor(private db: SupabaseClient) {}

  async enqueue(buildId: string, payload: unknown = {}) {
    const active = () =>
      this.db
        .from('ultimate_build_jobs')
        .select('*')
        .eq('build_id', buildId)
        .eq('job_type', 'course_build')
        .in('status', ['queued', 'running'])
        .maybeSingle();
    const { data: existing, error: readError } = await active();
    if (readError) throw readError;
    if (existing) return existing;
    const { data, error } = await this.db
      .from('ultimate_build_jobs')
      .insert({ build_id: buildId, job_type: 'course_build', status: 'queued', payload })
      .select('*')
      .single();
    if (error?.code === '23505') {
      const { data: concurrent, error: concurrentError } = await active();
      if (concurrentError) throw concurrentError;
      if (concurrent) return concurrent;
    }
    if (error) throw error;
    return data;
  }

  async claim(workerId: string, leaseSeconds = 300) {
    const { data, error } = await this.db.rpc('claim_ultimate_build_job', {
      p_worker: workerId,
      p_lease_seconds: leaseSeconds,
    });
    if (error) throw error;
    return data?.[0] ?? null;
  }

  async heartbeat(jobId: string, workerId: string, leaseSeconds = 300) {
    const { data, error } = await this.db.rpc('heartbeat_ultimate_build_job', {
      p_job: jobId,
      p_worker: workerId,
      p_lease_seconds: leaseSeconds,
    });
    if (error) throw error;
    return data === true;
  }

  async complete(jobId: string, workerId: string) {
    const { error } = await this.db
      .from('ultimate_build_jobs')
      .update({
        status: 'completed',
        lease_owner: null,
        lease_expires_at: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', jobId)
      .eq('lease_owner', workerId);
    if (error) throw error;
  }

  async fail(jobId: string, workerId: string, errorMessage: string, retry = true) {
    const { data, error } = await this.db
      .from('ultimate_build_jobs')
      .select('attempts,max_attempts')
      .eq('id', jobId)
      .eq('lease_owner', workerId)
      .single();
    if (error) throw error;
    const canRetry = retry && data.attempts < data.max_attempts;
    const { error: updateError } = await this.db
      .from('ultimate_build_jobs')
      .update({
        status: canRetry ? 'queued' : 'failed',
        available_at: canRetry
          ? new Date(
              Date.now() + Math.min(300000, 15000 * 2 ** Math.max(0, data.attempts - 1)),
            ).toISOString()
          : undefined,
        lease_owner: null,
        lease_expires_at: null,
        last_error: errorMessage,
        updated_at: new Date().toISOString(),
      })
      .eq('id', jobId)
      .eq('lease_owner', workerId);
    if (updateError) throw updateError;
  }
}
