import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, BriefcaseBusiness, ClipboardCheck, ShieldCheck, Wrench } from 'lucide-react';
import { HVAC_EMPLOYER_REGIONS } from '@/lib/marketing/hvac-employer-regions';

const SITE_URL = 'https://www.elevateforhumanity.org';

export const metadata: Metadata = {
  title: 'Indiana HVAC Employer & Hiring Partner Network',
  description: 'Indiana HVAC contractors can request trained candidates, post jobs, and explore eligible OJT or workforce partnerships through Elevate for Humanity.',
  alternates: { canonical: `${SITE_URL}/employers/hvac-partners` },
  robots: { index: true, follow: true },
};

const FACTS = [
  ['6-week training path', 'The published HVAC curriculum includes 230 hours of hybrid instruction, hands-on practice, assessments, and employment preparation.'],
  ['EPA Section 608 preparation', 'Learners prepare for Core and Type I–III testing. Certification is earned only after passing the applicable credentialing exam.'],
  ['Safety and employability training', 'The current program includes OSHA 10, CPR, and Rise Up alongside HVAC technical instruction.'],
  ['Employer workflow', 'Verified employers can post jobs, review applicants, request introductions, and document eligible work-based learning through the secure Employer Portal.'],
] as const;

export default function HvacEmployerPartnersPage() {
  const jsonLd = { '@context': 'https://schema.org', '@type': 'Service', name: 'Indiana HVAC Employer Partnership Network', provider: { '@id': `${SITE_URL}/#organization` }, areaServed: { '@type': 'State', name: 'Indiana' }, serviceType: 'HVAC workforce recruitment and employer partnership coordination', url: `${SITE_URL}/employers/hvac-partners` };
  return (
    <main className="bg-white text-slate-950">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <section className="overflow-hidden bg-slate-950 text-white">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-14 sm:px-6 lg:grid-cols-[1fr_.9fr] lg:py-20">
          <div><p className="text-sm font-black uppercase tracking-[0.16em] text-cyan-300">Indiana HVAC Employer Network</p><h1 className="mt-4 text-4xl font-black tracking-tight sm:text-6xl">Build your technician pipeline with a verified employer workflow.</h1><p className="mt-5 max-w-2xl text-lg leading-8 text-slate-200">Connect with learners completing Elevate’s six-week HVAC training path, post openings, and ask WorkOne whether a candidate and position qualify for preauthorized OJT support.</p><div className="mt-8 flex flex-col gap-3 sm:flex-row"><Link href="/apply/employer?industry=hvac" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-red-600 px-6 py-3 font-black text-white">Join as an HVAC Employer <ArrowRight className="h-5 w-5" /></Link><a href="https://app.elevateforhumanity.org/employer/dashboard" className="inline-flex min-h-12 items-center justify-center rounded-xl border border-white/30 bg-white/10 px-6 py-3 font-black">Employer Portal</a></div></div>
          <div className="relative aspect-[4/3] overflow-hidden rounded-3xl border border-white/15 bg-slate-800"><Image src="/images/pages/apprenticeship-structure.webp" alt="HVAC employer and technician workforce partnership" fill priority sizes="(max-width:1024px) 100vw,45vw" className="object-cover" /></div>
        </div>
      </section>
      <section className="px-4 py-14 sm:px-6"><div className="mx-auto max-w-6xl"><p className="text-sm font-black uppercase tracking-wider text-red-700">What employers can rely on</p><h2 className="mt-2 text-3xl font-black">Specific preparation—not hiring guarantees.</h2><div className="mt-8 grid gap-5 md:grid-cols-2">{FACTS.map(([title, detail], index) => { const Icon = [Wrench, ShieldCheck, ClipboardCheck, BriefcaseBusiness][index]; return <article key={title} className="rounded-2xl border border-slate-200 p-6 shadow-sm"><Icon className="h-7 w-7 text-blue-700"/><h3 className="mt-4 text-xl font-black">{title}</h3><p className="mt-2 leading-7 text-slate-700">{detail}</p></article>; })}</div><div className="mt-7 rounded-2xl border border-amber-300 bg-amber-50 p-5 text-sm font-semibold leading-6 text-amber-950">Candidate readiness, credential completion, interviews, hiring, reimbursements, and retention are not guaranteed. Employers make their own hiring decisions. WorkOne must approve any OJT arrangement before covered employment begins.</div></div></section>
      <section className="bg-slate-50 px-4 py-14 sm:px-6"><div className="mx-auto max-w-6xl"><p className="text-sm font-black uppercase tracking-wider text-red-700">Regional employer pathways</p><h2 className="mt-2 text-3xl font-black">Recruit and train in your Indiana market.</h2><div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{HVAC_EMPLOYER_REGIONS.map((region) => <Link key={region.slug} href={`/employers/hvac-partners/indiana/${region.slug}`} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:border-blue-400"><p className="text-xs font-black uppercase tracking-wider text-slate-500">{region.county}</p><h3 className="mt-2 text-xl font-black">{region.city}</h3><span className="mt-4 inline-flex text-sm font-black text-blue-800">Open regional page →</span></Link>)}</div></div></section>
      <section className="bg-blue-950 px-4 py-14 text-center text-white sm:px-6"><div className="mx-auto max-w-4xl"><h2 className="text-3xl font-black">Need entry-level HVAC talent?</h2><p className="mx-auto mt-4 max-w-2xl leading-7 text-blue-100">Tell Elevate what roles, wages, schedule, location, and start date you need. The workforce team will review fit and available candidates.</p><Link href="/apply/employer?industry=hvac" className="mt-7 inline-flex min-h-12 items-center rounded-xl bg-white px-7 py-3 font-black text-blue-950">Submit Employer Partnership Request</Link></div></section>
    </main>
  );
}
