// GET /api/employer/matches
//
// Deterministic employer-program matching.
// Two directions:
//   ?mode=jobs_for_learner&learner_id=  — job postings relevant to a learner's completed programs
//   ?mode=candidates_for_job&job_id=    — program completers relevant to a job posting
//
// Matching logic is credential/program-based, not AI. A job posting matches a
// program completer when:
//   - job_postings.skills_required overlaps with the program's credential stack, OR
//   - job_postings.education_required matches the program title/credential name
//
// This is intentionally conservative. Expand matching criteria incrementally.
import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { apiAuthGuard } from '@/lib/admin/guards';
import { applyRateLimit } from '@/lib/api/withRateLimit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const rateLimited = await applyRateLimit(req, 'api');
  if (rateLimited) return rateLimited;

  const auth = await apiAuthGuard({
    requireAuth: true,
    allowedRoles: ['admin', 'super_admin', 'staff', 'employer', 'case_manager', 'provider_admin'],
  });
  if (!auth.authorized) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const db = createAdminClient();
  if (!db) return NextResponse.json({ error: 'Service unavailable' }, { status: 503 });

  const { searchParams } = new URL(req.url);
  const mode = searchParams.get('mode') ?? 'jobs_for_learner';

  // ─── Mode 1: job postings relevant to a learner's completed programs ───────
  if (mode === 'jobs_for_learner') {
    const learner_id = searchParams.get('learner_id');
    if (!learner_id) return NextResponse.json({ error: 'learner_id required' }, { status: 400 });

    // Learners can only query their own matches
    if (auth.role === 'student' && auth.user.id !== learner_id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get completed programs and their credentials
    const { data: completions } = await db
      .from('program_completion')
      .select('program_id, programs(title, credential_stack)')
      .eq('user_id', learner_id);

    if (!completions?.length) {
      return NextResponse.json({ jobs: [], message: 'No completed programs found' });
    }

    // Collect credential stacks and program titles for matching
    const credentialStacks: string[] = [];
    const programTitles: string[] = [];
    for (const c of completions) {
      const prog = c.programs as any;
      if (prog?.credential_stack) credentialStacks.push(prog.credential_stack);
      if (prog?.title) programTitles.push(prog.title);
    }

    // Also get earned credential names
    const { data: earnedCreds } = await db
      .from('learner_credentials')
      .select('credentials(name, abbreviation, credential_stack)')
      .eq('learner_id', learner_id)
      .eq('status', 'active');

    for (const ec of earnedCreds ?? []) {
      const cred = ec.credentials as any;
      if (cred?.credential_stack) credentialStacks.push(cred.credential_stack);
      if (cred?.name) programTitles.push(cred.name);
      if (cred?.abbreviation) programTitles.push(cred.abbreviation);
    }

    // Find active job postings that overlap on skills_required or education_required
    const { data: jobs } = await db
      .from('job_postings')
      .select(`
        id, title, description, salary_range, salary_min, salary_max,
        location, remote_allowed, job_type, application_deadline, status,
        employer:employers!employer_id(id, business_name)
      `)
      .eq('status', 'active')
      .or(
        [
          credentialStacks.length
            ? `skills_required.ov.{${credentialStacks.map(s => `"${s}"`).join(',')}}`
            : null,
          programTitles.length
            ? programTitles.map(t => `education_required.ilike.%${t}%`).join(',')
            : null,
        ]
          .filter(Boolean)
          .join(',')
      )
      .limit(20);

    return NextResponse.json({ jobs: jobs ?? [], learner_id, matched_on: { credential_stacks: credentialStacks, program_titles: programTitles } });
  }

  // ─── Mode 2: program completers relevant to a job posting ─────────────────
  if (mode === 'candidates_for_job') {
    const job_id = searchParams.get('job_id');
    if (!job_id) return NextResponse.json({ error: 'job_id required' }, { status: 400 });

    // Only admins/staff/employers can query candidates
    if (!['admin', 'super_admin', 'staff', 'employer'].includes(auth.role ?? '')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { data: job } = await db
      .from('job_postings')
      .select('id, title, skills_required, education_required, employer_id')
      .eq('id', job_id)
      .single();

    if (!job) return NextResponse.json({ error: 'Job posting not found' }, { status: 404 });

    // Employers can only query their own job postings
    if (auth.role === 'employer') {
      const { data: emp } = await db
        .from('employers')
        .select('id')
        .eq('owner_user_id', auth.user.id)
        .single();
      if (!emp || emp.id !== job.employer_id) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    // Find credentials matching the job's skills_required
    const skills: string[] = job.skills_required ?? [];
    let credentialIds: string[] = [];

    if (skills.length) {
      const { data: matchedCreds } = await db
        .from('credentials')
        .select('id')
        .in('credential_stack', skills);
      credentialIds = (matchedCreds ?? []).map((c: any) => c.id);
    }

    // Find learners who completed programs with those credentials
    let learnerIds: string[] = [];

    if (credentialIds.length) {
      const { data: lc } = await db
        .from('learner_credentials')
        .select('learner_id')
        .in('credential_id', credentialIds)
        .eq('status', 'active');
      learnerIds = [...new Set((lc ?? []).map((r: any) => r.learner_id))];
    }

    // Also match by program title against education_required
    if (job.education_required) {
      const { data: progs } = await db
        .from('programs')
        .select('id')
        .ilike('title', `%${job.education_required}%`);

      if (progs?.length) {
        const { data: completions } = await db
          .from('program_completion')
          .select('user_id')
          .in('program_id', progs.map((p: any) => p.id));
        const extraIds = (completions ?? []).map((c: any) => c.user_id);
        learnerIds = [...new Set([...learnerIds, ...extraIds])];
      }
    }

    if (!learnerIds.length) {
      return NextResponse.json({ candidates: [], job_id, total: 0 });
    }

    const { data: candidates } = await db
      .from('profiles')
      .select('id, full_name, email, city, state')
      .in('id', learnerIds.slice(0, 50));  // cap at 50 for now

    return NextResponse.json({ candidates: candidates ?? [], job_id, total: learnerIds.length });
  }

  return NextResponse.json({ error: 'Invalid mode. Use jobs_for_learner or candidates_for_job' }, { status: 400 });
}
