import 'server-only';
import { requireAdminClient } from '@/lib/supabase/admin';
import type { JobPosting } from '@/lib/data/jobs';
import { fetchUsaJobs } from '@/lib/industry/usajobs';

const norm = (s: unknown) =>
  String(s ?? '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
const terms = (v: unknown): string[] =>
  Array.isArray(v)
    ? v.flatMap(terms)
    : typeof v === 'string'
      ? [v]
      : v && typeof v === 'object'
        ? Object.values(v).flatMap(terms)
        : [];
const contains = (text: string, item: string) =>
  !!text && !!item && (text.includes(item) || item.includes(text));
export type CareerMatch = {
  job: JobPosting;
  score: number;
  reasons: string[];
  missingCredentials: string[];
  eligibility: 'credential_match' | 'explore';
  applyUrl?: string;
  source?: string;
};

export async function getLearnerCareerMatches(userId: string, limit = 8): Promise<CareerMatch[]> {
  const db = await requireAdminClient();
  const [uploads, enrollments, resumes] = await Promise.all([
    db
      .from('student_credential_uploads')
      .select('credential_id,upload_type,verification_status,credential_registry(name)')
      .eq('user_id', userId)
      .in('verification_status', ['pending', 'approved', 'verified'])
      .order('created_at', { ascending: false }),
    db
      .from('program_enrollments')
      .select('program_slug,title')
      .or(`user_id.eq.${userId},student_id.eq.${userId}`)
      .is('revoked_at', null),
    db
      .from('resumes')
      .select('resume_data')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })
      .limit(1),
  ]);
  if (uploads.error || enrollments.error || resumes.error)
    throw new Error('Career matching profile temporarily unavailable');
  const uploadedCredentials = (uploads.data ?? []).flatMap((row: any) => {
    const credential = Array.isArray(row.credential_registry)
      ? row.credential_registry[0]
      : row.credential_registry;
    return credential?.name
      ? [
          {
            name: norm(credential.name),
            verified: ['approved', 'verified'].includes(row.verification_status),
          },
        ]
      : [];
  });
  const credentialNames = uploadedCredentials.filter((row) => row.verified).map((row) => row.name);
  const credentialInterests = uploadedCredentials.map((row) => row.name);
  const study = (enrollments.data ?? [])
    .flatMap((row) => [norm(row.program_slug), norm(row.title)])
    .filter(Boolean);
  const resume = resumes.data?.[0]?.resume_data as
    | {
        skills?: string[];
        personal_info?: { location?: string };
        certifications?: Array<{ name?: string }>;
      }
    | undefined;
  const skills = (Array.isArray(resume?.skills) ? resume.skills : []).map(norm).filter(Boolean);
  const declaredCredentials = (Array.isArray(resume?.certifications) ? resume.certifications : [])
    .map((row) => norm(row?.name))
    .filter(Boolean);
  const interests = [
    ...new Set([...credentialInterests, ...declaredCredentials, ...study, ...skills]),
  ];
  // Government job listings are the primary learner feed. Search the federal
  // source live, with the imported government feed as a resilient fallback.
  const occupationalRole = (text: string) =>
    text.includes('cosmetolog')
      ? 'cosmetologist'
      : text.includes('barber')
        ? 'barber'
        : text.includes('bookkeep') || text.includes('quickbooks')
          ? 'bookkeeper'
          : text.includes('hvac') || /epa.*608/.test(text)
            ? 'HVAC technician'
            : text.includes('medical assistant')
              ? 'medical assistant'
              : text.includes('nursing') || text.includes('cna')
                ? 'nursing assistant'
                : text.includes('cdl')
                  ? 'truck driver'
                  : text.includes('phlebotomy')
                    ? 'phlebotomist'
                    : null;

  const role =
    credentialInterests.map(occupationalRole).find(Boolean) ||
    declaredCredentials.map(occupationalRole).find(Boolean) ||
    occupationalRole(study.join(' '));
  const program = [...credentialInterests, ...declaredCredentials, ...study].join(' ');
  if (role) interests.push(norm(role));
  if (/epa.*608/.test(program) || program.includes('hvac')) interests.push('hvac', 'refrigeration');
  const searchTerm =
    role ||
    credentialInterests[0] ||
    declaredCredentials[0] ||
    study.find(Boolean)?.replace(/-/g, ' ') ||
    skills[0] ||
    '';
  const location =
    typeof resume?.personal_info?.location === 'string' ? resume.personal_info.location : '';
  const [live, cached] = await Promise.all([
    fetchUsaJobs(searchTerm, location, Math.min(40, limit * 4)).catch(() => []),
    db
      .from('government_job_feed')
      .select(
        'id,source,external_id,title,description,location,salary_range,job_type,application_url,posted_at,closes_at',
      )
      .order('imported_at', { ascending: false })
      .limit(150),
  ]);
  const sourceRows: Array<{
    id?: string;
    source: string;
    external_id: string;
    title: string;
    description: string | null;
    location: string | null;
    salary_range: string | null;
    job_type: string | null;
    application_url: string | null;
    posted_at: string | null;
    closes_at: string | null;
  }> = [...live, ...(cached.data ?? [])];
  const candidates: Array<{ job: JobPosting; applyUrl?: string; source?: string }> = sourceRows
    .filter(
      (row) => typeof row.application_url === 'string' && /^https:\/\//i.test(row.application_url),
    )
    .filter((row) => !row.closes_at || Date.parse(row.closes_at) >= Date.now())
    .map((row) => ({
      job: {
        id: 'government-' + (row.external_id ?? row.id),
        title: row.title,
        description: row.description,
        requirements: null,
        salary_range: row.salary_range,
        salary_min: null,
        salary_max: null,
        location: row.location,
        remote_allowed: false,
        job_type: row.job_type,
        employment_type: null,
        experience_level: null,
        skills_required: null,
        application_deadline: row.closes_at,
        status: 'active',
        created_at: row.posted_at ?? '',
        employer_id: null,
        required_certifications: null,
      } as JobPosting,
      applyUrl: row.application_url ?? undefined,
      source: row.source || 'USAJOBS',
    }));
  const seen = new Set<string>();
  return candidates
    .filter(({ job, applyUrl }) => {
      const key = applyUrl || job.id;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .map(({ job, applyUrl, source }) => {
      const required = terms(job.required_certifications).map(norm).filter(Boolean);
      const missingCredentials = required.filter(
        (req) => !credentialNames.some((name) => contains(name, req)),
      );
      const matched = required.filter((req) => !missingCredentials.includes(req));
      const jobText = norm(
        [job.title, job.description, job.requirements, ...(job.skills_required ?? [])].join(' '),
      );
      const relevant = interests.filter((term) => contains(jobText, term));
      const skillMatches = skills.filter((term) => contains(jobText, term));
      const score =
        matched.length * 20 +
        relevant.length * 4 +
        skillMatches.length * 3 -
        missingCredentials.length * 30;
      const credentialRelevance = credentialInterests.filter((name) => contains(jobText, name));
      const reasons = [
        ...credentialRelevance.map((name) => `Credential relevance: ${name}`),
        ...matched.map((name) => `Verified credential: ${name}`),
        ...relevant.slice(0, 2).map((name) => `Training/skill relevance: ${name}`),
      ];
      return {
        job,
        score,
        reasons,
        missingCredentials,
        applyUrl,
        source,
        eligibility:
          missingCredentials.length === 0 && matched.length > 0
            ? ('credential_match' as const)
            : ('explore' as const),
      };
    })
    .filter((match) => !interests.length || match.score > 0 || match.reasons.length > 0)
    .sort((a, b) => b.score - a.score || a.job.id.localeCompare(b.job.id))
    .slice(0, limit);
}
