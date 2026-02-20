import { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import DemoTabs from './DemoTabs';
export const metadata: Metadata = {
  title: 'Platform Demos | Elevate for Humanity',
  description: 'Interactive demos of the admin dashboard, student portal, employer tools, and workforce board view. No signup required.',
};

export default function StoreDemosPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="bg-slate-50 border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'Platform', href: '/store' }, { label: 'Demos' }]} />
        </div>
      </div>

      {/* Hero */}
      <section className="py-10 sm:py-14">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight mb-4">
            See the Platform in Action
          </h1>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Watch narrated walkthroughs or open the live interactive demo. Every screen is clickable — search students, generate reports, review candidates.
          </p>
        </div>
      </section>

      {/* Tabbed demo section */}
      <section className="pb-16">
        <div className="max-w-6xl mx-auto px-4">
          <DemoTabs />
        </div>
      </section>

      {/* CTA */}
      <section className="py-12 bg-slate-900">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-2xl font-bold text-white mb-3">Ready to set up your own?</h2>
          <p className="text-slate-400 mb-6">
            Start a 14-day trial with your own programs and students. No credit card required.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link href="/store/trial" className="inline-flex items-center gap-2 bg-brand-red-600 text-white px-8 py-3 rounded-lg font-bold hover:bg-brand-red-700 transition">
              Start Free Trial <ArrowRight className="w-5 h-5" />
            </Link>
            <Link href="/store/licensing" className="inline-flex items-center gap-2 text-slate-300 hover:text-white px-6 py-3 rounded-lg font-semibold transition">
              Compare Licenses
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
