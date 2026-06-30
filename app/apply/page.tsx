import { hero as heroTokens } from '@/lib/page-design-tokens';
import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import IntakeFormInner from './IntakeFormInner';
import ApplyPathGuide from '@/components/apply/ApplyPathGuide';
import { normalizeProgramInterest } from '@/lib/intake/normalize-program-interest';
import { getAdminClient } from '@/lib/supabase/admin';
import { getStaticProgram, STATIC_PROGRAM_MAP } from '@/data/programs/index';

// No static revalidation; use the admin client when it is available so all
// published programs are returned, but keep the intake page usable in CI/local
// environments where the service-role key is intentionally absent.
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Apply | Check Eligibility for Funded Training',
  description:
    'Check eligibility for WIOA, WRG, and FSSA IMPACT-funded training in healthcare, trades, technology, and business. Many programs are no cost to eligible Indiana residents.',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/apply',
  },
};

const staticProgramOptions = Array.from(STATIC_PROGRAM_MAP.values())
  .map((program) => ({
    id: program.slug,
    title: program.title,
    slug: program.slug,
  }))
  .sort((a, b) => a.title.localeCompare(b.title));

export default async function ApplyPage({
  searchParams,
}: {
  searchParams?: Promise<{ program?: string; payment?: string }>;
}) {
  const params = await searchParams;

  // Note: ?program=barber-apprenticeship is 301'd to /programs/barber-apprenticeship/apply
  // by next.config.mjs before this page renders. No barber-specific branch needed here.
  const programSlug = normalizeProgramInterest(params?.program) ?? '';

  // Resolve a human-readable program name for the hero: try static catalog first,
  // then fall back to slug-to-title formatting so the hero is never blank.
  const staticProg = programSlug ? getStaticProgram(programSlug) : null;
  const programTitle = staticProg?.title
    ?? (programSlug
      ? programSlug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
      : '');

  let programs = staticProgramOptions;

  // Use admin client to bypass RLS when available. CI and local preview jobs often
  // do not have SUPABASE_SERVICE_ROLE_KEY, so fall back to the static catalog
  // instead of crashing the entire intake page.
  const db = await getAdminClient();
  if (db) {
    const { data, error } = await db
      .from('programs')
      .select('id, title, slug')
      .eq('published', true)
      .eq('is_active', true)
      .neq('status', 'archived')
      .order('title');

    if (!error && data?.length) {
      programs = data;
    }
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Audience switcher */}
      <div className="bg-slate-50 border-b border-slate-200">
        <div className="max-w-2xl mx-auto px-4 py-3 flex flex-wrap items-center gap-x-6 gap-y-1 text-sm">
          <span className="font-semibold text-slate-900">Applying as:</span>
          <span className="font-bold text-brand-red-600">Student / Participant</span>
          <span className="text-slate-300">|</span>
          <Link href="/apply/employer" className="text-slate-500 hover:text-slate-800 transition-colors">Employer</Link>
          <Link href="/apply/program-holder" className="text-slate-500 hover:text-slate-800 transition-colors">Training Provider</Link>
          <Link href="/partners/apply" className="text-slate-500 hover:text-slate-800 transition-colors">Agency / Partner</Link>
        </div>
      </div>

      {/* Hero — media only (no text on image); messaging below per page design standard */}
      <section className="relative w-full">
        <div className={`${heroTokens.imageWrap} w-full overflow-hidden`}>
          <Image
            src="/images/pages/apply-hero.webp"
            alt="Students exploring career training programs at Elevate for Humanity"
            fill
            className="object-cover object-center"
            priority
            sizes="100vw"
            placeholder="empty"
          />
        </div>
        <div className="bg-white border-b border-slate-200 py-10">
          <div className="max-w-2xl mx-auto px-4">
            <p className="text-xs font-bold uppercase tracking-widest text-brand-red-600 mb-2">
              Funding &amp; Apprenticeship Intake
            </p>
            {programTitle ? (
              <>
                <p className="text-slate-500 text-sm mb-1">Applying for:</p>
                <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mb-3">{programTitle}</h1>
              </>
            ) : (
              <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mb-3">
                Check Your Eligibility
              </h1>
            )}
            <p className="text-slate-700 text-base max-w-xl">
              Takes 3–5 minutes. We screen for WIOA, Workforce Ready Grant, FSSA IMPACT, and Job Ready
              Indy funding — most eligible Indiana residents pay $0.
            </p>
            <p className="mt-3 text-sm text-slate-600">
              {programTitle ? 'Not the right program?' : 'Still deciding?'}{' '}
              <Link href="/programs" className="text-brand-red-600 font-semibold hover:underline">
                Browse all programs
              </Link>
              {' · '}
              <Link href="/apply/student" className="text-brand-red-600 font-semibold hover:underline">
                Full student application
              </Link>
            </p>
          </div>
        </div>
      </section>

      {/* Form */}
      <section id="application" className="py-10" aria-label="Application form">
        <div className="max-w-2xl mx-auto px-4">
          <ApplyPathGuide variant="hub" />
          <IntakeFormInner programs={programs} />
        </div>
      </section>
    </div>
  );
}
