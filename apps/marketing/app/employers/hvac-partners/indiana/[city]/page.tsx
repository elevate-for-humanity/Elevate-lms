import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { HVAC_EMPLOYER_REGIONS, getHvacEmployerRegion } from '@/lib/marketing/hvac-employer-regions';

const SITE_URL = 'https://www.elevateforhumanity.org';
type Props = { params: Promise<{ city: string }> };

export function generateStaticParams() { return HVAC_EMPLOYER_REGIONS.map(({ slug }) => ({ city: slug })); }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const region = getHvacEmployerRegion((await params).city);
  if (!region) return {};
  const title = `HVAC Hiring & OJT Partners in ${region.city}, Indiana`;
  const description = `HVAC contractors in ${region.city} and ${region.county} can request trained candidates, post jobs, and explore eligible OJT partnerships through Elevate.`;
  return { title, description, alternates: { canonical: `${SITE_URL}/employers/hvac-partners/indiana/${region.slug}` }, robots: { index: true, follow: true }, openGraph: { title, description, url: `${SITE_URL}/employers/hvac-partners/indiana/${region.slug}`, type: 'website' } };
}

export default async function RegionalHvacEmployerPage({ params }: Props) {
  const region = getHvacEmployerRegion((await params).city);
  if (!region) notFound();
  const jsonLd = { '@context': 'https://schema.org', '@type': 'Service', name: `HVAC employer partnership support in ${region.city}`, provider: { '@id': `${SITE_URL}/#organization` }, areaServed: [{ '@type': 'City', name: region.city }, { '@type': 'AdministrativeArea', name: region.county }], serviceType: 'HVAC workforce recruitment and OJT partnership coordination' };
  return <main className="bg-white text-slate-950"><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}/><section className="bg-gradient-to-br from-slate-950 to-blue-950 px-4 py-16 text-white sm:px-6 sm:py-24"><div className="mx-auto max-w-5xl"><p className="text-sm font-black uppercase tracking-[0.16em] text-cyan-300">{region.county} HVAC workforce</p><h1 className="mt-4 text-4xl font-black tracking-tight sm:text-6xl">Find and develop HVAC talent in {region.city}.</h1><p className="mt-5 max-w-3xl text-lg leading-8 text-slate-200">Elevate prepares learners through a published six-week, 230-hour HVAC pathway that includes EPA Section 608 exam preparation, safety training, hands-on assessments, and employment preparation.</p><div className="mt-8 flex flex-col gap-3 sm:flex-row"><Link href={`/apply/employer?industry=hvac&city=${region.slug}`} className="rounded-xl bg-red-600 px-6 py-3 text-center font-black">Request Candidates or OJT Support</Link><Link href="/employers/hvac-partners" className="rounded-xl border border-white/30 bg-white/10 px-6 py-3 text-center font-black">View Statewide HVAC Network</Link></div></div></section><section className="px-4 py-14 sm:px-6"><div className="mx-auto grid max-w-5xl gap-6 md:grid-cols-3"><Value title="Hire graduates" detail="Share open roles and required qualifications. Elevate can make supported introductions when matching candidates are available."/><Value title="Explore OJT" detail="Ask WorkOne to screen the employer, job, and participant. Written authorization is required before reimbursable work starts."/><Value title="Use the portal" detail="Post jobs, review applicants, manage placements, and maintain workforce records in one authenticated employer workspace."/></div><div className="mx-auto mt-8 max-w-5xl rounded-2xl border border-amber-300 bg-amber-50 p-5 text-sm font-semibold leading-6 text-amber-950">The six-week course does not replace employer onboarding, field supervision, licensing requirements, or independent hiring review. Credential completion, candidate availability, placement, reimbursement, and performance are not guaranteed.</div></section></main>;
}

function Value({ title, detail }: { title: string; detail: string }) { return <article className="rounded-2xl border border-slate-200 p-6 shadow-sm"><h2 className="text-xl font-black">{title}</h2><p className="mt-3 leading-7 text-slate-700">{detail}</p></article>; }
