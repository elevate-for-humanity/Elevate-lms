import type { Metadata } from 'next';
import Link from 'next/link';
import { Building2, Users, Award, TrendingUp, CheckCircle, ChevronRight, Handshake } from 'lucide-react';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

export const metadata: Metadata = {
  title: `Employer Solutions | ${PLATFORM_DEFAULTS.orgName}`,
  description: 'Partner with us to build a skilled workforce pipeline. Access pre-trained graduates, apprenticeships, and WOTC tax credits.',
  alternates: { canonical: 'https://www.elevateforhumanity.org/for-employers' },
};

const benefits = [
  { icon: Users, title: 'Trained Workforce', desc: 'Access graduates pre-screened and trained for your industry.' },
  { icon: Award, title: 'Industry Credentials', desc: 'Candidates earn verified credentials before they reach your door.' },
  { icon: TrendingUp, title: 'WOTC Tax Credits', desc: 'Hire eligible workers and claim up to $9,600 per employee.' },
  { icon: Building2, title: 'Custom Training', desc: 'We can train employees on your specific equipment and processes.' },
];

const steps = [
  'Submit a job description or staffing request',
  'We match candidates from our graduate pool',
  'Optional: Host apprentices for on-the-job training',
  'Hire confident with verified credentials',
];

export default function ForEmployersPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <section className="bg-gradient-to-br from-slate-900 via-brand-blue-900 to-slate-900 text-white py-20 sm:py-28 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAgTCAwIDIwIEwgMTAgMjAgWiIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjZmZmZmZmZmYwMDIiIHN0cm9rZS1vcGFjaXR5PSIwLjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-30" />
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <div className="inline-flex items-center gap-2 bg-brand-red-600/20 text-brand-red-400 px-4 py-2 rounded-full text-sm font-bold mb-6">
            <Handshake className="w-4 h-4" /> For Employers
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight mb-6">
            Build Your Workforce Pipeline
          </h1>
          <p className="text-xl text-slate-300 max-w-3xl mx-auto mb-10">
            Partner with {PLATFORM_DEFAULTS.orgName} to access pre-trained graduates, apprenticeships, and workforce development support.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/employer/post-job" className="bg-brand-red-600 hover:bg-brand-red-700 text-white font-bold px-8 py-4 rounded-xl transition-colors text-lg">
              Post a Job Opening
            </Link>
            <Link href="/contact?type=employer" className="border-2 border-white/30 text-white hover:bg-white/10 font-bold px-8 py-4 rounded-xl transition-colors text-lg">
              Contact Us
            </Link>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-black text-slate-900 text-center mb-12">Why Partner With Us?</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {benefits.map((b) => (
              <div key={b.title} className="bg-white rounded-xl p-6 border border-slate-200 text-center">
                <b.icon className="w-12 h-12 text-brand-red-600 mx-auto mb-4" />
                <h3 className="font-bold text-slate-900 mb-2">{b.title}</h3>
                <p className="text-slate-600 text-sm">{b.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-black text-slate-900 text-center mb-12">How It Works</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {steps.map((step, i) => (
              <div key={step} className="relative">
                <div className="bg-brand-red-600 text-white w-10 h-10 rounded-full flex items-center justify-center font-black text-lg mb-4">
                  {i + 1}
                </div>
                <p className="text-slate-700 font-medium">{step}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* WOTC */}
      <section className="py-16 bg-brand-red-700 text-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-black mb-4">Work Opportunity Tax Credit (WOTC)</h2>
              <p className="text-red-100 text-lg mb-6">
                Hire candidates from target groups and receive federal tax credits up to $9,600 per employee.
              </p>
              <ul className="space-y-2 text-red-100">
                <li className="flex items-center gap-2"><CheckCircle className="w-5 h-5 text-red-200" /> Veterans</li>
                <li className="flex items-center gap-2"><CheckCircle className="w-5 h-5 text-red-200" /> SNAP recipients</li>
                <li className="flex items-center gap-2"><CheckCircle className="w-5 h-5 text-red-200" /> Former felons</li>
                <li className="flex items-center gap-2"><CheckCircle className="w-5 h-5 text-red-200" /> Long-term unemployed</li>
              </ul>
            </div>
            <div className="text-center">
              <div className="bg-white/10 backdrop-blur rounded-2xl p-8">
                <div className="text-5xl font-black mb-2">$9,600</div>
                <div className="text-red-200">Maximum tax credit per hire</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-slate-900 text-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-black mb-4">Ready to Build Your Pipeline?</h2>
          <p className="text-slate-300 text-lg mb-8">Get started with workforce solutions today.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/employer/post-job" className="bg-brand-red-600 hover:bg-brand-red-700 text-white font-bold px-8 py-4 rounded-xl transition-colors text-lg">
              Post a Job
            </Link>
            <Link href="/contact?type=employer" className="border-2 border-white text-white hover:bg-white/10 font-bold px-8 py-4 rounded-xl transition-colors text-lg">
              Contact Us
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
