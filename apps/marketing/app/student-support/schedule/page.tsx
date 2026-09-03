import { Metadata } from 'next';
import Link from 'next/link';
import { Phone, Mail, CheckCircle } from 'lucide-react';
import PictureFirstPageHero from '@/components/site/PictureFirstPageHero';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

export const metadata: Metadata = {
  title: 'Schedule Tutoring | Student Support',
  description: 'Request tutoring and academic support for your training program.',
};

export default function StudentSupportSchedulePage() {
  const phoneHref = `tel:${PLATFORM_DEFAULTS.supportPhone.replace(/[^0-9]/g, '')}`;

  return (
    <div className="min-h-screen bg-white">
      <PictureFirstPageHero
        image="/images/pages/support-page-1.webp"
        alt="Student receiving one-on-one academic support"
        eyebrow="Student Support"
        title="Request Tutoring & Academic Support"
        description="Need help with course content, study skills, exam preparation, or your learning plan? Contact student support and we will route the request to the appropriate instructor or staff member."
        actions={(
          <>
            <a href={phoneHref} className="inline-flex items-center rounded-lg bg-brand-red-600 px-7 py-3 font-bold text-white transition-colors hover:bg-brand-red-700"><Phone className="mr-2 h-4 w-4" /> Call {PLATFORM_DEFAULTS.supportPhone}</a>
            <Link href="/support/contact" className="inline-flex items-center rounded-lg border-2 border-slate-300 bg-white px-7 py-3 font-bold text-slate-900 transition-colors hover:border-slate-500">Support Request</Link>
          </>
        )}
      />

      <section className="bg-slate-50 py-16">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <h2 className="mb-12 text-center text-2xl font-bold text-slate-950 md:text-3xl">How It Works</h2>
          <div className="grid gap-8 sm:grid-cols-3">
            {[
              { step: '1', title: 'Request Support', desc: 'Tell us your program, the topic you need help with, and how to reach you.' },
              { step: '2', title: 'Get Routed', desc: 'Student support routes the request to the appropriate instructor, coach, or staff member.' },
              { step: '3', title: 'Meet & Follow Up', desc: 'Use the available in-person or virtual support option and follow up if additional help is needed.' },
            ].map((s) => (
              <div key={s.step} className="text-center">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-brand-blue-700 text-xl font-bold text-white">{s.step}</div>
                <h3 className="mb-2 font-bold text-slate-950">{s.title}</h3>
                <p className="text-sm text-slate-700">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <h2 className="mb-12 text-center text-2xl font-bold text-slate-950 md:text-3xl">Common Support Areas</h2>
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
            {['Course concepts', 'Practice and review', 'Exam preparation', 'Math fundamentals', 'Reading comprehension', 'Study skills', 'LMS navigation', 'Career planning'].map((subject) => (
              <div key={subject} className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-center">
                <CheckCircle className="mx-auto mb-2 h-5 w-5 text-brand-blue-700" />
                <p className="text-sm font-medium text-slate-800">{subject}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-brand-blue-100 bg-brand-blue-50 py-16">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="mb-4 text-2xl font-bold text-slate-950">Need Support?</h2>
          <p className="mb-8 text-slate-700">Contact the Elevate team and include your program and the topic you need help with.</p>
          <div className="flex flex-col justify-center gap-4 sm:flex-row">
            <a href={phoneHref} className="inline-flex items-center justify-center gap-2 rounded-lg bg-brand-blue-700 px-8 py-4 font-bold text-white transition-colors hover:bg-brand-blue-800"><Phone className="h-4 w-4" /> {PLATFORM_DEFAULTS.supportPhone}</a>
            <a href="mailto:support@elevateforhumanity.org" className="inline-flex items-center justify-center gap-2 rounded-lg border-2 border-slate-300 bg-white px-8 py-4 font-bold text-slate-800 transition-colors hover:border-slate-500"><Mail className="h-4 w-4" /> Email Support</a>
          </div>
        </div>
      </section>
    </div>
  );
}
