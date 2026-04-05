import { Metadata } from 'next';
import Link from 'next/link';
import { CheckCircle, Shield, Clock, CalendarDays, MapPin, Phone, ChevronRight } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Schedule Your NHA Certification Exam | Elevate for Humanity',
  description:
    'Authorized NHA testing center in Indianapolis. Schedule your CCMA, CPT, CET, CMAA, or ExCPT exam. Secure proctoring, instant confirmation, full candidate support.',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/certification-testing',
  },
};

const NHA_EXAMS = [
  { code: 'CCMA', name: 'Certified Clinical Medical Assistant' },
  { code: 'CPT',  name: 'Certified Phlebotomy Technician' },
  { code: 'CET',  name: 'Certified EKG Technician' },
  { code: 'CMAA', name: 'Certified Medical Administrative Assistant' },
  { code: 'ExCPT', name: 'Certified Pharmacy Technician' },
  { code: 'CPCT/A', name: 'Certified Patient Care Technician/Assistant' },
];

const WHAT_IT_COVERS = [
  'Official NHA certification exam voucher',
  'Secure, proctored testing environment',
  'Scheduling and administrative handling',
  'Identity verification and compliance',
  'Candidate support before and after your exam',
];

const WHAT_TO_EXPECT = [
  { step: '1', text: 'Choose your exam and preferred date/time' },
  { step: '2', text: 'Complete registration in under 2 minutes' },
  { step: '3', text: 'Receive instant confirmation with check-in instructions' },
  { step: '4', text: 'Arrive prepared — we handle the rest' },
];

export default function CertificationTestingPage() {
  return (
    <main className="bg-white">

      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <section className="bg-[#1E3A5F] text-white py-16 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-brand-gold-400 text-sm font-semibold uppercase tracking-widest mb-3">
            NHA Authorized Testing Center
          </p>
          <h1 className="text-4xl md:text-5xl font-extrabold leading-tight mb-4">
            Get Certified.<br className="hidden sm:block" /> Schedule Your Exam Today.
          </h1>
          <p className="text-slate-300 text-lg mb-8 max-w-xl mx-auto">
            Fast, secure, and supported testing through our authorized NHA certification center in Indianapolis.
          </p>
          <Link
            href="/testing/book?type=nha"
            className="inline-flex items-center gap-2 bg-brand-red-600 hover:bg-brand-red-700 text-white font-bold text-lg px-8 py-4 rounded-full transition-colors"
          >
            Schedule Your Exam <ChevronRight className="w-5 h-5" />
          </Link>
          <div className="flex items-center justify-center gap-6 mt-6 text-sm text-slate-400">
            <span className="flex items-center gap-1.5"><Shield className="w-4 h-4" /> Secure checkout</span>
            <span className="flex items-center gap-1.5"><CheckCircle className="w-4 h-4" /> Instant confirmation</span>
            <span className="flex items-center gap-1.5"><Clock className="w-4 h-4" /> No hidden fees</span>
          </div>
        </div>
      </section>

      {/* ── AUTHORITY STRIP ──────────────────────────────────────────────── */}
      <section className="bg-slate-50 border-b border-slate-200 py-6 px-4">
        <div className="max-w-3xl mx-auto flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
          <div className="flex-shrink-0 w-12 h-12 bg-[#1E3A5F] rounded-full flex items-center justify-center">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <p className="text-slate-700 text-sm leading-relaxed">
            <strong className="text-slate-900">Authorized Testing Center — NHA Account #412957.</strong>{' '}
            This exam is administered through an authorized testing partner of the National Healthcareer Association.
            All candidates receive secure proctoring, verified testing conditions, and full support throughout the process.
          </p>
        </div>
      </section>

      {/* ── PRICING BOX ──────────────────────────────────────────────────── */}
      <section className="py-14 px-4">
        <div className="max-w-lg mx-auto">
          <h2 className="text-2xl font-extrabold text-slate-900 text-center mb-2">Exam Pricing</h2>
          <p className="text-slate-500 text-sm text-center mb-8">All NHA certification exams — one flat rate.</p>

          <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
            <div className="bg-slate-50 px-6 py-4 border-b border-slate-200">
              <div className="flex justify-between items-center text-sm text-slate-600">
                <span>NHA Certification Exam</span>
                <span className="font-semibold text-slate-900">$149</span>
              </div>
            </div>
            <div className="bg-slate-50 px-6 py-4 border-b border-slate-200">
              <div className="flex justify-between items-center text-sm text-slate-600">
                <span>Testing &amp; Administration</span>
                <span className="font-semibold text-slate-900">$94</span>
              </div>
            </div>
            <div className="bg-[#1E3A5F] px-6 py-5">
              <div className="flex justify-between items-center">
                <span className="text-white font-bold text-lg">Total</span>
                <span className="text-white font-extrabold text-2xl">$243</span>
              </div>
            </div>
          </div>

          {/* Fee justification */}
          <div className="mt-6 bg-slate-50 rounded-xl border border-slate-200 px-5 py-4">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">What your fee covers</p>
            <ul className="space-y-2">
              {WHAT_IT_COVERS.map((item) => (
                <li key={item} className="flex items-start gap-2 text-sm text-slate-700">
                  <CheckCircle className="w-4 h-4 text-brand-green-600 flex-shrink-0 mt-0.5" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-6 text-center">
            <Link
              href="/testing/book?type=nha"
              className="inline-flex items-center gap-2 bg-brand-red-600 hover:bg-brand-red-700 text-white font-bold text-lg px-8 py-4 rounded-full transition-colors w-full justify-center"
            >
              Schedule Your Exam <ChevronRight className="w-5 h-5" />
            </Link>
            <p className="text-xs text-slate-400 mt-3">Secure checkout · Instant confirmation · No hidden fees</p>
          </div>
        </div>
      </section>

      {/* ── UPSELL ───────────────────────────────────────────────────────── */}
      <section className="bg-amber-50 border-y border-amber-200 py-12 px-4">
        <div className="max-w-lg mx-auto">
          <p className="text-amber-700 text-xs font-semibold uppercase tracking-widest mb-2 text-center">
            Recommended for first-time test takers
          </p>
          <h2 className="text-xl font-extrabold text-slate-900 text-center mb-1">
            Increase Your Chances of Passing
          </h2>
          <p className="text-slate-600 text-sm text-center mb-6">
            Add the Certification Success Package at checkout for $59.
          </p>
          <div className="bg-white rounded-xl border border-amber-300 px-5 py-5 shadow-sm">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-5 h-5 rounded border-2 border-amber-500 bg-amber-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                <CheckCircle className="w-3 h-3 text-amber-600" />
              </div>
              <div>
                <p className="font-bold text-slate-900">Certification Success Package — <span className="text-amber-700">$59</span></p>
                <p className="text-sm text-slate-500 mt-0.5">Add this when you schedule your exam</p>
              </div>
            </div>
            <ul className="space-y-2 pl-8">
              {[
                'Full-length NHA practice test',
                'Study guide with exam blueprint breakdown',
                'Retake strategy session (if needed)',
                'Email support from our prep team',
              ].map((item) => (
                <li key={item} className="flex items-start gap-2 text-sm text-slate-700">
                  <CheckCircle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ── AVAILABLE EXAMS ──────────────────────────────────────────────── */}
      <section className="py-14 px-4">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-extrabold text-slate-900 text-center mb-2">Available NHA Exams</h2>
          <p className="text-slate-500 text-sm text-center mb-8">All exams proctored in-person at our Indianapolis testing center.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {NHA_EXAMS.map((exam) => (
              <Link
                key={exam.code}
                href={`/testing/book?type=nha&exam=${exam.code}`}
                className="flex items-center justify-between bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl px-5 py-4 transition-colors group"
              >
                <div>
                  <p className="font-bold text-slate-900 text-sm">{exam.code}</p>
                  <p className="text-slate-500 text-xs mt-0.5">{exam.name}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-700 transition-colors" />
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── WHAT TO EXPECT ───────────────────────────────────────────────── */}
      <section className="bg-slate-50 border-y border-slate-200 py-14 px-4">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-2xl font-extrabold text-slate-900 text-center mb-2">What to Expect</h2>
          <p className="text-slate-500 text-sm text-center mb-10">From booking to certification in four steps.</p>
          <div className="space-y-6">
            {WHAT_TO_EXPECT.map(({ step, text }) => (
              <div key={step} className="flex items-start gap-4">
                <div className="w-9 h-9 rounded-full bg-[#1E3A5F] text-white font-extrabold text-sm flex items-center justify-center flex-shrink-0">
                  {step}
                </div>
                <p className="text-slate-700 font-medium pt-1.5">{text}</p>
              </div>
            ))}
          </div>
          <div className="mt-10 text-center">
            <Link
              href="/testing/book?type=nha"
              className="inline-flex items-center gap-2 bg-brand-red-600 hover:bg-brand-red-700 text-white font-bold text-lg px-8 py-4 rounded-full transition-colors"
            >
              Schedule Your Exam <ChevronRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── URGENCY ──────────────────────────────────────────────────────── */}
      <section className="py-10 px-4">
        <div className="max-w-2xl mx-auto bg-brand-red-50 border border-brand-red-200 rounded-2xl px-6 py-6 text-center">
          <CalendarDays className="w-8 h-8 text-brand-red-600 mx-auto mb-3" />
          <h3 className="font-extrabold text-slate-900 text-lg mb-1">Limited Daily Testing Slots</h3>
          <p className="text-slate-600 text-sm max-w-md mx-auto">
            We limit the number of candidates per session to maintain a secure and focused testing environment.
            Book early to secure your preferred date and time.
          </p>
        </div>
      </section>

      {/* ── LOCATION + CONTACT ───────────────────────────────────────────── */}
      <section className="bg-[#1E3A5F] text-white py-12 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-xl font-extrabold mb-6">Testing Center Location</h2>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 text-sm text-slate-300">
            <div className="flex items-start gap-2">
              <MapPin className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
              <span>8888 Keystone Crossing, Suite 1300<br />Indianapolis, IN 46240</span>
            </div>
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-slate-400 flex-shrink-0" />
              <a href="tel:3173143757" className="hover:text-white transition-colors">(317) 314-3757</a>
            </div>
          </div>
          <div className="mt-8">
            <Link
              href="/testing/book?type=nha"
              className="inline-flex items-center gap-2 bg-brand-red-600 hover:bg-brand-red-700 text-white font-bold text-lg px-8 py-4 rounded-full transition-colors"
            >
              Schedule Your Exam <ChevronRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

    </main>
  );
}
