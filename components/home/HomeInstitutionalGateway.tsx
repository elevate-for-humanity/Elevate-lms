import Link from 'next/link';
import { ArrowRight, Building2, FileCheck2, GraduationCap, HeartHandshake } from 'lucide-react';

export function HomeInstitutionalGateway() {
  return (
    <section className="bg-slate-950 px-4 py-16 text-white sm:py-20" aria-labelledby="institutional-heading">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-10 lg:grid-cols-[1.05fr_.95fr] lg:items-start">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.18em] text-red-300">Workforce & government partners</p>
            <h2 id="institutional-heading" className="mt-3 text-3xl font-black tracking-tight sm:text-5xl">Built to operate beyond the classroom.</h2>
            <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-300">Elevate supports structured training, employer coordination, Registered Apprenticeship administration, participant workflows, documentation, credential tracking, compliance, and workforce-partner collaboration.</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/compliance/workforce-partnership-packet" className="inline-flex min-h-12 items-center gap-2 rounded-xl bg-white px-6 py-3 font-black text-slate-950 hover:bg-slate-100">Workforce Partner Packet <ArrowRight className="h-4 w-4" /></Link>
              <Link href="/compliance/center" className="inline-flex min-h-12 items-center rounded-xl border border-slate-500 px-6 py-3 font-black text-white hover:bg-slate-900">Compliance Center</Link>
              <Link href="/apprenticeship-sponsor" className="inline-flex min-h-12 items-center rounded-xl border border-slate-500 px-6 py-3 font-black text-white hover:bg-slate-900">Registered Apprenticeship</Link>
              <Link href="/employers" className="inline-flex min-h-12 items-center rounded-xl border border-slate-500 px-6 py-3 font-black text-white hover:bg-slate-900">Employer Partnerships</Link>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {[
              [GraduationCap,'Career & Technical Training','Career education, workforce training, credentials, and participant services.'],
              [Building2,'2Exclusive LLC-S','Registered Apprenticeship sponsor and apprenticeship administration infrastructure.'],
              [HeartHandshake,'Selfish Inc. / Rise Forward Foundation','Nonprofit and community-impact initiatives supporting access and community-focused work.'],
              [FileCheck2,'Compliance & Reporting','Public-facing policies, workforce partnership information, apprenticeship documentation, and accountability resources.'],
            ].map(([Icon,title,desc]) => {
              const I = Icon as typeof GraduationCap;
              return <article key={title as string} className="rounded-2xl border border-slate-700 bg-slate-900 p-6"><I className="h-7 w-7 text-red-300" /><h3 className="mt-4 text-lg font-black">{title as string}</h3><p className="mt-2 text-sm leading-6 text-slate-300">{desc as string}</p></article>;
            })}
          </div>
        </div>
        <p className="mt-8 border-t border-slate-800 pt-6 text-sm leading-6 text-slate-400">Approvals, funding eligibility, sponsorship, contracts, and legal responsibilities belong to the specific entity or program identified in the applicable documentation; the organizations are presented together here to explain the Elevate ecosystem, not to make them interchangeable.</p>
      </div>
    </section>
  );
}
