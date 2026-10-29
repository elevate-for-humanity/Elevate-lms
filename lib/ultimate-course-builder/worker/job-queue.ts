import {defaultCourseMonitor} from './default-course-monitor.mjs';
import type { SupabaseClient } from '@supabase/supabase-js';
import {claimExactOwnerPreview} from './owner-preview-claim.mjs';
import {notifyCourseDispatcher} from './dispatch-on-enqueue.mjs';

export class UltimateJobQueue {
  constructor(private db: SupabaseClient) {}

  async enqueue(buildId: string, payload: unknown = {}) {
    if ((payload as any)?.dependencyResume === 'licensed_media_attached') {
      const { data, error } = await this.db.rpc('wake_ultimate_media_dependency', {
        p_build: buildId, p_payload: payload,
      });
      if (error) throw error;
      if (!data?.[0]) {
        const { data: build, error: buildError } = await this.db.from('ultimate_course_builds').select('status').eq('id', buildId).single();
        if (buildError) throw buildError;
        if (build?.status === 'published') return null;
        throw new Error('ULTIMATE_DEPENDENCY_WAKEUP_NOT_PERSISTED');
      }
      await notifyCourseDispatcher({});
      return data[0];
    }
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
    if (existing) {
      if (existing.status === 'queued' && (!existing.available_at || Date.parse(existing.available_at) <= Date.now())) {
        await notifyCourseDispatcher({});
      }
      return existing;
    }
    const { data: previous, error: previousError } = await this.db.from('ultimate_build_jobs')
      .select('monitor,status,payload,pending_dependency_resume').eq('build_id', buildId).eq('job_type', 'course_build')
      .order('created_at', {ascending: false}).limit(1).maybeSingle();
    if (previousError) throw previousError;
    // A failed dependency/paused attempt retains the exact lesson cursor and
    // repair intent. A completed preview must not constrain a full-course run.
    let checkpointPayload: Record<string, unknown> = previous?.payload &&
      typeof previous.payload === 'object' && !Array.isArray(previous.payload) ? {...previous.payload} : {};
    const pending = previous?.pending_dependency_resume;
    if (pending && typeof pending === 'object' && !Array.isArray(pending))
      checkpointPayload = {...checkpointPayload,...pending};
    delete checkpointPayload.progress;
    const nextPayload = previous?.status === 'failed' && payload &&
      typeof payload === 'object' && !Array.isArray(payload) ? {...checkpointPayload,...payload} : payload;
    const { data: queued, error } = await this.db.rpc('enqueue_ultimate_build_job', {
      p_build: buildId, p_payload: nextPayload, p_monitor: defaultCourseMonitor(previous?.monitor),
    });
    const data = queued?.[0] ?? null;
    if (error?.code === '23505') {
      const { data: concurrent, error: concurrentError } = await active();
      if (concurrentError) throw concurrentError;
      if (concurrent) {
        if (concurrent.status === 'queued' && (!concurrent.available_at || Date.parse(concurrent.available_at) <= Date.now())) {
          await notifyCourseDispatcher({});
        }
        return concurrent;
      }
    }
    if (error) throw error;
    if (!data) throw new Error('ULTIMATE_JOB_NOT_PERSISTED');
    if (data.status === 'queued') await notifyCourseDispatcher({});
    return data;
  }

  async claim(workerId: string, leaseSeconds = 300) {
    const role = process.env.ULTIMATE_AUTOPILOT_ROLE;
    if (role) {
      if (!['instruction','media','quality'].includes(role) || process.env.EXTERNAL_COURSE_ATTEMPT_ID || process.env.ULTIMATE_OWNER_PREVIEW_JOB_ID)
        throw new Error('ULTIMATE_AUTOPILOT_ROLE_CONFIGURATION_INVALID');
      const {data,error} = await this.db.rpc('claim_ultimate_lesson_autopilot',{p_worker:workerId,p_lease_seconds:leaseSeconds,p_role:role});
      if (error) throw error;
      return data?.[0] ?? null;
    }
    if (process.env.EXTERNAL_COURSE_ATTEMPT_ID) {
      if (process.env.ULTIMATE_OWNER_PREVIEW_JOB_ID)
        throw new Error('CONFLICTING_EXACT_WORKER_TARGETS');
      const {data, error} = await this.db.rpc('claim_external_course_job', {
        p_attempt: process.env.EXTERNAL_COURSE_ATTEMPT_ID, p_worker: workerId,
      });
      if (error) throw error;
      return data?.[0] ?? null;
    }
    if (process.env.ULTIMATE_OWNER_PREVIEW_JOB_ID)
      return claimExactOwnerPreview(this.db,process.env.ULTIMATE_OWNER_PREVIEW_JOB_ID,workerId,leaseSeconds);
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

  async complete(jobId: string, workerId: string, generation: number) {
    const { data: updated, error } = await this.db
      .from('ultimate_build_jobs')
      .update({
        status: 'completed',
        lease_owner: null,
        lease_expires_at: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', jobId)
      .eq('lease_owner', workerId)
      .eq('execution_generation', generation)
      .eq('status', 'running')
      .gt('lease_expires_at', new Date().toISOString())
      .select('id');
    if (error) throw error;
    if (!updated?.length) throw new Error('ULTIMATE_JOB_LEASE_LOST:'+jobId);
  }

  async waitForDependency(jobId: string, workerId: string, message: string, generation: number, resumePayload?: unknown) {
    // Do not burn attempts for externally blocked assets. The existing
    // wake_ultimate_media_dependency RPC is responsible for resumption.
    const { data: updated, error } = await this.db.from('ultimate_build_jobs').update({
      status: 'failed',
      // This field belongs to actual dependency-arrival events. Writing wait
      // metadata here makes the wakeup trigger replace the entire job payload
      // on its next transition. Preserve an arrival already recorded by the RPC.
      ...(resumePayload === undefined ? {} : { payload: resumePayload }),
      lease_owner: null,
      lease_expires_at: null,
      last_error: message,
      updated_at: new Date().toISOString(),
    }).eq('id', jobId).eq('lease_owner', workerId)
      .eq('execution_generation', generation)
      .eq('status', 'running')
      .gt('lease_expires_at', new Date().toISOString())
      .select('id');
    if (error) throw error;
    if (!updated?.length) throw new Error('ULTIMATE_JOB_LEASE_LOST:'+jobId);
  }

  async requeueForRepair(jobId: string, workerId: string, message: string, generation: number) {
    const { data: updated, error } = await this.db
      .from('ultimate_build_jobs')
      .update({
        status: 'queued',
        available_at: new Date(Date.now() + 60000).toISOString(),
        lease_owner: null,
        lease_expires_at: null,
        last_error: message,
        updated_at: new Date().toISOString(),
      })
      .eq('id', jobId)
      .eq('lease_owner', workerId)
      .eq('execution_generation', generation)
      .eq('status', 'running')
      .gt('lease_expires_at', new Date().toISOString())
      .select('id');
    if (error) throw error;
    if (!updated?.length) throw new Error('ULTIMATE_JOB_LEASE_LOST:'+jobId);
    await notifyCourseDispatcher({});
  }

  /** Yield between lessons. A successful checkpoint is progress, not a failed
   * attempt. The persisted cursor resumes the same job and lets other courses run. */
  async yieldProgress(jobId: string, workerId: string, payload: unknown, generation: number) {
    const { data: updated, error } = await this.db.from('ultimate_build_jobs').update({
      status: 'queued', payload,
      // A checkpoint continuation starts new work; it is not a failed retry.
      // Per-lesson repair limits remain in the preserved payload.
      attempts: 0,
      available_at: new Date(Date.now() + 1000).toISOString(),
      lease_owner: null, lease_expires_at: null, last_error: null,
      updated_at: new Date().toISOString(),
    }).eq('id', jobId).eq('lease_owner', workerId)
      .eq('execution_generation', generation)
      .eq('status', 'running')
      .gt('lease_expires_at', new Date().toISOString())
      .select('id');
    if (error) throw error;
    if (!updated?.length) throw new Error('ULTIMATE_JOB_LEASE_LOST:'+jobId);
    // Each saved lesson checkpoint requests a successor immediately; the
    // durable queue and scheduled coordinator remain the recovery fallback.
    await notifyCourseDispatcher({});
  }

  async fail(jobId: string, workerId: string, errorMessage: string, generation: number, retry = true) {
    const { data, error } = await this.db
      .from('ultimate_build_jobs')
      .select('attempts,max_attempts,build_id')
      .eq('id', jobId)
      .eq('lease_owner', workerId)
      .eq('execution_generation', generation)
      .eq('status', 'running')
      .gt('lease_expires_at', new Date().toISOString())
      .single();
    if (error) throw error;
    const canRetry = retry && data.attempts < data.max_attempts;
    const { data: updated, error: updateError } = await this.db
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
      .eq('lease_owner', workerId)
      .eq('execution_generation', generation)
      .eq('status', 'running')
      .gt('lease_expires_at', new Date().toISOString())
      .select('id');
    if (updateError) throw updateError;
    if (!updated?.length) throw new Error('ULTIMATE_JOB_LEASE_LOST:'+jobId);
    if (canRetry) await notifyCourseDispatcher({});
    // The fenced job transition is durable. Runtime persistence owns aggregate
    // build state; a separate update here could overwrite a media wakeup.
  }
}
