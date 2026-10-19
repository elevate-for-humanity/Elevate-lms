import 'server-only';
import { requireAdminClient } from '@/lib/supabase/admin';
import type { JobPosting } from '@/lib/data/jobs';
import { fetchUsaJobs } from '@/lib/industry/usajobs';

const norm = (s: unknown) => String(s ?? '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
const terms = (v: unknown): string[] => Array.isArray(v) ? v.flatMap(terms) :
  typeof v === 'string' ? [v] :
  v && typeof v === 'object' ? Object.values(v).flatMap(terms) : [];
const contains = (text: string, item: string) => !!item && (text.includes(item) || item.includes(text));
export type CareerMatch = { job: JobPosting; score: number; reasons: string[]; missingCredentials: string[]; eligibility: 'credential_match' | 'explore'; applyUrl?: string; source?: string };

export async function getLearnerCareerMatches(userId: string, limit = 8): Promise<CareerMatch[]> {
  const db = await requireAdminClient();
  const [uploads, enrollments, resumes] = await Promise.all([
    db.from('student_credential_uploads').select('credential_id,upload_type,verification_status,credential_registry(name)').eq('user_id', userId).eq('verification_status','approved'),
    db.from('program_enrollments').select('program_slug,title').or(`user_id.eq.${userId},student_id.eq.${userId}`).is('revoked_at', null),
    db.from('resumes').select('resume_data').eq('user_id', userId).order('updated_at',{ascending:false}).limit(1),
  ]);
  if (uploads.error || enrollments.error || resumes.error) throw new Error('Career matching profile temporarily unavailable');
  const credentialNames = (uploads.data ?? []).flatMap((row: any) =>
    row.credential_registry?.name ? [norm(row.credential_registry.name)] : []);
  const study = (enrollments.data ?? []).flatMap(row => [norm(row.program_slug),norm(row.title)]).filter(Boolean);
  const resume = resumes.data?.[0]?.resume_data as {skills?: string[]} | undefined;
  const skills = (Array.isArray(resume?.skills) ? resume.skills : []).map(norm).filter(Boolean);
  const interests = [...study, ...skills];
  // Government job listings are the primary learner feed. Search the federal
  // source live, with the imported government feed as a resilient fallback.
  const program = study.join(' ');
  const role = program.includes('cosmetolog') ? 'cosmetologist' :
    program.includes('barber') ? 'barber' :
    program.includes('bookkeep') || program.includes('quickbooks') ? 'bookkeeper' :
    program.includes('hvac') ? 'HVAC technician' :
    program.includes('medical assistant') ? 'medical assistant' :
    program.includes('nursing') || program.includes('cna') ? 'nursing assistant' :
    program.includes('cdl') ? 'truck driver' :
    program.includes('phlebotomy') ? 'phlebotomist' : null;
  const searchTerm = role || study.find(Boolean)?.replace(/-/g, ' ') || credentialNames[0] || skills[0] || '';
  const [live, cached] = await Promise.all([
    fetchUsaJobs(searchTerm, '', Math.min(40, limit * 4)).catch(() => []),
    db.from('government_job_feed')
      .select('id,source,external_id,title,description,location,salary_range,job_type,application_url,posted_at,closes_at')
      .order('imported_at',{ascending:false}).limit(150),
  ]);
  const sourceRows = live.length ? live : (cached.data ?? []);
  const candidates: Array<{job: JobPosting; applyUrl?: string; source?: string}> = sourceRows
    .filter(row => typeof row.application_url === 'string' && /^https:\/\//i.test(row.application_url))
    .filter(row => !row.closes_at || Date.parse(row.closes_at) >= Date.now())
    .filter(row => !searchTerm || norm([row.title,row.description].join(' ')).includes(norm(searchTerm).split(' ')[0]))
    .map(row => ({job: {
      id: 'government-' + (row.external_id ?? row.id), title: row.title,
      description: row.description, requirements: null, salary_range: row.salary_range,
      salary_min: null, salary_max: null, location: row.location, remote_allowed: false,
      job_type: row.job_type, employment_type: null, experience_level: null,
      skills_required: null, application_deadline: row.closes_at, status: 'active',
      created_at: row.posted_at ?? '', employer_id: null, required_certifications: null,
    } as JobPosting, applyUrl: row.application_url ?? undefined,
    source: row.source || 'USAJOBS'}));
  return candidates.map(({job,applyUrl,source}) => {
    const required = terms(job.required_certifications).map(norm).filter(Boolean);
    const missingCredentials = required.filter(req => !credentialNames.some(name => contains(name,req)));
    const matched = required.filter(req => !missingCredentials.includes(req));
    const jobText = norm([job.title,job.description,job.requirements, ...(job.skills_required ?? [])].join(' '));
    const relevant = interests.filter(term => contains(jobText,term));
    const skillMatches = skills.filter(term => contains(jobText,term));
    const score = (matched.length * 20) + (relevant.length * 4) + (skillMatches.length * 3) - (missingCredentials.length * 30);
    const reasons = [...matched.map(name => `Verified credential: ${name}`),...relevant.slice(0,2).map(name => `Training/skill relevance: ${name}`)];
    return {job,score,reasons,missingCredentials,applyUrl,source,eligibility: missingCredentials.length === 0 && matched.length > 0 ? 'credential_match' as const : 'explore' as const};
  }).sort((a,b) => b.score-a.score || a.job.id.localeCompare(b.job.id)).slice(0,limit);
}
