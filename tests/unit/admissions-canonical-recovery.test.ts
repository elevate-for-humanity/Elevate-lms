// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import { readFileSync } from 'node:fs';

const mocks = vi.hoisted(() => ({ db: null as unknown, info: vi.fn(), error: vi.fn() }));
vi.mock('@/lib/logger', () => ({ logger: { info: mocks.info, error: mocks.error, warn: vi.fn() } }));
vi.mock('@/lib/supabase/admin', () => ({ requireAdminClient: async () => mocks.db }));
vi.mock('@/lib/audit-context', () => ({ setAuditContext: async () => {} }));
import { processApplicationSubmitted, type ApplicationSubmittedPayload } from '@/lib/admissions/process-application-submitted';
import { enqueueApplicationSubmission } from '@/lib/admissions/queue-application-submission';
import { GET } from '@/apps/admin/app/api/cron/process-application-submissions/route';
import { NextRequest } from 'next/server';

type Row = Record<string, any>;
class FixtureDatabase {
  rows: Record<string, Row[]> = {
    applications: [{ id: 'application-1', email: 'fixture_test@example.invalid', first_name: 'Safe', last_name: 'Fixture', program_slug: 'barber-apprenticeship', advisor_assigned: 'assigned-staff' }],
    programs: [{ id: 'program-barber', slug: 'barber-apprenticeship' }],
    crm_leads: [], leads: [], tasks: [], timeline_events: [], job_queue: [],
    apprentice_document_types: [{ program_slug: 'barber-apprenticeship', document_type: 'existing-approved-key', is_required: true }],
  };
  writes: { table: string; operation: string; payload: any }[] = [];
  failures: { table: string; operation: string; skip?: number; code?: string; message?: string }[] = [];
  patterns: string[] = [];
  asClient() { return this as unknown as SupabaseClient; }
  from(table: string) {
    if (!(table in this.rows)) throw new Error(`Unexpected table ${table}`);
    let operation = 'select'; let payload: any; let conflict: string | undefined; let single = false; let maximum = Infinity;
    const filters: ((row: Row) => boolean)[] = [];
    const query: any = {
      select: () => query,
      eq: (key: string, value: any) => { filters.push(row => row[key] === value); return query; },
      in: (key: string, value: any[]) => { filters.push(row => value.includes(row[key])); return query; },
      lte: (key: string, value: any) => { filters.push(row => row[key] <= value); return query; },
      ilike: (key: string, value: string) => {
        this.patterns.push(value);
        const escaped = value.replace(/\\([\\%_])/g, '$1');
        filters.push(row => String(row[key]).toLowerCase() === escaped.toLowerCase());
        return query;
      },
      contains: (key: string, value: Row) => { filters.push(row => Object.entries(value).every(([k, v]) => row[key]?.[k] === v)); return query; },
      order: () => query,
      limit: (value: number) => { maximum = value; return query; },
      maybeSingle: () => { single = true; return query; },
      insert: (value: any) => { operation = 'insert'; payload = value; return query; },
      update: (value: any) => { operation = 'update'; payload = value; return query; },
      upsert: (value: any, options: any) => { operation = 'upsert'; payload = value; conflict = options?.onConflict; return query; },
      then: (resolve: (value: any) => void, reject: (error: any) => void) => Promise.resolve().then(() => {
        const failure = this.failures.find(item => item.table === table && item.operation === operation);
        if (failure && !failure.skip) {
          this.failures.splice(this.failures.indexOf(failure), 1);
          return { data: null, error: { code: failure.code || '42501', message: failure.message || 'fixture write denied' } };
        }
        if (failure?.skip) failure.skip--;
        let result = this.rows[table].filter(row => filters.every(filter => filter(row))).slice(0, maximum);
        if (operation !== 'select') {
          this.writes.push({ table, operation, payload: structuredClone(payload) });
          if (operation === 'update') result.forEach(row => Object.assign(row, payload));
          else {
            result = [];
            for (const value of Array.isArray(payload) ? payload : [payload]) {
              if (operation === 'upsert' && this.rows[table].some(row => conflict === 'id' ? row.id === value.id : row.program_slug === value.program_slug && row.document_type === value.document_type)) continue;
              if (table === 'tasks' && ['id', 'program_id', 'instructions', 'title', 'due_days'].some(key => value[key] == null)) return { data: null, error: { code: '23502', message: 'fixture live task NOT NULL contract' } };
              if (table === 'crm_leads' && this.rows[table].some(row => row.email === value.email)) return { data: null, error: { code: '23505', message: 'fixture unique email' } };
              const inserted = { id: `fixture-${this.writes.length}-${result.length}`, ...structuredClone(value) };
              if (table === 'job_queue') Object.assign(inserted, { status: 'pending', attempts: 0, max_attempts: 3, ...value });
              this.rows[table].push(inserted); result.push(inserted);
            }
          }
        }
        return { data: single ? result[0] ?? null : result, error: null };
      }).then(resolve, reject),
    };
    return query;
  }
}

const payload: ApplicationSubmittedPayload = { applicationId: 'application-1', email: 'fixture_test@example.invalid', firstName: 'Safe', lastName: 'Fixture', programSlug: 'barber-apprenticeship', fundingType: 'self_pay' };
let db: FixtureDatabase;
beforeEach(() => { db = new FixtureDatabase(); mocks.db = db.asClient(); vi.clearAllMocks(); vi.stubEnv('PARIS_APPLICATION_ANALYSIS_ENABLED', 'false'); vi.stubEnv('CRON_SECRET', 'fixture-cron-secret'); });

describe('canonical admissions recovery', () => {
  it('queues intake and processes/replays one canonical lead, review, checklist and timeline', async () => {
    await enqueueApplicationSubmission(db.asClient(), payload);
    expect(db.writes.map(write => write.table)).toEqual(['job_queue']);
    expect(await processApplicationSubmitted(db.asClient(), payload)).toEqual({ success: true });
    expect(await processApplicationSubmitted(db.asClient(), payload)).toEqual({ success: true });
    expect(db.rows.leads).toHaveLength(0);
    expect(db.rows.crm_leads).toHaveLength(1);
    expect(db.rows.tasks).toHaveLength(5);
    expect(db.rows.tasks.filter(row => row.title === 'Review application')).toHaveLength(1);
    expect(db.rows.timeline_events).toHaveLength(1);
    expect(db.rows.apprentice_document_types).toEqual([{ program_slug: 'barber-apprenticeship', document_type: 'existing-approved-key', is_required: true }]);
    expect(db.patterns).toContain('fixture\\_test@example.invalid');
    const intake = readFileSync('apps/marketing/app/api/applications/route.ts', 'utf8');
    expect(intake).not.toContain('onApplicationSubmitted');
    expect(intake).toContain('await enqueueApplicationSubmission(adminDb,');
  });

  it('initializes an unconfigured binder durably and preserves it on replay', async () => {
    db.rows.apprentice_document_types = [];
    await processApplicationSubmitted(db.asClient(), payload);
    await processApplicationSubmitted(db.asClient(), payload);
    expect(db.rows.apprentice_document_types).toHaveLength(11);
    expect(db.writes.filter(write => write.table === 'apprentice_document_types')).toHaveLength(1);
  });

  it('preserves progressed CRM stage and its existing owner for new staff tasks', async () => {
    db.rows.crm_leads.push({ id: 'retained-lead', email: payload.email, stage: 'converted', status: 'won', owner_user_id: 'existing-staff' });
    await processApplicationSubmitted(db.asClient(), payload);
    expect(db.rows.crm_leads[0]).toMatchObject({ stage: 'converted', status: 'won', owner_user_id: 'existing-staff' });
    expect(db.rows.tasks.every(row => row.assigned_to === 'existing-staff')).toBe(true);
  });

  it('reuses a completed legacy review task without reopening or duplicating it', async () => {
    const prior = { id: 'legacy-review', related_type: 'application', related_id: payload.applicationId, title: 'Review application from Safe Fixture', status: 'completed', assigned_to: 'legacy-owner' };
    db.rows.tasks.push({ ...prior });
    await processApplicationSubmitted(db.asClient(), payload);
    expect(db.rows.tasks.filter(row => row.title.startsWith('Review application'))).toEqual([prior]);
    expect(db.rows.tasks).toHaveLength(5);
  });

  it('retries a real returned binder error through the cron lease and completes without duplicates', async () => {
    await enqueueApplicationSubmission(db.asClient(), payload);
    db.failures.push({ table: 'apprentice_document_types', operation: 'select', code: '08006' });
    const request = () => new NextRequest('https://admin.example.invalid/api/cron/process-application-submissions', { headers: { authorization: 'Bearer fixture-cron-secret' } });
    const first = await GET(request());
    expect(first.status).toBe(503);
    expect(db.rows.job_queue[0]).toMatchObject({ status: 'pending', attempts: 1, last_error: 'ADMISSIONS_BINDER_08006' });
    expect(db.rows.tasks).toHaveLength(0);
    db.rows.job_queue[0].run_after = new Date(Date.now() - 1000).toISOString();
    const second = await GET(request());
    expect(second.status).toBe(200);
    expect(db.rows.job_queue[0]).toMatchObject({ status: 'completed', attempts: 2 });
    expect(db.rows.crm_leads).toHaveLength(1);
    expect(db.rows.tasks).toHaveLength(5);
  });

  it('resumes a partial task failure without repeating successful writes', async () => {
    db.failures.push({ table: 'tasks', operation: 'upsert', skip: 2 });
    expect(await processApplicationSubmitted(db.asClient(), payload)).toMatchObject({ success: false });
    expect(db.rows.tasks).toHaveLength(2);
    expect(await processApplicationSubmitted(db.asClient(), payload)).toEqual({ success: true });
    expect(db.rows.tasks).toHaveLength(5);
    expect(db.rows.crm_leads).toHaveLength(1);
  });

  it('rejects queue identity mismatches before any admissions write', async () => {
    expect(await processApplicationSubmitted(db.asClient(), { ...payload, email: 'other@example.invalid' })).toMatchObject({ success: false });
    expect(db.writes).toHaveLength(0);
  });

  it('propagates a returned queue error rather than reporting a queued success', async () => {
    db.failures.push({ table: 'job_queue', operation: 'upsert' });
    await expect(enqueueApplicationSubmission(db.asClient(), payload)).rejects.toThrow('APPLICATION_AUTOMATION_QUEUE_WRITE_FAILED:42501');
    expect(db.rows.job_queue).toHaveLength(0);
  });

  it('satisfies live required task fields and safely coalesces concurrent writers', async () => {
    await Promise.all([enqueueApplicationSubmission(db.asClient(), payload), enqueueApplicationSubmission(db.asClient(), payload)]);
    expect(db.rows.job_queue).toHaveLength(1);
    const results = await Promise.all([processApplicationSubmitted(db.asClient(), payload), processApplicationSubmitted(db.asClient(), payload)]);
    expect(results.every(result => result.success)).toBe(true);
    expect(db.rows.crm_leads).toHaveLength(1);
    expect(db.rows.tasks).toHaveLength(5);
    expect(db.rows.timeline_events).toHaveLength(1);
    expect(db.rows.tasks.every(row => row.id && row.program_id === 'program-barber' && row.instructions)).toBe(true);
  });

  it('never replaces or resets an existing exhausted submission job', async () => {
    db.rows.job_queue.push({ id: 'original-job', type: 'application_submitted', payload, status: 'failed', attempts: 3, max_attempts: 3 });
    await enqueueApplicationSubmission(db.asClient(), payload);
    expect(db.rows.job_queue).toEqual([{ id: 'original-job', type: 'application_submitted', payload, status: 'failed', attempts: 3, max_attempts: 3 }]);
    expect(db.writes).toHaveLength(0);
  });

  it('stops an unknown-program job for review without consuming its remaining retries', async () => {
    db.rows.applications[0].program_slug = 'other';
    await enqueueApplicationSubmission(db.asClient(), payload);
    const response = await GET(new NextRequest('https://admin.example.invalid/api/cron/process-application-submissions', { headers: { authorization: 'Bearer fixture-cron-secret' } }));
    expect(response.status).toBe(503);
    expect(db.rows.job_queue[0]).toMatchObject({ status: 'failed', attempts: 1, last_error: 'ADMISSIONS_PROGRAM_REVIEW_REQUIRED' });
    expect(db.rows.tasks).toHaveLength(0);
    expect(db.rows.crm_leads).toHaveLength(0);
  });

  it('stores only allowlisted stage/code and never a database message containing private data', async () => {
    await enqueueApplicationSubmission(db.asClient(), payload);
    db.failures.push({ table: 'tasks', operation: 'upsert', code: '23502', message: 'private person@example.invalid values' });
    const response = await GET(new NextRequest('https://admin.example.invalid/api/cron/process-application-submissions', { headers: { authorization: 'Bearer fixture-cron-secret' } }));
    expect(response.status).toBe(503);
    expect(db.rows.job_queue[0]).toMatchObject({ status: 'failed', attempts: 1, last_error: 'ADMISSIONS_TASKS_23502' });
    expect(JSON.stringify(mocks.error.mock.calls)).not.toContain('private person');
    expect(db.rows.job_queue[0].last_error).not.toContain('@');
  });

  it('uses a verified saved program ID and never substitutes the queue program', async () => {
    db.rows.applications[0].program_id = 'program-barber';
    db.rows.applications[0].program_slug = 'other';
    expect(await processApplicationSubmitted(db.asClient(), { ...payload, programSlug: 'untrusted-queue-program' })).toEqual({ success: true });
    expect(db.rows.tasks.every(row => row.program_id === 'program-barber')).toBe(true);
  });

  it('rejects unauthenticated cron callers before opening the queue', async () => {
    const response = await GET(new NextRequest('https://admin.example.invalid/api/cron/process-application-submissions'));
    expect(response.status).toBe(401);
    expect(db.writes).toHaveLength(0);
  });
});
