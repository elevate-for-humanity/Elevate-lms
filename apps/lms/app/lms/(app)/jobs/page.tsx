import { Metadata } from 'next';
import Link from 'next/link';
import { BriefcaseBusiness, ArrowRight } from 'lucide-react';
import LiveJobPostings from '@/components/careers/LiveJobPostings';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = {
  title: 'Career Opportunities | Elevate LMS',
  description: 'Current employer opportunities for Elevate learners and graduates.',
  robots: { index: false, follow: false },
};

export default function LearnerJobsPage() {
  return (
    <main className="min-h-screen bg-slate-50">
      <section className="px-4 pt-6 md:px-8 md:pt-8">
        <div className="mx-auto max-w-5xl rounded-3xl bg-slate-950 p-6 text-white md:p-8">
          <div className="flex items-center gap-2 text-sm font-bold text-cyan-300"><BriefcaseBusiness className="h-4 w-4" />Career Opportunities</div>
          <h1 className="mt-3 text-3xl font-black md:text-4xl">Move from training into employment.</h1>
          <p className="mt-3 max-w-3xl text-slate-300">Browse current employer opportunities while keeping your training, credentials, community, and career support in one learner experience.</p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link href="/lms/certificates" className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-bold text-slate-900">My credentials <ArrowRight className="h-4 w-4" /></Link>
            <Link href="/lms/support" className="inline-flex items-center gap-2 rounded-xl border border-white/30 px-4 py-2.5 text-sm font-bold text-white">Career support</Link>
          </div>
        </div>
      </section>
      <LiveJobPostings limit={18} heading="Current Employer Opportunities" className="pt-8" />
    </main>
  );
}
