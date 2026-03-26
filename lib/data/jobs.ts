/**
 * Shared job postings data layer.
 * Table: job_postings (employer-posted jobs for learners/alumni)
 *
 * Separate from lib/data/careers.ts which queries internal Elevate HR positions.
 */

import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';

export interface JobPosting {
  id: string;
  title: string;
  description: string | null;
  requirements: string | null;
  salary_range: string | null;
  salary_min: number | null;
  salary_max: number | null;
  location: string | null;
  remote_allowed: boolean;
  job_type: string | null;
  employment_type: string | null;
  experience_level: string | null;
  skills_required: string[] | null;
  application_deadline: string | null;
  status: string;
  created_at: string;
  employer_id: string | null;
  required_certifications: any | null;
}

const SELECT_COLS = [
  'id', 'title', 'description', 'requirements', 'salary_range',
  'salary_min', 'salary_max', 'location', 'remote_allowed',
  'job_type', 'employment_type', 'experience_level', 'skills_required',
  'application_deadline', 'status', 'created_at', 'employer_id',
  'required_certifications',
].join(', ');

async function getDb() {
  const admin = createAdminClient();
  if (admin) return admin;
  return await createClient();
}

export async function getActiveJobs(opts: {
  limit?: number;
  remote?: boolean;
  jobType?: string;
} = {}): Promise<JobPosting[]> {
  const db = await getDb();
  let q = db
    .from('job_postings')
    .select(SELECT_COLS)
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(opts.limit ?? 20);

  if (opts.remote) q = q.eq('remote_allowed', true);
  if (opts.jobType) q = q.eq('job_type', opts.jobType);

  const { data, error } = await q;
  if (error) {
    logger.error('[jobs] getActiveJobs error:', error.message);
    return [];
  }
  return (data ?? []) as JobPosting[];
}

export async function getJobById(id: string): Promise<JobPosting | null> {
  const db = await getDb();
  const { data, error } = await db
    .from('job_postings')
    .select(SELECT_COLS)
    .eq('id', id)
    .eq('status', 'active')
    .maybeSingle();

  if (error) {
    logger.error('[jobs] getJobById error:', error.message);
    return null;
  }
  return data as JobPosting | null;
}

// ── Formatting helpers ────────────────────────────────────────────────────────

export function formatSalary(job: JobPosting): string {
  if (job.salary_range) return job.salary_range;
  if (job.salary_min && job.salary_max) {
    return `$${(job.salary_min / 1000).toFixed(0)}k – $${(job.salary_max / 1000).toFixed(0)}k`;
  }
  if (job.salary_min) return `From $${(job.salary_min / 1000).toFixed(0)}k`;
  return 'Salary not listed';
}

export function jobTypeBadge(type: string | null): string {
  const map: Record<string, string> = {
    full_time: 'bg-emerald-100 text-emerald-800',
    part_time: 'bg-amber-100 text-amber-800',
    contract: 'bg-purple-100 text-purple-800',
    internship: 'bg-brand-blue-100 text-brand-blue-800',
    temporary: 'bg-slate-100 text-slate-700',
  };
  return map[type ?? ''] ?? 'bg-slate-100 text-slate-700';
}

export function jobTypeLabel(type: string | null): string {
  const map: Record<string, string> = {
    full_time: 'Full-time',
    part_time: 'Part-time',
    contract: 'Contract',
    internship: 'Internship',
    temporary: 'Temporary',
  };
  return map[type ?? ''] ?? (type ?? 'Position');
}
