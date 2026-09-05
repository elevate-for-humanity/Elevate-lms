import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  EMPLOYER_NETWORK_REGIONS,
  EMPLOYER_TALENT_PATHWAYS,
  getEmployerTalentPathway,
} from '@/lib/marketing/employer-talent-network';

const SITE_URL = 'https://www.elevateforhumanity.org';
export function generateStaticParams() {
  return EMPLOYER_TALENT_PATHWAYS.flatMap((pathway) =>
    EMPLOYER_NETWORK_REGIONS.map((region) => ({ pathway: pathway.slug, city: region.slug })),
  );
}
export async function generateMetadata({
  params,
}: {
  params: Promise<{ pathway: string; city: string }>;
}): Promise<Metadata> {
  const value = await params;
  const pathway = getEmployerTalentPathway(value.pathway);
  const region = EMPLOYER_NETWORK_REGIONS.find((item) => item.slug === value.city);
  if (!pathway || !region) return {};
  const title = `${pathway.name} Talent in ${region.city}, Indiana | Elevate`;
  const description = `${region.city}-area employers can request ${pathway.name.toLowerCase()} candidates, post jobs, and explore workforce partnership support.`;
  return {
    title,
    description,
    alternates: {
      canonical: `${SITE_URL}/employers/talent-network/${pathway.slug}/indiana/${region.slug}`,
    },
  };
}

export default async function RegionalTalentPage({
  params,
}: {
  params: Promise<{ pathway: string; city: string }>;
}) {
  const value = await params;
  const pathway = getEmployerTalentPathway(value.pathway);
  const region = EMPLOYER_NETWORK_REGIONS.find((item) => item.slug === value.city);
  if (!pathway || !region) return notFound();
  const apply = `/apply/employer?industry=${pathway.industry}&city=${region.slug}`;
  return (
    <main className="bg-white text-slate-950">
      <section className={`bg-gradient-to-br ${pathway.accent} px-4 py-20 text-white sm:px-6`}>
        <div className="mx-auto max-w-5xl">
          <p className="text-sm font-black uppercase tracking-[0.16em] text-cyan-300">
            {region.county} workforce partnership
          </p>
          <h1 className="mt-4 text-4xl font-black tracking-tight sm:text-6xl">
            Build your {pathway.name.toLowerCase()} talent pipeline in {region.city}.
          </h1>
          <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-200">
            {pathway.audience} can share openings, request candidate introductions, and explore
            work-based learning support through Elevate’s employer network.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link href={apply} className="rounded-xl bg-red-600 px-6 py-3 text-center font-black">
              Submit Employer Request
            </Link>
            <Link
              href={`/employers/talent-network/${pathway.slug}`}
              className="rounded-xl border border-white/30 bg-white/10 px-6 py-3 text-center font-black"
            >
              Statewide {pathway.name} Network
            </Link>
          </div>
        </div>
      </section>
      <section className="px-4 py-14 sm:px-6">
        <div className="mx-auto grid max-w-5xl gap-6 md:grid-cols-3">
          <Value
            title="Post openings"
            detail="Describe the work, pay, schedule, location, qualifications, and start date."
          />
          <Value
            title="Review fit"
            detail="Employers make independent hiring decisions after reviewing candidates and job requirements."
          />
          <Value
            title="Explore OJT"
            detail="WorkOne determines eligibility and must provide written authorization before reimbursable work begins."
          />
        </div>
        <div className="mx-auto mt-8 max-w-5xl rounded-2xl border border-amber-300 bg-amber-50 p-5 text-sm font-semibold leading-6 text-amber-950">
          Training does not replace employer screening, onboarding, supervision, safety obligations,
          or occupation-specific licensing. Candidate availability, placement, credential
          completion, funding, and reimbursement are not guaranteed.
        </div>
      </section>
    </main>
  );
}
function Value({ title, detail }: { title: string; detail: string }) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
      <h2 className="text-xl font-black">{title}</h2>
      <p className="mt-3 leading-7 text-slate-700">{detail}</p>
    </article>
  );
}
