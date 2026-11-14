import Link from 'next/link';
import { BookOpen, CheckCircle2, ExternalLink, Megaphone, ShieldCheck } from 'lucide-react';
import { requireRole } from '@/lib/auth/require-role';
import { HOST_SHOP_ROLES } from '@/lib/rbac/role-matrix';
import {
  BEAUTY_TRACKS,
  HOST_SHOP_QUICK_START,
  MILESTONE_MAP,
  backlinkSnippet,
  registrationCopy,
  fundingCopy,
} from '@/content/beauty-apprenticeship-growth-kit';

export const dynamic = 'force-dynamic';
export const metadata = {
  title: 'Beauty Apprenticeship Host Shop Guide | Elevate',
  robots: { index: false, follow: false },
};

export default async function BeautyApprenticeshipHostGuidePage() {
  await requireRole(HOST_SHOP_ROLES);

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6">
      <div className="mx-auto max-w-6xl space-y-7">
        <section className="overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-violet-950 to-rose-900 p-7 text-white shadow-xl sm:p-9">
          <div className="flex flex-wrap items-center gap-2 text-xs font-black uppercase tracking-[0.14em] text-rose-200">
            <ShieldCheck className="h-5 w-5" /> Host Shop Partner Resource
          </div>
          <h1 className="mt-4 text-3xl font-black tracking-tight sm:text-5xl">Beauty & Grooming Apprenticeship Quick-Start Guide</h1>
          <p className="mt-4 max-w-3xl text-sm font-medium leading-7 text-slate-100 sm:text-base">
            Use this guide for day-to-day Host Shop execution. Registered tracks display their approved competency and RTI requirements; the portal does not substitute a generic work-hour completion counter.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/host-shop/dashboard" className="rounded-xl bg-white px-4 py-2.5 text-sm font-black text-slate-950">Back to Host Shop Dashboard</Link>
            <Link href="/host-shop/dashboard/hours/pending" className="rounded-xl border border-white/30 bg-white/10 px-4 py-2.5 text-sm font-black text-white">Review Hours</Link>
          </div>
        </section>

        <section className="grid gap-5 md:grid-cols-2">
          {HOST_SHOP_QUICK_START.map((section) => (
            <article key={section.title} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-xl font-black text-slate-950">{section.title}</h2>
              <ul className="mt-4 space-y-3">
                {section.bullets.map((bullet) => (
                  <li key={bullet} className="flex gap-2 text-sm font-medium leading-6 text-slate-700">
                    <CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-emerald-600" /> {bullet}
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="flex items-center gap-2 text-sm font-black uppercase tracking-[0.14em] text-violet-700"><BookOpen className="h-5 w-5" /> Registered progress contracts</div>
          <div className="mt-6 grid gap-5 lg:grid-cols-3">
            {(Object.keys(BEAUTY_TRACKS) as Array<keyof typeof BEAUTY_TRACKS>).map((track) => {
              const config = BEAUTY_TRACKS[track];
              const milestones = MILESTONE_MAP[track];
              return (
                <article key={track} className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                  <h3 className="text-lg font-black text-slate-950">{config.label}</h3>
                  <p className="mt-2 text-xs font-semibold leading-5 text-slate-600">{registrationCopy(config.program)}</p>
                  <p className="mt-2 text-xs font-semibold leading-5 text-slate-600">{fundingCopy(config.program)}</p>
                  <div className="mt-4 space-y-3">
                    {milestones.map((milestone) => (
                      <div key={`${track}-${milestone.label}`} className="rounded-xl bg-white p-3 shadow-sm">
                        <div className="text-sm font-black text-violet-800">{milestone.label}</div>
                        <p className="mt-1 text-xs font-medium leading-5 text-slate-700">{milestone.milestone}</p>
                      </div>
                    ))}
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        <section className="rounded-3xl border border-rose-200 bg-rose-50 p-6 sm:p-8">
          <div className="flex items-center gap-2 text-sm font-black uppercase tracking-[0.14em] text-rose-700"><Megaphone className="h-5 w-5" /> Co-marketing backlinks</div>
          <p className="mt-3 max-w-3xl text-sm font-medium leading-6 text-slate-700">Approved Host Shops can place the correct track link on their own Careers, About, or Apprenticeship page. Keep the wording factual; do not add “100% funded,” guaranteed placement, or registration claims beyond the current track record.</p>
          <div className="mt-5 grid gap-4 lg:grid-cols-3">
            {(Object.keys(BEAUTY_TRACKS) as Array<keyof typeof BEAUTY_TRACKS>).map((track) => {
              const config = BEAUTY_TRACKS[track];
              return (
                <div key={track} className="rounded-2xl bg-white p-4 shadow-sm">
                  <div className="font-black text-slate-950">{config.label}</div>
                  <p className="mt-2 break-words text-xs font-medium leading-5 text-slate-700">{backlinkSnippet(track)}</p>
                  <a href={`https://www.elevateforhumanity.org${config.path}`} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-1.5 text-xs font-black text-rose-700">Open public page <ExternalLink className="h-3.5 w-3.5" /></a>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </main>
  );
}
