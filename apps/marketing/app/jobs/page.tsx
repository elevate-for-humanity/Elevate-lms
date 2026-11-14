import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { BriefcaseBusiness, GraduationCap } from 'lucide-react';
import LiveJobPostings from '@/components/careers/LiveJobPostings';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Job Board | Elevate for Humanity',
  description: 'Browse active employer job postings and connect training to your next career step.',
  alternates: { canonical: 'https://www.elevateforhumanity.org/jobs' },
};

export default function JobsPage() {
  return (
    <main className="min-h-screen bg-white text-slate-950">
      <section className="bg-slate-950 px-4 py-10 text-white sm:py-14">
        <div className="mx-auto grid max-w-6xl items-center gap-8 md:grid-cols-2">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.16em] text-orange-300">
              Job Board
            </p>
            <h1 className="mt-3 max-w-4xl text-4xl font-black tracking-tight sm:text-5xl">
              Open opportunities from participating employers
            </h1>
            <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-300">
              Browse current employer postings. Job availability, qualifications, hiring decisions,
              pay, and start dates are controlled by each employer and are not guaranteed by
              Elevate.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="#job-openings"
                className="inline-flex min-h-11 items-center rounded-lg bg-red-700 px-5 py-3 font-bold text-white"
              >
                Explore openings
              </Link>
              <Link
                href="/employers/post-job"
                className="inline-flex min-h-11 items-center rounded-lg border border-white/40 px-5 py-3 font-bold text-white"
              >
                Post a job
              </Link>
            </div>
          </div>
          <div className="relative order-first aspect-[3/2] overflow-hidden rounded-2xl bg-slate-900 md:order-last">
            <Image
              src="/images/career-coaching-new.webp"
              alt="Illustrative career planning conversation"
              fill
              priority
              sizes="(max-width: 767px) 92vw, 520px"
              className="object-contain"
            />
          </div>
        </div>
      </section>
      <div id="job-openings">
        <LiveJobPostings
          limit={50}
          heading="Current job openings"
          className="bg-slate-50"
          showBoardLink={false}
        />
      </div>
      <section className="px-4 py-14">
        <div className="mx-auto grid max-w-5xl gap-6 md:grid-cols-2">
          <Link
            href="/programs"
            className="overflow-hidden rounded-2xl border border-slate-200 shadow-sm hover:border-brand-blue-400"
          >
            <div className="relative aspect-[16/9] max-h-44 bg-slate-100">
              <Image
                src="/images/business-training-vibrant-2026.webp"
                alt="Illustrative professional training setting"
                fill
                sizes="(max-width: 767px) 92vw, 480px"
                className="object-contain"
              />
            </div>
            <div className="p-5">
              <GraduationCap className="h-7 w-7 text-brand-blue-700" />
              <h2 className="mt-4 text-2xl font-black">Need training first?</h2>
              <p className="mt-2 leading-7 text-slate-700">
                Compare training, credential and apprenticeship pathways in the program catalog.
              </p>
            </div>
          </Link>
          <Link
            href="/employers/post-job"
            className="overflow-hidden rounded-2xl border border-slate-200 shadow-sm hover:border-brand-red-400"
          >
            <div className="relative aspect-[16/9] max-h-44 bg-slate-100">
              <Image
                src="/images/pages/apply-employer-hero.jpg"
                alt="Illustrative employer planning a hiring opportunity"
                fill
                sizes="(max-width: 767px) 92vw, 480px"
                className="object-contain"
              />
            </div>
            <div className="p-5">
              <BriefcaseBusiness className="h-7 w-7 text-brand-red-700" />
              <h2 className="mt-4 text-2xl font-black">Are you hiring?</h2>
              <p className="mt-2 leading-7 text-slate-700">
                Open the employer portal to post an opportunity and connect with potential
                applicants.
              </p>
            </div>
          </Link>
        </div>
      </section>
    </main>
  );
}
