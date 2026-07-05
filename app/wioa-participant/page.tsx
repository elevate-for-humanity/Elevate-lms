import type { Metadata } from 'next';
import Link from 'next/link';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { CheckCircle, ArrowRight, FileText, Phone, ShieldCheck } from 'lucide-react';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'WIOA Participant — Funded Workforce Training',
  description: `Workforce Innovation and Opportunity Act (WIOA) funded training through ${PLATFORM_DEFAULTS.orgName}. Check eligibility, enroll in a program, and get placed into employment.`,
  alternates: { canonical: 'https://www.elevateforhumanity.org/wioa-participant' },
};

const eligible = [
  'Unemployed or underemployed adults (18+)',
  'Dislocated workers who have lost a job through layoff or plant closure',
  'Low-income individuals meeting income thresholds',
  'Youth ages 16–24 with barriers to employment',
  'SNAP / TANF / SSI recipients',
  'Individuals with disabilities',
  'Veterans and eligible spouses',
  'Ex-offenders re-entering the workforce',
];

const steps = [
  { n: '1', title: 'Apply Through Elevate', desc: 'Submit your application. We coordinate with your local WorkOne center.' },
  { n: '2', title: 'Eligibility Determination', desc: 'WorkOne or Elevate staff verify your WIOA eligibility and document your barriers.' },
  { n: '3', title: 'Individual Training Account (ITA)', desc: 'An ITA is issued covering tuition for an approved program on the ETPL.' },
  { n: '4', title: 'Enroll in Training', desc: 'Begin your program at Elevate or an approved training partner.' },
  { n: '5', title: 'Complete & Get Certified', desc: 'Finish training and sit for your industry certification exam.' },
  { n: '6', title: 'Employment Placement', desc: 'Elevate connects you with employers and apprenticeship opportunities.' },
];

const programs = [
  { label: 'Medical Assistant', href: '/programs/medical-assistant' },
  { label: 'HVAC Technician', href: '/programs/hvac-technician' },
  { label: 'CDL Training', href: '/programs/cdl-training' },
  { label: 'Cosmetology / Barbering', href: '/programs/cosmetology-apprenticeship' },
  { label: 'IT Certifications', href: '/programs/it-certifications' },
  { label: 'View All Programs', href: '/programs' },
];

export default function WIOAParticipantPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'WIOA Participant' }]} />
        </div>
      </div>

      {/* Hero */}
      <section className="bg-slate-900 py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-blue-400 text-xs font-bold uppercase tracking-widest mb-3">WIOA — Workforce Innovation & Opportunity Act</p>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-white mb-5">
            Funded Training for Eligible Participants
          </h1>
          <p className="text-slate-300 text-base sm:text-lg max-w-2xl mx-auto mb-8">
            WIOA provides federal funding for workforce training. If you qualify, your tuition, testing fees, and support services may be covered at no cost to you.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/apply/student" className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-8 py-3.5 rounded-lg transition-colors text-sm">
              Apply Now
            </Link>
            <Link href="/check-eligibility" className="border-2 border-white/40 text-slate-900 font-bold px-8 py-3.5 rounded-lg hover:bg-white/10 transition-colors text-sm">
              Check Eligibility
            </Link>
          </div>
        </div>
      </section>

      {/* Eligibility */}
      <section className="py-16 px-6 bg-white">
        <div className="max-w-5xl mx-auto">
          <p className="text-blue-600 text-xs font-bold uppercase tracking-widest text-center mb-2">Eligibility</p>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 text-center mb-4">Who Qualifies for WIOA?</h2>
          <p className="text-slate-600 text-sm text-center max-w-xl mx-auto mb-10">
            WIOA eligibility is determined by your local WorkOne center. Elevate staff can help you gather documentation and navigate the process.
          </p>
          <div className="grid sm:grid-cols-2 gap-3 max-w-3xl mx-auto">
            {eligible.map((item) => (
              <div key={item} className="flex items-start gap-3 p-4 rounded-xl border border-slate-200 bg-slate-50">
                <CheckCircle className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                <span className="text-sm text-slate-700">{item}</span>
              </div>
            ))}
          </div>
          <p className="text-center text-xs text-slate-500 mt-6">
            Not sure if you qualify?{' '}
            <Link href="/check-eligibility" className="text-blue-600 font-semibold hover:underline">
              Use our eligibility checker
            </Link>
          </p>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 px-6 bg-slate-50 border-t border-slate-100">
        <div className="max-w-5xl mx-auto">
          <p className="text-blue-600 text-xs font-bold uppercase tracking-widest text-center mb-2">Process</p>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 text-center mb-10">How WIOA Funding Works</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {steps.map((s) => (
              <div key={s.n} className="flex gap-4 p-5 rounded-2xl border border-slate-200 bg-white">
                <span className="w-9 h-9 rounded-full bg-blue-600 text-white text-sm font-extrabold flex items-center justify-center shrink-0">
                  {s.n}
                </span>
                <div>
                  <p className="font-bold text-slate-900 text-sm mb-1">{s.title}</p>
                  <p className="text-xs text-slate-600 leading-relaxed">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Programs */}
      <section className="py-16 px-6 bg-white border-t border-slate-100">
        <div className="max-w-5xl mx-auto">
          <p className="text-blue-600 text-xs font-bold uppercase tracking-widest text-center mb-2">ETPL-Approved Programs</p>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 text-center mb-10">
            Programs Eligible for WIOA Funding
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {programs.map((p) => (
              <Link
                key={p.href}
                href={p.href}
                className="rounded-xl border border-slate-200 bg-slate-50 p-5 font-bold text-slate-800 text-sm hover:border-blue-300 hover:text-blue-700 transition-colors flex items-center justify-between"
              >
                {p.label} <ArrowRight className="w-4 h-4 opacity-50" />
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* What's Covered */}
      <section className="py-16 px-6 bg-slate-50 border-t border-slate-100">
        <div className="max-w-4xl mx-auto">
          <p className="text-blue-600 text-xs font-bold uppercase tracking-widest text-center mb-2">Coverage</p>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 text-center mb-10">What WIOA May Cover</h2>
          <div className="grid sm:grid-cols-3 gap-6">
            {[
              { icon: ShieldCheck, title: 'Tuition & Fees', desc: 'Full program tuition covered through an Individual Training Account (ITA).' },
              { icon: FileText, title: 'Testing & Certification', desc: 'Exam fees for industry certifications (NHA, EPA 608, CDL, etc.).' },
              { icon: Phone, title: 'Support Services', desc: 'Transportation, childcare, and other supportive services may be available.' },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="rounded-2xl border border-slate-200 bg-white p-6 text-center">
                <Icon className="w-8 h-8 text-blue-600 mx-auto mb-3" />
                <p className="font-extrabold text-slate-900 text-base mb-2">{title}</p>
                <p className="text-xs text-slate-600 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-blue-700 py-16 px-6">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white mb-4">Start Your WIOA Application</h2>
          <p className="text-blue-100 text-sm mb-8">
            Apply through Elevate and we&apos;ll coordinate with your local WorkOne center to verify eligibility and issue your ITA.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/apply/student" className="bg-white text-blue-700 font-bold px-8 py-3.5 rounded-lg hover:bg-blue-50 transition-colors text-sm">
              Apply Now
            </Link>
            <Link href="/contact" className="border-2 border-white/40 text-slate-900 font-bold px-8 py-3.5 rounded-lg hover:bg-white/10 transition-colors text-sm">
              Contact Us
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
