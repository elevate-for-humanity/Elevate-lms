import { Metadata } from 'next';
import Link from 'next/link';
import { AlertTriangle, CheckCircle, ChevronRight, Mail, Phone } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Testing Accommodations | Elevate for Humanity',
  description:
    'Request testing accommodations for your certification exam. Extended time, screen reader support, and other accommodations available. Submit at least 30 days before your exam date.',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/testing/accommodations',
  },
};

const ACCOMMODATION_TYPES = [
  { title: 'Extended Time', desc: 'Time-and-a-half or double time for candidates with documented disabilities.' },
  { title: 'Screen Reader', desc: 'Assistive technology support for visually impaired candidates.' },
  { title: 'Large Print', desc: 'Enlarged exam materials for candidates with visual impairments.' },
  { title: 'Separate Testing Room', desc: 'Private testing environment to minimize distractions.' },
  { title: 'Frequent Breaks', desc: 'Scheduled breaks during the exam for candidates who require them.' },
  { title: 'Other', desc: 'Additional accommodations reviewed on a case-by-case basis with supporting documentation.' },
];

const STEPS = [
  { step: '1', title: 'Submit at least 30 days before your exam', desc: 'Accommodation requests must be received no later than 30 days before your scheduled exam date. Late requests may not be processed in time.' },
  { step: '2', title: 'Provide supporting documentation', desc: 'Include documentation from a licensed professional (physician, psychologist, or specialist) describing your disability and the accommodations required.' },
  { step: '3', title: 'Receive confirmation', desc: 'We will review your request and confirm approved accommodations within 5–7 business days of receiving complete documentation.' },
  { step: '4', title: 'Schedule your exam', desc: 'Once accommodations are confirmed, schedule your exam through our testing center. Your approved accommodations will be applied automatically.' },
];

export default function TestingAccommodationsPage() {
  return (
    <main className="bg-white">

      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <section className="bg-[#1E3A5F] text-white py-16 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-brand-gold-400 text-sm font-semibold uppercase tracking-widest mb-3">
            Certification Testing
          </p>
          <h1 className="text-4xl md:text-5xl font-extrabold leading-tight mb-4">
            Testing Accommodations
          </h1>
          <p className="text-slate-300 text-lg max-w-xl mx-auto">
            We are committed to providing equal access to all candidates. Accommodation requests must be submitted at least 30 days before your exam date.
          </p>
        </div>
      </section>

      {/* ── DEADLINE WARNING ─────────────────────────────────────────────── */}
      <section className="bg-amber-50 border-b border-amber-200 py-6 px-4">
        <div className="max-w-3xl mx-auto flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <p className="text-amber-800 text-sm leading-relaxed">
            <strong className="text-amber-900">30-Day Deadline.</strong>{' '}
            Accommodation requests must be submitted at least 30 days before your exam date. Submit early — late requests cannot be guaranteed.
          </p>
        </div>
      </section>

      {/* ── AVAILABLE ACCOMMODATIONS ─────────────────────────────────────── */}
      <section className="py-14 px-4">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-extrabold text-slate-900 mb-2">Available Accommodations</h2>
          <p className="text-slate-500 text-sm mb-8">All accommodations require supporting documentation from a licensed professional.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {ACCOMMODATION_TYPES.map((item) => (
              <div key={item.title} className="bg-slate-50 border border-slate-200 rounded-xl px-5 py-4">
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-brand-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-slate-900 text-sm">{item.title}</p>
                    <p className="text-slate-500 text-xs mt-1">{item.desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW TO REQUEST ───────────────────────────────────────────────── */}
      <section className="bg-slate-50 border-y border-slate-200 py-14 px-4">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-2xl font-extrabold text-slate-900 text-center mb-2">How to Request Accommodations</h2>
          <p className="text-slate-500 text-sm text-center mb-10">Four steps to get your accommodations approved before exam day.</p>
          <div className="space-y-6">
            {STEPS.map(({ step, title, desc }) => (
              <div key={step} className="flex items-start gap-4">
                <div className="w-9 h-9 rounded-full bg-[#1E3A5F] text-white font-extrabold text-sm flex items-center justify-center flex-shrink-0">
                  {step}
                </div>
                <div>
                  <p className="font-semibold text-slate-900">{title}</p>
                  <p className="text-slate-500 text-sm mt-1">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CONTACT ──────────────────────────────────────────────────────── */}
      <section className="py-14 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-2xl font-extrabold text-slate-900 mb-2">Submit Your Request</h2>
          <p className="text-slate-500 text-sm mb-8">
            Contact our testing center directly to begin the accommodations process. Include your name, exam type, intended exam date, and supporting documentation.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href="mailto:testing@elevateforhumanity.org"
              className="inline-flex items-center gap-2 bg-[#1E3A5F] hover:bg-[#162d4a] text-white font-semibold px-6 py-3 rounded-full transition-colors"
            >
              <Mail className="w-4 h-4" />
              Email Testing Center
            </a>
            <a
              href="tel:3173143757"
              className="inline-flex items-center gap-2 border border-slate-300 hover:border-slate-400 text-slate-700 font-semibold px-6 py-3 rounded-full transition-colors"
            >
              <Phone className="w-4 h-4" />
              (317) 314-3757
            </a>
          </div>
          <div className="mt-10 pt-8 border-t border-slate-200">
            <p className="text-slate-500 text-sm mb-4">Ready to schedule your exam?</p>
            <Link
              href="/testing/book?type=nha"
              className="inline-flex items-center gap-2 bg-brand-red-600 hover:bg-brand-red-700 text-white font-bold px-8 py-4 rounded-full transition-colors"
            >
              Schedule Your Exam <ChevronRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

    </main>
  );
}
