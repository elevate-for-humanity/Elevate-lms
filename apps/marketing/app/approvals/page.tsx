import type { Metadata } from 'next';
import Link from 'next/link';
import { ExternalLink, FileCheck, ShieldCheck } from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';
import { getRegisteredProgramStandard } from '@/lib/apprenticeship/registered-program-contract';
import { listPublicRegulatoryEvidence } from '@/lib/compliance/public-regulatory-evidence';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Approvals & Regulatory Evidence',
  description: `Evidence-backed public approval, funding, and registered-apprenticeship records for ${PLATFORM_DEFAULTS.orgName}.`,
  alternates: { canonical: 'https://www.elevateforhumanity.org/approvals' },
};

function label(statusType: string) {
  if (statusType === 'etpl') return 'ETPL / INTraining';
  if (statusType === 'wioa') return 'WIOA training pathway';
  if (statusType === 'wrg') return 'Workforce Ready Grant';
  return statusType.toUpperCase();
}

export default async function ApprovalsPage() {
  let evidence: Awaited<ReturnType<typeof listPublicRegulatoryEvidence>> = [];
  let evidenceError = false;
  try {
    evidence = await listPublicRegulatoryEvidence();
  } catch {
    evidenceError = true;
  }

  const byProgram = new Map<string, typeof evidence>();
  for (const row of evidence) {
    const rows = byProgram.get(row.slug) ?? [];
    rows.push(row);
    byProgram.set(row.slug, rows);
  }

  const barber = getRegisteredProgramStandard('barber-apprenticeship');
  if (!barber) {
    throw new Error('Canonical Barber registered-apprenticeship standard is missing.');
  }

  return (
    <main className="min-h-screen bg-white text-slate-950">
      <div className="border-b border-slate-200">
        <div className="mx-auto max-w-6xl px-4 py-3"><Breadcrumbs items={[{ label: 'Approvals & Evidence' }]} /></div>
      </div>

      <section className="bg-slate-950 px-4 py-16 text-white">
        <div className="mx-auto max-w-6xl">
          <p className="text-sm font-black uppercase tracking-[0.16em] text-slate-300">Public Evidence Registry</p>
          <h1 className="mt-3 max-w-4xl text-4xl font-black tracking-tight sm:text-5xl">Approvals are shown at the level the evidence supports.</h1>
          <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-300">Provider status, program approval, participant eligibility, registered-apprenticeship status, testing relationships, and funding authorization are different things. This page does not combine them into a blanket “approved” claim.</p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12">
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm font-semibold leading-6 text-amber-950">
          Public funding is never guaranteed. A listed or approved program still requires the responsible agency to determine participant eligibility, covered costs, current availability, and written authorization.
        </div>

        <section className="mt-10">
          <div className="flex items-center gap-3"><ShieldCheck className="h-7 w-7 text-brand-red-700" /><h2 className="text-3xl font-black">Registered Apprenticeship</h2></div>
          <div className="mt-5 rounded-3xl border border-slate-200 p-6 sm:p-8">
            <dl className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              <div><dt className="text-xs font-black uppercase tracking-wider text-slate-500">Sponsor of Record</dt><dd className="mt-1 font-black">{barber.sponsor.sponsor}</dd></div>
              <div><dt className="text-xs font-black uppercase tracking-wider text-slate-500">Registration</dt><dd className="mt-1 font-black">{barber.sponsor.registrationNumber}</dd></div>
              <div><dt className="text-xs font-black uppercase tracking-wider text-slate-500">Occupation</dt><dd className="mt-1 font-black">{barber.standard.occupationTitle}</dd></div>
              <div><dt className="text-xs font-black uppercase tracking-wider text-slate-500">Approach</dt><dd className="mt-1 font-black capitalize">{barber.standard.approach}</dd></div>
            </dl>
            <p className="mt-6 leading-7 text-slate-700">The canonical Barber registered-program record requires {barber.completion.competencyCount} verified competencies and {barber.completion.requiredRtiHours} verified RTI hours. Supervised work, wage, and state-licensing records are maintained separately according to the applicable program and licensing requirements.</p>
            <div className="mt-5 flex flex-wrap gap-3"><Link href="/programs/barber-apprenticeship" className="rounded-xl bg-slate-950 px-5 py-3 text-sm font-black text-white">View Barber Apprenticeship</Link><Link href="/compliance/apprenticeship-structure" className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-black">Review apprenticeship structure</Link></div>
          </div>
        </section>

        <section className="mt-12">
          <div className="flex items-center gap-3"><FileCheck className="h-7 w-7 text-brand-blue-700" /><h2 className="text-3xl font-black">Indiana workforce program evidence</h2></div>
          <p className="mt-3 max-w-3xl leading-7 text-slate-700">The cards below come from production regulatory-evidence records where <code className="rounded bg-slate-100 px-1.5 py-0.5 text-sm">public_claim_allowed</code> is explicitly true.</p>

          {evidenceError ? (
            <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm font-semibold text-amber-950">The live regulatory evidence registry could not be loaded. No program approval claim is substituted from static marketing copy.</div>
          ) : byProgram.size === 0 ? (
            <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-5 text-sm font-semibold text-slate-700">No program-level public approval rows are currently marked claimable.</div>
          ) : (
            <div className="mt-6 grid gap-6 lg:grid-cols-2">
              {[...byProgram.entries()].map(([slug, rows]) => (
                <article key={slug} className="rounded-3xl border border-slate-200 p-6">
                  <h3 className="text-2xl font-black">{rows[0]?.title ?? slug}</h3>
                  <div className="mt-5 space-y-4">
                    {rows.map((row) => (
                      <div key={`${row.authority}-${row.statusType}`} className="rounded-2xl bg-slate-50 p-4">
                        <div className="flex flex-wrap items-center justify-between gap-2"><span className="rounded-full bg-white px-3 py-1 text-xs font-black uppercase tracking-wide text-slate-800">{label(row.statusType)}</span><span className="text-xs font-bold uppercase text-emerald-700">{row.statusValue}</span></div>
                        <p className="mt-3 text-sm font-bold text-slate-900">{row.authority}</p>
                        {row.sourceReference ? <p className="mt-2 text-sm leading-6 text-slate-600">{row.sourceReference}</p> : null}
                        {row.sourceUrl ? <a href={row.sourceUrl} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex items-center gap-1.5 text-sm font-black text-brand-blue-700 hover:underline">Open public source <ExternalLink className="h-4 w-4" /></a> : null}
                      </div>
                    ))}
                  </div>
                  <Link href={`/programs/${slug}`} className="mt-5 inline-flex rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-black">View program</Link>
                </article>
              ))}
            </div>
          )}
        </section>

        <section className="mt-12 grid gap-6 lg:grid-cols-2">
          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6"><h2 className="text-2xl font-black">Provider-level public source</h2><p className="mt-3 leading-7 text-slate-700">Indiana DWD’s Workforce Ready Grant provider directory publicly lists Elevate for Humanity as a provider in Indianapolis. Provider listing does not mean every Elevate program or every applicant is WRG-funded.</p><a href="https://www.in.gov/dwd/nextleveljobs/providers/" target="_blank" rel="noopener noreferrer" className="mt-5 inline-flex items-center gap-1.5 font-black text-brand-blue-700 hover:underline">Indiana provider directory <ExternalLink className="h-4 w-4" /></a></div>
          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6"><h2 className="text-2xl font-black">Testing and certification relationships</h2><p className="mt-3 leading-7 text-slate-700">Testing-center, exam-provider, credential, and curriculum relationships are maintained separately from workforce-program approvals. Review the Testing Center and individual program pages for the exact provider and credential applicable to a service.</p><Link href="/testing" className="mt-5 inline-flex rounded-xl bg-slate-950 px-5 py-3 text-sm font-black text-white">Review Testing Center</Link></div>
        </section>

        <section className="mt-12 rounded-3xl bg-slate-950 p-7 text-white"><h2 className="text-2xl font-black">Need the underlying record?</h2><p className="mt-3 max-w-3xl leading-7 text-slate-300">For agency, procurement, licensing, or due-diligence review, request the current approval notice, registration record, program-location identifier, or supporting document applicable to the exact claim being evaluated.</p><Link href="/contact" className="mt-5 inline-flex rounded-xl bg-brand-red-600 px-5 py-3 font-black">Request supporting evidence</Link></section>
      </section>
    </main>
  );
}
