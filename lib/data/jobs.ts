/**
 * Shared public job postings data layer.
 * Table: job_postings
 */

import { createPublicClient } from '@/lib/supabase/public';
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
  required_certifications: unknown | null;
}

const SELECT_COLS = [
  'id','title','description','requirements','salary_range','salary_min','salary_max','location',
  'remote_allowed','job_type','employment_type','experience_level','skills_required',
  'application_deadline','status','created_at','employer_id','required_certifications',
].join(', ');

function normalizeJob(row: Record<string, unknown>): JobPosting {
  return {
    id: String(row.id ?? ''),
    title: String(row.title ?? ''),
    description: typeof row.description === 'string' ? row.description : null,
    requirements: typeof row.requirements === 'string' ? row.requirements : null,
    salary_range: typeof row.salary_range === 'string' ? row.salary_range : null,
    salary_min: typeof row.salary_min === 'number' ? row.salary_min : null,
    salary_max: typeof row.salary_max === 'number' ? row.salary_max : null,
    location: typeof row.location === 'string' ? row.location : null,
    remote_allowed: row.remote_allowed === true,
    job_type: typeof row.job_type === 'string' ? row.job_type : null,
    employment_type: typeof row.employment_type === 'string' ? row.employment_type : null,
    experience_level: typeof row.experience_level === 'string' ? row.experience_level : null,
    skills_required: Array.isArray(row.skills_required) ? row.skills_required.filter((value): value is string => typeof value === 'string') : null,
    application_deadline: typeof row.application_deadline === 'string' ? row.application_deadline : null,
    status: typeof row.status === 'string' ? row.status : 'active',
    created_at: typeof row.created_at === 'string' ? row.created_at : '',
    employer_id: typeof row.employer_id === 'string' ? row.employer_id : null,
    required_certifications: row.required_certifications ?? null,
  };
}

export async function getActiveJobs(opts: { limit?: number; remote?: boolean; jobType?: string } = {}): Promise<JobPosting[]> {
  const db = createPublicClient();
  let query = db
    .from('job_postings')
    .select(SELECT_COLS)
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(opts.limit ?? 20);

  if (opts.remote) query = query.eq('remote_allowed', true);
  if (opts.jobType) query = query.eq('job_type', opts.jobType);

  const { data, error } = await query;
  if (error) {
    logger.error('[jobs] getActiveJobs error:', error.message);
    return [];
  }

  return ((data ?? []) as unknown as Array<Record<string, unknown>>).map(normalizeJob);
}

export async function getJobById(id: string): Promise<JobPosting | null> {
  const { data, error } = await createPublicClient()
    .from('job_postings')
    .select(SELECT_COLS)
    .eq('id', id)
    .eq('status', 'active')
    .maybeSingle();

  if (error) {
    logger.error('[jobs] getJobById error:', error.message);
    return null;
  }
  return data ? normalizeJob(data as unknown as Record<string, unknown>) : null;
}

export function formatSalary(job: JobPosting): string {
  if (job.salary_range) return job.salary_range;
  if (job.salary_min && job.salary_max) return `$${(job.salary_min / 1000).toFixed(0)}k – $${(job.salary_max / 1000).toFixed(0)}k`;
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
  return map[type ?? ''] ?? type ?? 'Position';
}
