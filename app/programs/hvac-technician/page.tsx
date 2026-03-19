import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import type { Metadata } from 'next';
import { getPublishedProgramBySlug, formatTrackCost } from '@/lib/programs/getProgramBySlug';

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

export default async function HVACTechnicianPage() {
  let program;
  try {
    program = await getPublishedProgramBySlug('hvac-technician');
  } catch {
    notFound();
  }

  const hero =
    program.program_media.find((m) => m.media_type === 'hero_image') ??
    program.program_media[0];

  return (
    <main className="min-h-screen bg-white text-slate-900">

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden border-b border-slate-200">
        <div className="mx-auto grid max-w-7xl gap-10 px-6 py-14 md:grid-cols-2 md:items-center">
          <div>
            <p className="mb-3 text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
              Workforce Training Program
            </p>
            <h1 className="text-4xl font-bold tracking-tight md:text-5xl">
              {program.hero_headline ?? program.title}
            </h1>
            {program.hero_subheadline && (
              <p className="mt-4 max-w-2xl text-lg text-slate-600">
                {program.hero_subheadline}
              </p>
            )}

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
                  return (
                    <a key={cta.id} href={cta.href} target="_blank" rel="noreferrer" className={variant}>
                      {cta.label}
                    </a>
                  );
                }
                return (
                  <Link key={cta.id} href={cta.href} className={variant}>
                    {cta.label}
                  </Link>
                );
              })}
            </div>

            <div className="mt-8 flex flex-wrap gap-6 text-sm text-slate-500">
              {program.length_weeks     && <span>{program.length_weeks} weeks</span>}
              {program.delivery_model   && <span className="capitalize">{program.delivery_model}</span>}
              {program.certificate_title && <span>{program.certificate_title}</span>}
            </div>
          </div>

          <div className="relative">
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-100 shadow-sm">
              <Image
                src={hero.url}
                alt={hero.alt_text ?? program.title}
                width={1200}
                height={800}
                className="h-full w-full object-cover"
                priority
              />
            </div>
          </div>
        </div>
      </section>

      {/* ── About + Enrollment tracks ─────────────────────────────────────── */}
      <section className="mx-auto max-w-7xl px-6 py-12">
        <div className="grid gap-10 lg:grid-cols-[1.4fr,0.9fr]">

          {/* About */}
          <div>
            <h2 className="text-2xl font-bold">About this program</h2>
            {program.description && (
              <p className="mt-4 text-slate-700 leading-relaxed">{program.description}</p>
            )}
            {program.outcomes && (
              <>
                <h3 className="mt-8 text-xl font-semibold">Outcomes</h3>
                <p className="mt-3 text-slate-700">{program.outcomes}</p>
              </>
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

          {/* Enrollment tracks */}
          <aside className="self-start rounded-2xl border border-slate-200 p-6">
            <h2 className="text-xl font-bold">Enrollment options</h2>
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

      {/* ── Curriculum ───────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-7xl px-6 pb-16">
        <h2 className="mb-6 text-2xl font-bold">Curriculum</h2>
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
                    {mod.lesson_count} lessons
                    {mod.duration_hours ? ` · ${mod.duration_hours}h` : ''}
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
      <section className="border-t border-slate-200 bg-slate-50 py-12">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <h2 className="text-2xl font-bold">Ready to start?</h2>
          <p className="mt-3 text-slate-600">
            WIOA and Workforce Ready Grant funding available for eligible Indiana residents.
            EPA 608 Universal certification proctored on-site.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            {program.program_ctas
              .filter((c) => c.cta_type === 'apply' || c.cta_type === 'request_info')
              .map((cta) => {
                const cls =
                  cta.style_variant === 'primary'
                    ? 'rounded-xl bg-slate-900 px-6 py-3 font-semibold text-white hover:bg-slate-800 transition-colors'
                    : 'rounded-xl border border-slate-300 px-6 py-3 font-semibold text-slate-900 hover:bg-slate-100 transition-colors';
                return (
                  <Link key={cta.id} href={cta.href} className={cls}>
                    {cta.label}
                  </Link>
                );
              })}
          </div>
        </div>
      </section>
    </main>
  );
}
