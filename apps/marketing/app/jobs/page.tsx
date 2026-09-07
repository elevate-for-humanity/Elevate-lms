import type { Metadata } from 'next';
import Link from 'next/link';
import { BriefcaseBusiness, GraduationCap } from 'lucide-react';
import LiveJobPostings from '@/components/careers/LiveJobPostings';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Job Board | Elevate for Humanity',
  description: 'Browse active employer job postings and connect training to your next career step.',
  alternates: { canonical: 'https://www.elevateforhumanity.org/jobs' },
};

export default function JobsPage() {
  return <main className="min-h-screen bg-white text-slate-950">
    <section className="bg-slate-950 px-4 py-16 text-white"><div className="mx-auto max-w-6xl">
      <p className="text-sm font-black uppercase tracking-[0.16em] text-orange-300">Job Board</p>
      <h1 className="mt-3 max-w-4xl text-4xl font-black tracking-tight sm:text-5xl">Open opportunities from participating employers</h1>
      <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-300">Browse current employer postings. Job availability, qualifications, hiring decisions, pay, and start dates are controlled by each employer and are not guaranteed by Elevate.</p>
    </div></section>
    <LiveJobPostings limit={50} heading="Current job openings" className="bg-slate-50" />
    <section className="px-4 py-14"><div className="mx-auto grid max-w-5xl gap-6 md:grid-cols-2">
      <Link href="/programs" className="rounded-2xl border border-slate-200 p-6 shadow-sm hover:border-brand-blue-400"><GraduationCap className="h-7 w-7 text-brand-blue-700" /><h2 className="mt-4 text-2xl font-black">Need training first?</h2><p className="mt-2 leading-7 text-slate-700">Compare training, credential, apprenticeship, and funding-review pathways in the program catalog.</p></Link>
      <Link href="/employers" className="rounded-2xl border border-slate-200 p-6 shadow-sm hover:border-brand-red-400"><BriefcaseBusiness className="h-7 w-7 text-brand-red-700" /><h2 className="mt-4 text-2xl font-black">Are you hiring?</h2><p className="mt-2 leading-7 text-slate-700">Use the canonical employer hub to post an opportunity or discuss workforce and apprenticeship needs.</p></Link>
    </div></section>
  </main>;
}
