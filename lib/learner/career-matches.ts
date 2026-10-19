import 'server-only';
import { requireAdminClient } from '@/lib/supabase/admin';
import { getActiveJobs, type JobPosting } from '@/lib/data/jobs';

const norm = (s: unknown) => String(s ?? '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
const terms = (v: unknown): string[] => Array.isArray(v) ? v.flatMap(terms) :
  typeof v === 'string' ? [v] :
  v && typeof v === 'object' ? Object.values(v).flatMap(terms) : [];
const contains = (text: string, item: string) => !!item && (text.includes(item) || item.includes(text));
export type CareerMatch = { job: JobPosting; score: number; reasons: string[]; missingCredentials: string[]; eligibility: 'credential_match' | 'explore' };

export async function getLearnerCareerMatches(userId: string, limit = 8): Promise<CareerMatch[]> {
  const db = await requireAdminClient();
  const [uploads, enrollments, resumes, jobs] = await Promise.all([
    db.from('student_credential_uploads').select('credential_id,upload_type,verification_status,credential_registry(name)').eq('user_id', userId).eq('verification_status','approved'),
    db.from('program_enrollments').select('program_slug,title').or(`user_id.eq.${userId},student_id.eq.${userId}`).is('revoked_at', null),
    db.from('resumes').select('resume_data').eq('user_id', userId).order('updated_at',{ascending:false}).limit(1),
    getActiveJobs({limit: 150}),
  ]);
  if (uploads.error || enrollments.error || resumes.error) throw new Error('Career matching profile temporarily unavailable');
  const credentialNames = (uploads.data ?? []).flatMap((row: any) =>
    row.credential_registry?.name ? [norm(row.credential_registry.name)] : []);
  const study = (enrollments.data ?? []).flatMap(row => [norm(row.program_slug),norm(row.title)]).filter(Boolean);
  const resume = resumes.data?.[0]?.resume_data as {skills?: string[]} | undefined;
  const skills = (Array.isArray(resume?.skills) ? resume.skills : []).map(norm).filter(Boolean);
  const interests = [...study, ...skills];
  return jobs.map(job => {
    const required = terms(job.required_certifications).map(norm).filter(Boolean);
    const missingCredentials = required.filter(req => !credentialNames.some(name => contains(name,req)));
    const matched = required.filter(req => !missingCredentials.includes(req));
    const jobText = norm([job.title,job.description,job.requirements, ...(job.skills_required ?? [])].join(' '));
    const relevant = interests.filter(term => contains(jobText,term));
    const skillMatches = skills.filter(term => contains(jobText,term));
    const score = (matched.length * 20) + (relevant.length * 4) + (skillMatches.length * 3) - (missingCredentials.length * 30);
    const reasons = [...matched.map(name => `Verified credential: ${name}`),...relevant.slice(0,2).map(name => `Training/skill relevance: ${name}`)];
    return {job,score,reasons,missingCredentials,eligibility: missingCredentials.length === 0 && matched.length > 0 ? 'credential_match' as const : 'explore' as const};
  }).sort((a,b) => b.score-a.score || a.job.id.localeCompare(b.job.id)).slice(0,limit);
}
