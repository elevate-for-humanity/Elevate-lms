import type { Metadata } from 'next';
import Link from 'next/link';
import { CheckCircle } from 'lucide-react';

export const metadata: Metadata = {
  title: 'CNA Program | Elevate for Humanity',
  description: 'Join the Elevate for Humanity CNA waiting list to receive official updates on anticipated October cohorts, enrollment timing, and program details.',
  alternates: { canonical: 'https://www.elevateforhumanity.org/programs/cna' },
};

const EXPECT = [
  'Program updates as they become available',
  'Information about anticipated cohort dates',
  'Enrollment instructions and next steps',
  'Announcements related to scheduling and readiness',
];

const FAQ = [
  {
    q: 'When will CNA cohorts begin?',
    a: 'Elevate for Humanity anticipates CNA cohorts beginning in October. Final dates will be shared through official program updates.',
  },
  {
    q: 'Can I enroll right now?',
    a: 'At this time, interested students should join the waiting list to receive enrollment updates and next-step information as it becomes available.',
  },
  {
    q: 'How will I know when enrollment opens?',
    a: 'Students on the waiting list will receive official updates regarding enrollment, scheduling, and program availability.',
  },
  {
    q: 'Does joining the waiting list guarantee admission?',
    a: 'No. Joining the waiting list allows you to receive official updates and future enrollment information, but it does not guarantee admission or placement in a cohort.',
  },
];

export default function CNAPage() {
  return (
    <main className="min-h-screen bg-white">

      {/* Header */}
      <div className="bg-white border-b border-slate-100 py-10 px-4">
        <div className="max-w-3xl mx-auto">
          <p className="text-brand-blue-600 text-xs font-bold uppercase tracking-widest mb-3">Healthcare Training Program</p>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-900 mb-4">
            Certified Nursing Assistant (CNA) Program
          </h1>
          <p className="text-slate-600 text-lg leading-relaxed mb-6">
            Join the waiting list for upcoming CNA cohorts anticipated to begin in October.
          </p>
          <Link
            href="/cna-waitlist"
            className="inline-block bg-brand-blue-700 hover:bg-brand-blue-800 text-white font-bold px-8 py-4 rounded-xl transition-colors"
          >
            Join the CNA Waiting List
          </Link>
        </div>
      </div>

      {/* Body */}
      <section className="py-14 border-b border-slate-100">
        <div className="max-w-3xl mx-auto px-4">
          <p className="text-slate-700 text-base leading-relaxed mb-4">
            Elevate for Humanity is preparing for upcoming CNA training opportunities designed to support learners seeking entry into the healthcare field. Our anticipated CNA cohorts are expected to begin in October, pending final program readiness and scheduling.
          </p>
          <p className="text-slate-700 text-base leading-relaxed">
            If you would like to receive updates related to enrollment, cohort timing, and program information, join the waiting list. This is the best way to receive official communication as details are finalized.
          </p>
        </div>
      </section>

      {/* What to Expect */}
      <section className="py-14 border-b border-slate-100 bg-slate-50">
        <div className="max-w-3xl mx-auto px-4">
          <h2 className="text-2xl font-extrabold text-slate-900 mb-6">What You Can Expect</h2>
          <ul className="space-y-4">
            {EXPECT.map((item) => (
              <li key={item} className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-brand-blue-600 flex-shrink-0 mt-0.5" />
                <span className="text-slate-700 text-base">{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* CTA Block */}
      <section className="py-14 border-b border-slate-100">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-2xl font-extrabold text-slate-900 mb-3">Interested in the CNA Program?</h2>
          <p className="text-slate-600 text-base leading-relaxed mb-6 max-w-xl mx-auto">
            Join the CNA waiting list to receive official updates on enrollment, scheduling, and upcoming cohort information.
          </p>
          <Link
            href="/cna-waitlist"
            className="inline-block bg-brand-blue-700 hover:bg-brand-blue-800 text-white font-bold px-8 py-4 rounded-xl transition-colors"
          >
            Join the CNA Waiting List
          </Link>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-14 bg-slate-50">
        <div className="max-w-3xl mx-auto px-4">
          <h2 className="text-2xl font-extrabold text-slate-900 mb-8">Frequently Asked Questions</h2>
          <div className="space-y-6">
            {FAQ.map(({ q, a }) => (
              <div key={q} className="bg-white rounded-xl border border-slate-200 p-6">
                <h3 className="font-bold text-slate-900 mb-2">{q}</h3>
                <p className="text-slate-600 text-sm leading-relaxed">{a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

    </main>
  );
}
