
import Image from 'next/image';
import Link from 'next/link';
import type { Metadata } from 'next';
import { getPublishedProgramBySlug, formatTrackCost } from '@/lib/programs/getProgramBySlug';
import { ProgramComingSoon } from '@/components/programs/ProgramComingSoon';
import HeroVideo from '@/components/marketing/HeroVideo';
import heroBanners from '@/content/heroBanners';

export const revalidate = 600;

export async function generateMetadata(): Promise<Metadata> {
  try {
    const p = await getPublishedProgramBySlug('hvac-technician');
    return {
      title: `${p.title} | EPA 608 Proctor Site | Indianapolis`,
      description: p.short_description ?? p.description ?? undefined,
      alternates: { canonical: '/programs/hvac-technician' },
      openGraph: {
        title: p.hero_headline ?? p.title,
        description: p.hero_subheadline ?? p.short_description ?? undefined,
        type: 'website',
        url: 'https://www.elevateforhumanity.org/programs/hvac-technician',
      },
    };
  } catch {
    return {
      title: 'HVAC Technician Training | EPA 608 Proctor Site | Indianapolis',
      description: '12-week HVAC program in Indianapolis, Indiana. EPA 608 Universal proctored on-site. WIOA and WRG funding available for eligible Indiana residents.',
      alternates: { canonical: '/programs/hvac-technician' },
    };
  }
}

const WEEKLY_CURRICULUM = [
  { weeks: 'Week 1–2',  topic: 'HVAC Fundamentals',          detail: 'How heating and cooling systems work. Tools, safety, and industry standards.' },
  { weeks: 'Week 3–4',  topic: 'Electrical Systems',          detail: 'Wiring, circuits, controls, and electrical diagnostics on real equipment.' },
  { weeks: 'Week 5–6',  topic: 'Refrigeration Cycle',         detail: 'Refrigerant handling, pressure-temperature relationships, EPA 608 core concepts.' },
  { weeks: 'Week 7–8',  topic: 'System Installation & Repair', detail: 'AC units, furnaces, heat pumps — install, troubleshoot, and repair.' },
  { weeks: 'Week 9–10', topic: 'Advanced Diagnostics',        detail: 'Fault isolation, system performance testing, and customer communication.' },
  { weeks: 'Week 11',   topic: 'EPA 608 Exam Prep',           detail: 'Proctored practice exams. Core, Type I, II, III, and Universal certification prep.' },
  { weeks: 'Week 12',   topic: 'Career Readiness',            detail: 'Resume, job placement support, employer introductions, and certification wrap-up.' },
];

const OUTCOMES = [
  { role: 'HVAC Helper / Installer',    pay: '$18–$22/hr',  timeline: 'Day 1 after cert' },
  { role: 'HVAC Technician',            pay: '$22–$30/hr',  timeline: '6–12 months' },
  { role: 'Senior Tech / Lead',         pay: '$30–$40/hr',  timeline: '2–3 years' },
  { role: 'Business Owner',             pay: '$60K–$100K+', timeline: '3–5 years' },
];

const AUTHORITY = [
  'EPA 608 Universal — proctored on-site',
  'OSHA 10 — nationally recognized safety cert',
  'State-recognized workforce training provider',
  'WIOA & Workforce Ready Grant approved',
  'CPR / First Aid certification',
];

export default async function HVACTechnicianPage() {
  let program;
  try {
    program = await getPublishedProgramBySlug('hvac-technician');
  } catch {
    // DB row missing or unpublished — render static page from heroBanners config.
    // Apply migration 20260603000003_publish_hvac_program.sql to fix the DB state.
    program = null;
  }

  if (program && !program.isComplete) {
    return <ProgramComingSoon title={program.title} slug={program.slug} />;
  }

  const banner = heroBanners['hvac-technician'];

  // DB row missing — render static shell so the page is never a 404.
  // Fix: apply migration 20260603000003_publish_hvac_program.sql in Supabase Dashboard.
  if (!program) {
    return (
      <main className="min-h-screen bg-white text-slate-900">
        <HeroVideo
          videoSrcDesktop={banner.videoSrcDesktop}
          posterImage={banner.posterImage}
          microLabel={banner.microLabel}
          analyticsName={banner.analyticsName}
        />
        <section className="bg-brand-orange-600 text-white py-5 px-6 text-center">
          <p className="text-lg font-bold tracking-tight">
            This program may cost you <span className="underline decoration-wavy">$0</span> — WIOA and Workforce Ready Grant funding available for eligible Indiana residents.
          </p>
          <p className="text-sm mt-1 text-orange-100">Check your eligibility in 2 minutes. No commitment required.</p>
        </section>
        <section className="border-b border-slate-200 bg-white">
          <div className="mx-auto max-w-7xl px-6 py-12">
            <h1 className="text-4xl font-black text-slate-900 mb-4">{banner.belowHeroHeadline}</h1>
            <p className="text-slate-600 text-lg mb-8">{banner.belowHeroSubheadline}</p>
            <div className="flex flex-wrap gap-4">
              <a href={banner.primaryCta.href} className="inline-flex items-center gap-2 rounded-xl bg-brand-orange-600 hover:bg-brand-orange-700 text-white font-bold px-6 py-3 transition-colors">
                {banner.primaryCta.label}
              </a>
              {banner.secondaryCta && (
                <a href={banner.secondaryCta.href} className="inline-flex items-center gap-2 rounded-xl border-2 border-slate-300 hover:border-slate-400 text-slate-700 font-bold px-6 py-3 transition-colors">
                  {banner.secondaryCta.label}
                </a>
              )}
            </div>
          </div>
        </section>
      </main>
    );
  }

  const hero =
    program.program_media.find((m) => m.media_type === 'hero_image') ??
    program.program_media[0];

  return (
    <main className="min-h-screen bg-white text-slate-900">

      {/* ── Hero video ───────────────────────────────────────────────────── */}
      <HeroVideo
        videoSrcDesktop={banner.videoSrcDesktop}
        posterImage={banner.posterImage}

        microLabel={banner.microLabel}
        analyticsName={banner.analyticsName}
      />

      {/* ── FUNDING HEADLINE — lead with the strongest weapon ────────────── */}
      <section className="bg-brand-orange-600 text-white py-5 px-6 text-center">
        <p className="text-lg font-bold tracking-tight">
          This program may cost you <span className="underline decoration-wavy">$0</span> — WIOA and Workforce Ready Grant funding available for eligible Indiana residents.
        </p>
        <p className="text-sm mt-1 text-orange-100">Check your eligibility in 2 minutes. No commitment required.</p>
      </section>

      {/* ── Program identity + CTAs ───────────────────────────────────────── */}
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto grid max-w-7xl gap-10 px-6 py-12 md:grid-cols-2 md:items-center">
          <div>
            <p className="mb-3 text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
              12-Week Workforce Training Program
            </p>
            <h1 className="text-4xl font-bold tracking-tight md:text-5xl">
              {program.hero_headline ?? program.title}
            </h1>
            {/* Emotional hook */}
            <p className="mt-4 text-xl text-slate-600 leading-relaxed">
              You could be earning <strong className="text-slate-900">$18–$25/hr fixing AC units</strong> 90 days from now — with certifications that follow you for life.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              {program.program_ctas.map((cta) => {
                const base = 'inline-flex items-center rounded-xl px-5 py-3 font-semibold transition-colors';
                const variant =
                  cta.style_variant === 'primary'
                    ? `${base} bg-slate-900 text-white hover:bg-slate-800`
                    : cta.style_variant === 'secondary'
                    ? `${base} border border-slate-300 text-slate-900 hover:bg-slate-50`
                    : `${base} border border-slate-200 text-slate-600 hover:bg-slate-50`;
                if (cta.is_external) {
                  return <a key={cta.id} href={cta.href} target="_blank" rel="noreferrer" className={variant}>{cta.label}</a>;
                }
                return <Link key={cta.id} href={cta.href} className={variant}>{cta.label}</Link>;
              })}
            </div>

            <div className="mt-8 flex flex-wrap gap-6 text-sm text-slate-500">
              {program.length_weeks      && <span>⏱ {program.length_weeks} weeks</span>}
              {program.delivery_model    && <span className="capitalize">📍 {program.delivery_model}</span>}
              {program.certificate_title && <span>🎓 {program.certificate_title}</span>}
            </div>
          </div>

          <div className="relative">
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-100 shadow-sm">
              {hero?.url ? (
                <Image
                  src={hero.url}
                  alt={hero.alt_text ?? program.title}
                  width={1200}
                  height={800}
                  className="h-full w-full object-cover"
                  priority
                 sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw" />
              ) : (
                <Image
                  src="/images/pages/programs-hvac-course-hero.jpg"
                  alt="HVAC technician training"
                  width={1200}
                  height={800}
                  className="h-full w-full object-cover"
                  priority
                 sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw" />
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ── Authority stacking ────────────────────────────────────────────── */}
      <section className="bg-slate-900 text-white py-8 px-6">
        <div className="mx-auto max-w-7xl">
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-4 text-center">What you earn when you complete this program</p>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {AUTHORITY.map((item, i) => (
              <div key={i} className="flex items-start gap-2 text-sm text-slate-200">
                <span className="text-brand-orange-400 mt-0.5 shrink-0">✓</span>
                {item}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── What you'll learn — weekly breakdown ─────────────────────────── */}
      <section className="mx-auto max-w-7xl px-6 py-16">
        <div className="mb-8">
          <p className="text-sm font-semibold uppercase tracking-widest text-brand-orange-600 mb-2">Week by week</p>
          <h2 className="text-3xl font-bold">What You&apos;ll Learn</h2>
          <p className="mt-2 text-slate-600">No fluff. Every week builds toward a job-ready skill set.</p>
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          {WEEKLY_CURRICULUM.map((item, i) => (
            <div key={i} className="flex gap-4 rounded-xl border border-slate-200 p-5">
              <div className="shrink-0 w-20 text-xs font-bold text-brand-orange-600 uppercase tracking-wide pt-0.5">{item.weeks}</div>
              <div>
                <p className="font-semibold text-slate-900">{item.topic}</p>
                <p className="text-sm text-slate-600 mt-1">{item.detail}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Outcome clarity — training → job → money ─────────────────────── */}
      <section className="bg-slate-50 border-y border-slate-200 py-16 px-6">
        <div className="mx-auto max-w-7xl">
          <div className="mb-8">
            <p className="text-sm font-semibold uppercase tracking-widest text-brand-orange-600 mb-2">Career pathway</p>
            <h2 className="text-3xl font-bold">Training → Job → Money</h2>
            <p className="mt-2 text-slate-600">HVAC is one of the highest-demand trades in Indiana. Here&apos;s where this program takes you.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {OUTCOMES.map((o, i) => (
              <div key={i} className="bg-white rounded-xl border border-slate-200 p-5">
                <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-2">{o.timeline}</p>
                <p className="font-bold text-slate-900 text-lg">{o.role}</p>
                <p className="text-2xl font-black text-brand-orange-600 mt-1">{o.pay}</p>
              </div>
            ))}
          </div>
          {program.outcomes && (
            <p className="mt-6 text-sm text-slate-600 max-w-2xl">{program.outcomes}</p>
          )}
        </div>
      </section>

      {/* ── About + Enrollment tracks ─────────────────────────────────────── */}
      <section className="mx-auto max-w-7xl px-6 py-16">
        <div className="grid gap-10 lg:grid-cols-[1.4fr,0.9fr]">
          <div>
            <h2 className="text-2xl font-bold">About This Program</h2>
            {program.description && (
              <p className="mt-4 text-slate-700 leading-relaxed">{program.description}</p>
            )}
            {program.requirements && (
              <>
                <h3 className="mt-8 text-xl font-semibold">Requirements</h3>
                {Array.isArray(program.requirements) ? (
                  <ul className="mt-3 space-y-2">
                    {(program.requirements as string[]).map((r, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-slate-400" />
                        {r}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-3 text-slate-700">{String(program.requirements)}</p>
                )}
              </>
            )}
          </div>

          <aside className="self-start rounded-2xl border border-slate-200 p-6">
            <h2 className="text-xl font-bold">Enrollment Options</h2>
            <div className="mt-4 space-y-4">
              {program.program_tracks.map((track) => (
                <div key={track.id} className="rounded-xl border border-slate-200 p-4">
                  <div className="flex items-start justify-between gap-4">
                    <h3 className="font-semibold text-slate-900">{track.title}</h3>
                    <span className="shrink-0 text-sm font-semibold text-slate-700">
                      {formatTrackCost(track.cost_cents)}
                    </span>
                  </div>
                  {track.description && (
                    <p className="mt-2 text-sm text-slate-600">{track.description}</p>
                  )}
                  {!track.available && track.coming_soon_message && (
                    <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
                      {track.coming_soon_message}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </aside>
        </div>
      </section>

      {/* ── Curriculum modules ────────────────────────────────────────────── */}
      <section className="mx-auto max-w-7xl px-6 pb-16">
        <h2 className="mb-6 text-2xl font-bold">Full Curriculum</h2>
        <div className="space-y-4">
          {program.program_modules.map((mod) => (
            <div key={mod.id} className="overflow-hidden rounded-2xl border border-slate-200">
              <div className="border-b border-slate-200 bg-slate-50 px-6 py-4">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                      Module {mod.module_number}
                    </p>
                    <h3 className="text-lg font-semibold text-slate-900">{mod.title}</h3>
                  </div>
                  <div className="text-sm text-slate-500">
                    {mod.lesson_count} lessons{mod.duration_hours ? ` · ${mod.duration_hours}h` : ''}
                  </div>
                </div>
                {mod.description && (
                  <p className="mt-2 text-sm text-slate-600">{mod.description}</p>
                )}
              </div>
              {mod.program_lessons?.length > 0 && (
                <ol className="divide-y divide-slate-100">
                  {mod.program_lessons.map((lesson) => (
                    <li key={lesson.id} className="flex items-center justify-between gap-4 px-6 py-3">
                      <span className="text-sm text-slate-800">
                        {lesson.lesson_number}. {lesson.title}
                      </span>
                      <span className="shrink-0 text-xs uppercase tracking-wide text-slate-400">
                        {lesson.lesson_type}
                      </span>
                    </li>
                  ))}
                </ol>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ── Footer CTA ───────────────────────────────────────────────────── */}
      <section className="border-t border-slate-200 bg-slate-900 text-white py-16">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <p className="text-sm font-semibold uppercase tracking-widest text-brand-orange-400 mb-3">Ready to start?</p>
          <h2 className="text-3xl font-bold">This could cost you $0.</h2>
          <p className="mt-4 text-slate-300 text-lg">
            WIOA and Workforce Ready Grant funding covers tuition for eligible Indiana residents.
            EPA 608 Universal certification proctored on-site. Most students pay nothing.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            {program.program_ctas
              .filter((c) => c.cta_type === 'apply' || c.cta_type === 'request_info')
              .map((cta) => {
                const cls =
                  cta.style_variant === 'primary'
                    ? 'rounded-xl bg-brand-orange-600 px-6 py-3 font-semibold text-white hover:bg-brand-orange-700 transition-colors'
                    : 'rounded-xl border border-slate-600 px-6 py-3 font-semibold text-white hover:bg-slate-800 transition-colors';
                return <Link key={cta.id} href={cta.href} className={cls}>{cta.label}</Link>;
              })}
          </div>
        </div>
      </section>
    </main>
  );
}
