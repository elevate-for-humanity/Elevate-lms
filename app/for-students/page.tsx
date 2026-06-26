import Link from 'next/link';
import type { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { ArrowRight } from 'lucide-react';

export const revalidate = 3600;

export const metadata: Metadata = {
  alternates: { canonical: 'https://www.elevateforhumanity.org/for-students' },
  title: 'For Students',
  description: 'Get trained, certified, and placed in a job — often at no cost through WIOA or state funding.',
};

const steps = [
  { n: '1', title: 'Apply', desc: 'Submit one application. We handle the rest.' },
  { n: '2', title: 'Get Approved for Funding', desc: 'We check WIOA, WRG, FSSA, and other sources on your behalf.' },
  { n: '3', title: 'Get Placed in a Program', desc: 'Matched to a program based on your goals and eligibility.' },
  { n: '4', title: 'Complete Training', desc: 'Delivered by Elevate or an approved training partner.' },
  { n: '5', title: 'Test & Get Certified', desc: 'Testing coordinated through Elevate or approved certifying bodies.' },
  { n: '6', title: 'Get Placed into Employment', desc: 'Connected to employers and apprenticeship opportunities.' },
];

const categories = [
  { label: 'Healthcare', href: '/programs/healthcare' },
  { label: 'Skilled Trades', href: '/programs/skilled-trades' },
  { label: 'CDL Training', href: '/programs/cdl-training' },
  { label: 'Cosmetology & Barbering', href: '/programs/cosmetology-apprenticeship' },
  { label: 'Apprenticeships', href: '/apprenticeships' },
  { label: 'View All Programs', href: '/programs' },
];

const funding = [
  { label: 'WIOA', desc: 'Workforce Innovation & Opportunity Act — federal funding for eligible participants.' },
  { label: 'Workforce Ready Grant', desc: 'Indiana state-funded training support for high-demand careers.' },
  { label: 'FSSA Programs', desc: ', TANF, and support services for eligible participants.' },
];

export default function ForStudentsPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="bg-white border-b"><div className="max-w-6xl mx-auto px-4 py-3"><Breadcrumbs items={[{ label: 'For Students' }]} /></div></div>
      <section className="bg-slate-900 py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-brand-red-400 text-xs font-bold uppercase tracking-widest mb-3">Student Flow</p>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-white mb-5">Get Trained. Get Certified. Get Hired.</h1>
          <p className="text-slate-300 text-base sm:text-lg max-w-2xl mx-auto mb-8">Elevate connects you to workforce training, funding, certification, and employment — often at no cost through WIOA or state funding.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/apply/student" className="bg-brand-red-600 hover:bg-brand-red-700 text-white font-bold px-8 py-3.5 rounded-lg transition-colors text-sm">Apply Now</Link>
            <Link href="/check-eligibility" className="border-2 border-white/40 text-slate-900 font-bold px-8 py-3.5 rounded-lg hover:bg-white/10 transition-colors text-sm">Check Eligibility</Link>
          </div>
        </div>
      </section>
      <section className="py-16 px-6 bg-white">
        <div className="max-w-5xl mx-auto">
          <p className="text-brand-red-600 text-xs font-bold uppercase tracking-widest text-center mb-2">Your Path</p>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 text-center mb-10">How It Works</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {steps.map((s) => (
              <div key={s.n} className="flex gap-4 p-5 rounded-2xl border border-slate-200">
                <span className="w-9 h-9 rounded-full bg-brand-red-600 text-white text-sm font-extrabold flex items-center justify-center shrink-0">{s.n}</span>
                <div><p className="font-bold text-slate-900 text-sm mb-1">{s.title}</p><p className="text-xs text-slate-600 leading-relaxed">{s.desc}</p></div>
              </div>
            ))}
          </div>
          <div className="text-center mt-8"><Link href="/how-it-works" className="text-brand-red-600 font-bold text-sm hover:underline">View Full Process <ArrowRight className="inline w-4 h-4" /></Link></div>
        </div>
      </section>
      <section className="py-16 px-6 bg-slate-50 border-t border-slate-100">
        <div className="max-w-5xl mx-auto">
          <p className="text-brand-red-600 text-xs font-bold uppercase tracking-widest text-center mb-2">Programs</p>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 text-center mb-10">Program Categories</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {categories.map((c) => (
              <Link key={c.href} href={c.href} className="rounded-xl border border-slate-200 bg-white p-5 font-bold text-slate-800 text-sm hover:border-brand-red-300 hover:text-brand-red-700 transition-colors flex items-center justify-between">
                {c.label} <ArrowRight className="w-4 h-4 opacity-50" />
              </Link>
            ))}
          </div>
        </div>
      </section>
      <section className="py-16 px-6 bg-white border-t border-slate-100">
        <div className="max-w-5xl mx-auto">
          <p className="text-brand-red-600 text-xs font-bold uppercase tracking-widest text-center mb-2">Funding</p>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 text-center mb-4">Training May Be Free</h2>
          <p className="text-slate-600 text-sm text-center max-w-xl mx-auto mb-10">We help participants access every available funding source during intake.</p>
          <div className="grid sm:grid-cols-3 gap-6 mb-8">
            {funding.map((f) => (
              <div key={f.label} className="rounded-2xl border border-slate-200 p-6">
                <p className="font-extrabold text-slate-900 text-base mb-2">{f.label}</p>
                <p className="text-xs text-slate-600 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
          <div className="text-center"><Link href="/check-eligibility" className="inline-block bg-brand-red-600 hover:bg-brand-red-700 text-white font-bold px-8 py-3.5 rounded-lg transition-colors text-sm">Check Eligibility</Link></div>
        </div>
      </section>
      <section className="bg-brand-red-700 py-16 px-6">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white mb-4">Start Your Career Path Today</h2>
          <p className="text-red-100 text-sm mb-8">Apply once. Get connected to training, funding, certification, and employment.</p>
          <Link href="/apply/student" className="bg-white text-brand-red-700 font-bold px-8 py-3.5 rounded-lg hover:bg-red-50 transition-colors text-sm inline-block">Apply Now</Link>
        </div>
      </section>
    </div>
  );
}
