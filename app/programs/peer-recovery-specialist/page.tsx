import Image from 'next/image';
import Link from 'next/link';
import type { Metadata } from 'next';
import { getPublishedProgramBySlug, formatTrackCost } from '@/lib/programs/getProgramBySlug';
import HeroVideo from '@/components/marketing/HeroVideo';
import heroBanners from '@/content/heroBanners';

export const revalidate = 600;

export const metadata: Metadata = {
  title: 'Peer Recovery Specialist (CPRS) | Indiana Certification | Elevate for Humanity',
  description: 'Become a Certified Peer Recovery Specialist in Indiana. WIOA and JRI funding available for eligible residents. 8-week program, state-approved.',
  alternates: { canonical: '/programs/peer-recovery-specialist' },
  openGraph: {
    title: 'Peer Recovery Specialist (CPRS) | Elevate for Humanity',
    description: 'Become a Certified Peer Recovery Specialist in Indiana. WIOA and JRI funding available.',
    type: 'website',
    url: 'https://www.elevateforhumanity.org/programs/peer-recovery-specialist',
  },
};

// Static fallback — shown when DB record is missing or unpublished
const FALLBACK = {
  title: 'Peer Recovery Specialist',
  hero_headline: 'Become a Certified Peer Recovery Specialist',
  hero_subheadline: 'Help others overcome addiction and mental health challenges. Indiana CPRS certification in 8 weeks.',
  description: 'The Peer Recovery Specialist program prepares you to support individuals in recovery from substance use and mental health challenges. You will learn motivational interviewing, recovery coaching, ethics, and trauma-informed care — all aligned with Indiana\'s CPRS certification standards.',
  outcomes: 'Graduates are eligible to sit for the Indiana CPRS exam and work in recovery centers, hospitals, community health organizations, and social service agencies across Indiana.',
  requirements: 'Must be in personal recovery for at least 2 years. High school diploma or GED required. Indiana resident preferred for funding eligibility.',
  length_weeks: 8,
  delivery_model: 'hybrid',
  certificate_title: 'Indiana CPRS Certification',
  funding: 'WIOA and Justice Reinvestment Initiative (JRI) funding available for eligible Indiana residents.',
  program_tracks: [
    { id: '1', title: 'WIOA Funded', description: 'For eligible unemployed or underemployed Indiana residents. Covers full tuition, books, and exam fees.', cost_cents: 0, funding_type: 'wioa', available: true },
    { id: '2', title: 'Self-Pay', description: 'Pay out of pocket. Payment plans available.', cost_cents: 149500, funding_type: 'self_pay', available: true },
  ],
  program_modules: [
    { id: '1', module_number: 1, title: 'Introduction to Peer Recovery', description: 'History of peer support, roles and responsibilities, ethics and boundaries.', lesson_count: 4, duration_hours: 6 },
    { id: '2', module_number: 2, title: 'Recovery Coaching Fundamentals', description: 'Motivational interviewing, active listening, goal setting, and person-centered planning.', lesson_count: 5, duration_hours: 8 },
    { id: '3', module_number: 3, title: 'Trauma-Informed Care', description: 'Understanding trauma, adverse childhood experiences (ACEs), and trauma-sensitive communication.', lesson_count: 4, duration_hours: 6 },
    { id: '4', module_number: 4, title: 'Crisis Intervention & Safety Planning', description: 'Recognizing crisis, de-escalation techniques, safety planning, and mandatory reporting.', lesson_count: 4, duration_hours: 6 },
    { id: '5', module_number: 5, title: 'CPRS Exam Preparation & Practicum', description: 'Exam review, supervised practicum hours, and certification application process.', lesson_count: 3, duration_hours: 6 },
  ],
  program_ctas: [
    { id: '1', label: 'Apply Now', href: '/apply?program=peer-recovery-specialist', style_variant: 'primary', cta_type: 'apply', is_external: false },
    { id: '2', label: 'Check My Eligibility', href: '/check-eligibility', style_variant: 'secondary', cta_type: 'request_info', is_external: false },
  ],
  program_media: [] as any[],
};

export default async function PeerRecoverySpecialistPage() {
  // Try DB first — fall back to static content if missing/unpublished
  let program: typeof FALLBACK;
  try {
    const dbProgram = await getPublishedProgramBySlug('peer-recovery-specialist');
    program = dbProgram as any;
  } catch {
    program = FALLBACK;
  }

  const banner = heroBanners['peer-recovery-specialist'];

  return (
    <main className="min-h-screen bg-white text-slate-900">

      {/* Hero video */}
      <HeroVideo
        videoSrcDesktop={banner.videoSrcDesktop}
        posterImage={banner.posterImage}
        voiceoverSrc={banner.voiceoverSrc}
        microLabel={banner.microLabel}
        analyticsName={banner.analyticsName}
      />

      {/* Program identity + CTAs */}
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto grid max-w-7xl gap-10 px-6 py-12 md:grid-cols-2 md:items-center">
          <div>
            <p className="mb-3 text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
              Workforce Training Program
            </p>
            <h1 className="text-4xl font-bold tracking-tight md:text-5xl">
              {(program as any).hero_headline ?? program.title}
            </h1>
            {(program as any).hero_subheadline && (
              <p className="mt-4 max-w-2xl text-lg text-slate-600">{(program as any).hero_subheadline}</p>
            )}
            <div className="mt-6 flex flex-wrap gap-3">
              {program.program_ctas.map((cta: any) => {
                const base = 'inline-flex items-center rounded-xl px-5 py-3 font-semibold transition-colors';
                const variant =
                  cta.style_variant === 'primary'
                    ? `${base} bg-slate-900 text-white hover:bg-slate-800`
                    : `${base} border border-slate-300 text-slate-900 hover:bg-slate-50`;
                return <Link key={cta.id} href={cta.href} className={variant}>{cta.label}</Link>;
              })}
            </div>
            <div className="mt-8 flex flex-wrap gap-6 text-sm text-slate-500">
              {program.length_weeks && <span>{program.length_weeks} weeks</span>}
              {program.delivery_model && <span className="capitalize">{program.delivery_model}</span>}
              {program.certificate_title && <span>{program.certificate_title}</span>}
            </div>
          </div>
          <div className="relative">
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-100 shadow-sm">
              <Image
                src="/images/pages/peer-recovery.jpg"
                alt="Peer Recovery Specialist training"
                width={1200}
                height={800}
                className="h-full w-full object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* About + Enrollment options */}
      <section className="mx-auto max-w-7xl px-6 py-12">
        <div className="grid gap-10 lg:grid-cols-[1.4fr,0.9fr]">
          <div>
            <h2 className="text-2xl font-bold">About this program</h2>
            {program.description && <p className="mt-4 text-slate-700 leading-relaxed">{program.description}</p>}
            {program.outcomes && (
              <>
                <h3 className="mt-8 text-xl font-semibold">Outcomes</h3>
                <p className="mt-3 text-slate-700">{program.outcomes}</p>
              </>
            )}
            {program.requirements && (
              <>
                <h3 className="mt-8 text-xl font-semibold">Requirements</h3>
                <p className="mt-3 text-slate-700">{program.requirements}</p>
              </>
            )}
            {program.funding && (
              <div className="mt-8 rounded-xl bg-green-50 border border-green-200 p-5">
                <p className="font-semibold text-green-900 mb-1">Funding Available</p>
                <p className="text-green-800 text-sm">{program.funding}</p>
                <Link href="/check-eligibility" className="inline-block mt-3 text-sm font-bold text-green-700 hover:text-green-900">
                  Check my eligibility →
                </Link>
              </div>
            )}
          </div>
          <aside className="self-start rounded-2xl border border-slate-200 p-6">
            <h2 className="text-xl font-bold">Enrollment options</h2>
            <div className="mt-4 space-y-4">
              {program.program_tracks.map((track: any) => (
                <div key={track.id} className="rounded-xl border border-slate-200 p-4">
                  <div className="flex items-start justify-between gap-4">
                    <h3 className="font-semibold text-slate-900">{track.title}</h3>
                    <span className="shrink-0 text-sm font-semibold text-slate-700">
                      {typeof formatTrackCost === 'function' ? formatTrackCost(track.cost_cents) : track.cost_cents === 0 ? '$0 (Funded)' : `$${(track.cost_cents / 100).toFixed(0)}`}
                    </span>
                  </div>
                  {track.description && <p className="mt-2 text-sm text-slate-600">{track.description}</p>}
                </div>
              ))}
            </div>
            <div className="mt-6">
              <Link href="/apply?program=peer-recovery-specialist"
                className="block w-full text-center bg-slate-900 text-white font-semibold py-3 rounded-xl hover:bg-slate-800 transition-colors">
                Apply Now
              </Link>
            </div>
          </aside>
        </div>
      </section>

      {/* Curriculum */}
      <section className="mx-auto max-w-7xl px-6 pb-16">
        <h2 className="mb-6 text-2xl font-bold">Curriculum</h2>
        <div className="space-y-4">
          {program.program_modules.map((mod: any) => (
            <div key={mod.id} className="overflow-hidden rounded-2xl border border-slate-200">
              <div className="border-b border-slate-200 bg-slate-50 px-6 py-4">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Module {mod.module_number}</p>
                    <h3 className="text-lg font-semibold text-slate-900">{mod.title}</h3>
                  </div>
                  <div className="text-sm text-slate-500">
                    {mod.lesson_count} lessons{mod.duration_hours ? ` · ${mod.duration_hours}h` : ''}
                  </div>
                </div>
                {mod.description && <p className="mt-2 text-sm text-slate-600">{mod.description}</p>}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <section className="border-t border-slate-200 bg-slate-50 py-12">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <h2 className="text-2xl font-bold">Ready to start?</h2>
          <p className="mt-3 text-slate-600">WIOA and Justice Reinvestment Initiative funding available for eligible Indiana residents.</p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link href="/apply?program=peer-recovery-specialist"
              className="rounded-xl bg-slate-900 px-6 py-3 font-semibold text-white hover:bg-slate-800 transition-colors">
              Apply Now
            </Link>
            <Link href="/check-eligibility"
              className="rounded-xl border border-slate-300 px-6 py-3 font-semibold text-slate-900 hover:bg-slate-100 transition-colors">
              Check My Eligibility
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
