import Link from 'next/link';
import { redirect } from 'next/navigation';
import { CheckCircle2, ClipboardCheck, Clock3, FileText, GraduationCap, Scissors } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { getAdminClient } from '@/lib/supabase/admin';
import { resolveApprenticeProgramSlug } from '@/lib/portal/resolve-apprentice-program';
import { apprenticeshipLmsCoursePath, apprenticeshipRtiLabel } from '@/lib/portal/program-portal-paths';
import { requireAdminClient } from '@/lib/supabase/admin';
import { resolvePortalPreviewSubject } from '@/lib/admin/portal-preview';

export const dynamic = 'force-dynamic';

const BARBER_VIDEO = 'https://pub-23811be4d3844e45a8bc2d3dc5e7aaec.r2.dev/videos/barber-hero-final.mp4';
const GENERAL_VIDEO = 'https://pub-23811be4d3844e45a8bc2d3dc5e7aaec.r2.dev/videos/programs-overview-video-with-narration.mp4';

async function completeOrientation(formData: FormData) {
  'use server';

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login?redirect=/apprentice/orientation');

  const requestedProgram = String(formData.get('programSlug') || '').trim();
  const programSlug = requestedProgram || await resolveApprenticeProgramSlug(supabase, user.id);
  if (!programSlug) redirect('/apprentice?notice=apprentice-access-required');

  const db = await getAdminClient();
  const writer = db ?? supabase;
  const now = new Date().toISOString();

  const { error } = await writer
    .from('program_enrollments')
    .update({
      orientation_completed_at: now,
      access_granted_at: now,
      enrollment_state: 'active',
      status: 'active',
      updated_at: now,
    })
    .eq('user_id', user.id)
    .eq('program_slug', programSlug);

  if (error) redirect(`/apprentice/orientation?program=${encodeURIComponent(programSlug)}&error=save`);
  redirect('/apprentice?orientation=complete');
}

export default async function ApprenticeOrientationPage({
  searchParams,
}: {
  searchParams: Promise<{ program?: string; error?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const db = await requireAdminClient();
  const subject = await resolvePortalPreviewSubject(db, user?.id);
  if (!subject.userId) redirect('/login?redirect=/apprentice/orientation');
  const resolvedProgram = await resolveApprenticeProgramSlug(db, subject.userId);
  const programSlug = params.program || resolvedProgram;
  if (!programSlug) redirect('/apprentice?notice=apprentice-access-required');

  const { data: enrollment } = await db
    .from('program_enrollments')
    .select('orientation_completed_at')
    .eq('user_id', subject.userId)
    .eq('program_slug', programSlug)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  const isBarber = programSlug === 'barber-apprenticeship';
  const courseHref = apprenticeshipLmsCoursePath(programSlug);
  const courseLabel = apprenticeshipRtiLabel(programSlug) || 'Assigned RTI course';
  const completed = Boolean(enrollment?.orientation_completed_at);

  const steps = [
    {
      title: 'Understand the apprenticeship structure',
      text: 'Your apprenticeship combines supervised on-the-job learning, related technical instruction, verified competencies and required documentation.',
      icon: GraduationCap,
    },
    {
      title: 'Clock and submit real training hours',
      text: 'Clock only approved apprenticeship work. Submitted hours must be reviewed by the authorized Host Shop supervisor before they count toward completion.',
      icon: Clock3,
    },
    {
      title: 'Complete your assigned curriculum',
      text: `${courseLabel} is your online RTI workspace. Complete assigned lessons, quizzes and assessments while your Host Shop coaches the matching work processes.`,
      icon: Scissors,
    },
    {
      title: 'Keep required records current',
      text: 'Review your handbook and documents, upload requested records, and respond to any rejected or missing compliance item.',
      icon: FileText,
    },
    {
      title: 'Get supervisor sign-off on competencies',
      text: 'Your Host Shop verifies skills as you demonstrate them. Your dashboard shows what is complete, pending and still required.',
      icon: ClipboardCheck,
    },
  ];

  return (
    <main className="mx-auto max-w-5xl space-y-6 px-4 py-8 sm:px-6">
      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-slate-950 text-white shadow-sm">
        <div className="grid lg:grid-cols-[1.05fr_.95fr]">
          <div className="p-6 sm:p-8">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-brand-red-300">Required onboarding</p>
            <h1 className="mt-2 text-3xl font-black sm:text-4xl">Apprentice Orientation</h1>
            <p className="mt-4 max-w-2xl leading-7 text-slate-200">
              Review the operating rules below before continuing into hours, competencies and your RTI course.
            </p>
            {completed ? (
              <div className="mt-5 inline-flex items-center gap-2 rounded-full bg-emerald-100 px-4 py-2 text-sm font-black text-emerald-900">
                <CheckCircle2 className="h-4 w-4" /> Orientation completed
              </div>
            ) : null}
          </div>
          <video
            src={isBarber ? BARBER_VIDEO : GENERAL_VIDEO}
            controls
            playsInline
            preload="metadata"
            className="h-full min-h-[240px] w-full object-cover"
          />
        </div>
      </section>

      {params.error === 'save' ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 font-semibold text-red-800">
          Orientation completion could not be saved. Please try again.
        </div>
      ) : null}

      <section className="grid gap-4 md:grid-cols-2">
        {steps.map(({ title, text, icon: Icon }, index) => (
          <article key={title} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-900">
                <Icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-black uppercase tracking-wider text-slate-500">Step {index + 1}</p>
                <h2 className="mt-1 font-black text-slate-950">{title}</h2>
                <p className="mt-2 text-sm leading-6 text-slate-700">{text}</p>
              </div>
            </div>
          </article>
        ))}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-black text-slate-950">Continue your setup</h2>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link href="/apprentice/handbook" className="rounded-xl border border-slate-300 px-4 py-3 font-bold text-slate-900 hover:bg-slate-50">Read handbook</Link>
          <Link href="/apprentice/documents" className="rounded-xl border border-slate-300 px-4 py-3 font-bold text-slate-900 hover:bg-slate-50">Review documents</Link>
          {courseHref ? <Link href={courseHref} className="rounded-xl border border-slate-300 px-4 py-3 font-bold text-slate-900 hover:bg-slate-50">Open {courseLabel}</Link> : null}
        </div>

        {!completed && !subject.previewing ? (
          <form action={completeOrientation} className="mt-6">
            <input type="hidden" name="programSlug" value={programSlug} />
            <button type="submit" className="rounded-xl bg-brand-red-700 px-6 py-3 font-black text-white hover:bg-brand-red-800">
              I reviewed the orientation — mark complete
            </button>
          </form>
        ) : subject.previewing && !completed ? (
          <p className="mt-6 rounded-lg bg-amber-50 p-3 text-sm font-bold text-amber-900">Preview mode: This learner must mark orientation complete from their own account.</p>
        ) : (
          <Link href="/apprentice" className="mt-6 inline-flex rounded-xl bg-slate-950 px-6 py-3 font-black text-white hover:bg-slate-800">Return to apprentice dashboard</Link>
        )}
      </section>
    </main>
  );
}
