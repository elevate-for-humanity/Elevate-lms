export const revalidate = 3600;

import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';
import { ROUTES } from '@/lib/navigation/routes';
import PictureFirstPageHero from '@/components/site/PictureFirstPageHero';

export const metadata: Metadata = {
  title: `Hire Our Graduates | ${PLATFORM_DEFAULTS.orgName}`,
  description:
    'Connect with trained Elevate learners and graduates across workforce and career-training pathways.',
  alternates: { canonical: 'https://www.elevateforhumanity.org/hire-graduates' },
};

const BENEFITS = [
  'Candidates connected to structured career-training and credential pathways.',
  'Employer access to workforce, apprenticeship, and placement coordination tools.',
  'Centralized job-posting and candidate-management workflow through the Employer Portal.',
  'Workforce partnership support for hiring, training, and eligible work-based learning programs.',
];

const PATHWAYS = [
  {
    title: 'Healthcare',
    description: 'Connect with candidates preparing for healthcare support and clinical credential pathways.',
    image: '/images/pages/about-employer-partners.webp',
  },
  {
    title: 'Skilled Trades',
    description: 'Reach learners developing technical skills for HVAC and other employer-driven trade pathways.',
    image: '/images/pages/apprenticeship-structure.webp',
  },
  {
    title: 'Technology & Business',
    description: 'Find candidates building digital, office, customer-service, and business operations skills.',
    image: '/images/pages/admin-partners-hero.webp',
  },
] as const;

export default function HireGraduatesPage() {
  return (
    <main className="min-h-screen bg-white text-slate-950">
      <PictureFirstPageHero
        image="/images/pages/for-employers-page-1.webp"
        alt="Employer meeting with workforce candidates and training partners"
        eyebrow="Employer Hiring"
        title="Hire Trained Candidates Through Elevate"
        description="Use one employer pathway to post opportunities, connect with candidates, and coordinate workforce or apprenticeship hiring needs."
        actions={(
          <>
            <a
              href={ROUTES.employerPortal}
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-brand-red-700 px-7 py-3 font-black text-white hover:bg-brand-red-800"
            >
              Open Employer Portal <ArrowRight className="h-5 w-5" />
            </a>
            <Link
              href={ROUTES.apprenticeshipsHostShop}
              className="inline-flex min-h-12 items-center justify-center rounded-xl border-2 border-slate-900 bg-white px-7 py-3 font-black text-slate-950 hover:bg-slate-100"
            >
              Become a Host Site
            </Link>
          </>
        )}
      />

      <section className="bg-slate-50 px-4 py-14">
        <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.14em] text-brand-red-700">Why use Elevate</p>
            <h2 className="mt-2 text-3xl font-black text-slate-950">A single employer workflow from opportunity to placement</h2>
            <ul className="mt-6 space-y-3">
              {BENEFITS.map((benefit) => (
                <li key={benefit} className="rounded-xl border border-slate-300 bg-white p-4 text-sm font-semibold leading-6 text-slate-800 shadow-sm">
                  {benefit}
                </li>
              ))}
            </ul>
          </div>
          <div className="relative min-h-[360px] overflow-hidden rounded-2xl bg-slate-200">
            <Image
              src="/images/pages/employer-page-1.webp"
              alt="Employer reviewing candidate and workforce placement information"
              fill
              sizes="(max-width: 1024px) 100vw, 55vw"
              className="object-cover"
            />
          </div>
        </div>
      </section>

      <section className="px-4 py-14">
        <div className="mx-auto max-w-6xl">
          <div className="max-w-3xl">
            <p className="text-sm font-black uppercase tracking-[0.14em] text-brand-red-700">Candidate pathways</p>
            <h2 className="mt-2 text-3xl font-black text-slate-950">Recruit across multiple training areas</h2>
            <p className="mt-3 text-base leading-7 text-slate-700">
              Candidate availability varies by active cohort, completion status, location, and employer requirements.
            </p>
          </div>

          <div className="mt-8 grid gap-6 md:grid-cols-3">
            {PATHWAYS.map((pathway) => (
              <article key={pathway.title} className="overflow-hidden rounded-2xl border border-slate-300 bg-white shadow-sm">
                <div className="relative h-44 bg-slate-200">
                  <Image src={pathway.image} alt={`${pathway.title} workforce training`} fill sizes="(max-width: 768px) 100vw, 33vw" className="object-cover" />
                </div>
                <div className="p-5">
                  <h3 className="text-lg font-black text-slate-950">{pathway.title}</h3>
                  <p className="mt-2 text-sm font-medium leading-6 text-slate-700">{pathway.description}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-slate-200 bg-slate-950 px-4 py-12 text-white">
        <div className="mx-auto flex max-w-6xl flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="max-w-2xl">
            <h2 className="text-3xl font-black text-white">Ready to post an opportunity?</h2>
            <p className="mt-2 text-base font-medium leading-7 text-slate-100">
              Job posting and candidate management belong in the authenticated Employer Portal, not on a second public form.
            </p>
          </div>
          <a
            href={ROUTES.employerPortal}
            className="inline-flex min-h-12 shrink-0 items-center justify-center gap-2 rounded-xl bg-white px-7 py-3 font-black text-slate-950 hover:bg-slate-100"
          >
            Go to Employer Portal <ArrowRight className="h-5 w-5" />
          </a>
        </div>
      </section>
    </main>
  );
}
