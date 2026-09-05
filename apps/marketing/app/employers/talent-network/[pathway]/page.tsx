import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowRight, CheckCircle2 } from 'lucide-react';
import {
  EMPLOYER_NETWORK_REGIONS,
  EMPLOYER_TALENT_PATHWAYS,
  getEmployerTalentPathway,
} from '@/lib/marketing/employer-talent-network';

const SITE_URL = 'https://www.elevateforhumanity.org';
export function generateStaticParams() {
  return EMPLOYER_TALENT_PATHWAYS.map(({ slug }) => ({ pathway: slug }));
}
export async function generateMetadata({
  params,
}: {
  params: Promise<{ pathway: string }>;
}): Promise<Metadata> {
  const { pathway: slug } = await params;
  const pathway = getEmployerTalentPathway(slug);
  if (!pathway) return {};
  const title = `${pathway.name} Employer Network in Indiana | Elevate`;
  const description = `${pathway.audience} can request trained candidates, post openings, and explore workforce partnership options.`;
  return {
    title,
    description,
    alternates: { canonical: `${SITE_URL}/employers/talent-network/${pathway.slug}` },
  };
}

export default async function TalentPathwayPage({
  params,
}: {
  params: Promise<{ pathway: string }>;
}) {
  const { pathway: slug } = await params;
  const pathway = getEmployerTalentPathway(slug);
  if (!pathway) return notFound();
  return (
    <main className="bg-white text-slate-950">
      <section className={`bg-gradient-to-br ${pathway.accent} px-4 py-20 text-white sm:px-6`}>
        <div className="mx-auto max-w-6xl">
          <p className="text-sm font-black uppercase tracking-[0.18em] text-cyan-300">
            Indiana {pathway.name} Employer Network
          </p>
          <h1 className="mt-4 max-w-4xl text-4xl font-black tracking-tight sm:text-6xl">
            Find, develop, and hire emerging {pathway.name.toLowerCase()} talent.
          </h1>
          <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-200">{pathway.summary}</p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href={`/apply/employer?industry=${pathway.industry}`}
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-red-600 px-6 py-3 font-black"
            >
              Request Candidates or Partnership Support <ArrowRight className="h-5 w-5" />
            </Link>
            <Link
              href={`/programs/${pathway.programSlug}`}
              className="inline-flex min-h-12 items-center justify-center rounded-xl border border-white/30 bg-white/10 px-6 py-3 font-black"
            >
              Review Training Program
            </Link>
          </div>
        </div>
      </section>
      <section className="px-4 py-14 sm:px-6">
        <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-2">
          <div>
            <h2 className="text-3xl font-black">Skills candidates develop</h2>
            <div className="mt-6 space-y-3">
              {pathway.training.map((item) => (
                <p key={item} className="flex gap-3 rounded-xl bg-slate-50 p-4 font-bold">
                  <CheckCircle2 className="h-6 w-6 shrink-0 text-emerald-700" />
                  {item}
                </p>
              ))}
            </div>
          </div>
          <div>
            <h2 className="text-3xl font-black">Potential entry-level roles</h2>
            <div className="mt-6 space-y-3">
              {pathway.roles.map((item) => (
                <p key={item} className="rounded-xl border border-slate-200 p-4 font-bold">
                  {item}
                </p>
              ))}
            </div>
          </div>
        </div>
      </section>
      <section className="bg-slate-50 px-4 py-14 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-3xl font-black">Choose your Indiana market.</h2>
          <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {EMPLOYER_NETWORK_REGIONS.map((region) => (
              <Link
                key={region.slug}
                href={`/employers/talent-network/${pathway.slug}/indiana/${region.slug}`}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:border-blue-500"
              >
                <p className="text-xs font-black uppercase tracking-wider text-slate-500">
                  {region.county}
                </p>
                <h3 className="mt-2 text-xl font-black">{region.city}</h3>
                <span className="mt-4 inline-flex text-sm font-black text-blue-800">
                  Open regional page →
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>
      <section className="bg-blue-950 px-4 py-14 text-center text-white">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-3xl font-black">Tell us what your team needs.</h2>
          <p className="mx-auto mt-4 max-w-2xl leading-7 text-blue-100">
            Submit the role, qualifications, wage, schedule, location, and desired start date.
            Elevate will review the request and available partnership options.
          </p>
          <Link
            href={`/apply/employer?industry=${pathway.industry}`}
            className="mt-7 inline-flex min-h-12 items-center rounded-xl bg-white px-7 py-3 font-black text-blue-950"
          >
            Join This Employer Network
          </Link>
          <p className="mt-6 text-sm font-semibold text-blue-200">
            Candidate availability, hiring, credential completion, OJT approval, reimbursement,
            retention, and business results are not guaranteed.
          </p>
        </div>
      </section>
    </main>
  );
}
