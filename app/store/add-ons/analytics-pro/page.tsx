'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { 
  BarChart3, 
  ArrowRight, 
  TrendingUp,
  Users,
  Target,
  PieChart,
  LineChart,
  Activity,
  Download,
  Bell,
  Zap,
CheckCircle, } from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

import { createBrowserClient } from '@supabase/ssr';
const features = [
  {
    icon: LineChart,
    title: 'Real-Time Dashboards',
    description: 'Monitor student progress, enrollment trends, and program performance with live updating dashboards.',
  },
  {
    icon: TrendingUp,
    title: 'Predictive Analytics',
    description: 'AI-powered predictions for student outcomes, dropout risk, and completion rates.',
  },
  {
    icon: PieChart,
    title: 'Custom Reports',
    description: 'Build custom reports with drag-and-drop interface. Export to PDF, Excel, or integrate with BI tools.',
  },
  {
    icon: Target,
    title: 'Goal Tracking',
    description: 'Set and track organizational KPIs with automated progress monitoring and alerts.',
  },
  {
    icon: Users,
    title: 'Cohort Analysis',
    description: 'Compare performance across cohorts, programs, funding sources, and demographics.',
  },
  {
    icon: Bell,
    title: 'Automated Alerts',
    description: 'Get notified when metrics fall below thresholds or when action is needed.',
  },
];

const useCases = [
  {
    title: 'Workforce Boards',
    description: 'Track WIOA performance metrics, generate compliance reports, and monitor provider outcomes.',
    image: '/images/pages/comp-cta-training.jpg',
  },
  {
    title: 'Training Providers',
    description: 'Monitor student progress, identify at-risk learners, and optimize program delivery.',
    image: '/images/pages/comp-cta-training.jpg',
  },
  {
    title: 'Employers',
    description: 'Track apprentice performance, measure ROI on training investments, and forecast hiring needs.',
    image: '/images/pages/comp-cta-training.jpg',
  },
];

export default function AnalyticsProPage() {
  const [dbRows, setDbRows] = useState<any[]>([]);
  useEffect(() => {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    supabase.from('products').select('*').limit(50)
      .then(({ data }) => { if (data) setDbRows(data); });
  }, []);

  return (
    <div className="min-h-screen bg-white">
      {/* Breadcrumbs */}
      <div className="bg-slate-50 border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[
            { label: 'Store', href: '/store' }, 
            { label: 'Add-Ons', href: '/store/add-ons' },
            { label: 'Analytics Pro' }
          ]} />
        </div>
      </div>

      {/* Hero Section */}
      <section className="relative h-[50vh] min-h-48 md:h-64 flex items-center overflow-hidden">
        <Image
          src="/images/pages/store-addons-analytics-hero.jpg"
          alt="Analytics Pro"
          fill
          className="object-cover"
          priority
        />
        
      </section>

      {/* Features Grid */}
      <section id="features" className="py-16 lg:py-24">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">Powerful Analytics Features</h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Everything you need to understand, predict, and improve workforce outcomes.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature) => (
              <div key={feature.title} className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm hover:shadow-lg transition-shadow">
                <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center mb-4">
                  <feature.icon className="w-6 h-6 text-indigo-600" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">{feature.title}</h3>
                <p className="text-slate-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Use Cases */}
      <section className="py-16 bg-slate-50">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">Built for Workforce Development</h2>
            <p className="text-lg text-slate-600">Analytics designed for the unique needs of workforce organizations</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {useCases.map((useCase) => (
              <div key={useCase.title} className="bg-white rounded-xl overflow-hidden shadow-sm">
                <div className="relative h-48">
                  <Image
                    src={useCase.image}
                    alt={useCase.title}
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-bold text-slate-900 mb-2">{useCase.title}</h3>
                  <p className="text-slate-600">{useCase.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-16">
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">Pricing</h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              One-time purchase. Lifetime access. No recurring fees.
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto">
            <div className="bg-white rounded-2xl border-2 border-indigo-600 p-8 relative">
              <div className="absolute -top-3 left-6 bg-indigo-600 text-white text-xs font-bold px-3 py-1 rounded-full">BEST VALUE</div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">One-Time Payment</h3>
              <div className="text-4xl font-black text-indigo-600 mb-1">$1,497</div>
              <p className="text-sm text-slate-500 mb-6">Pay once, own it forever</p>
              <ul className="space-y-3 mb-8">
                {['Lifetime access — no recurring fees', 'Real-time dashboards', 'Predictive analytics', 'Custom report builder', 'Cohort analysis', 'Free updates for 12 months'].map((item) => (
                  <li key={item} className="flex items-start gap-2 text-sm text-slate-700">
                    <span className="text-indigo-500 font-bold mt-0.5">✓</span>
                    {item}
                  </li>
                ))}
              </ul>
              <Link
                href="/store/add-ons/analytics-pro/checkout"
                className="block w-full text-center bg-indigo-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-indigo-700 transition"
              >
                Purchase Now — $1,497
              </Link>
            </div>
            <div className="bg-white rounded-2xl border border-slate-200 p-8">
              <h3 className="text-xl font-bold text-slate-900 mb-2">4 Monthly Payments</h3>
              <div className="text-4xl font-black text-slate-900 mb-1">$424<span className="text-lg font-medium text-slate-500">/mo</span></div>
              <p className="text-sm text-slate-500 mb-6">4 payments of $424 ($1,696 total)</p>
              <ul className="space-y-3 mb-8">
                {['Same lifetime access', 'Real-time dashboards', 'Predictive analytics', 'Custom report builder', 'Cohort analysis', 'Free updates for 12 months'].map((item) => (
                  <li key={item} className="flex items-start gap-2 text-sm text-slate-700">
                    <span className="text-slate-400 font-bold mt-0.5">✓</span>
                    {item}
                  </li>
                ))}
              </ul>
              <Link
                href="/store/add-ons/analytics-pro/checkout?plan=monthly"
                className="block w-full text-center border-2 border-slate-300 text-slate-700 px-6 py-3 rounded-lg font-bold hover:bg-slate-50 transition"
              >
                Start Monthly Plan — $424/mo
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-indigo-700">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Ready to Unlock Your Data?</h2>
          <p className="text-xl text-indigo-100 mb-8">
            Purchase Analytics Pro today or schedule a demo to see it in action.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="/store/add-ons/analytics-pro/checkout"
              className="inline-flex items-center gap-2 bg-white text-indigo-700 px-8 py-4 rounded-lg font-bold hover:bg-gray-100 transition"
            >
              Purchase Now — $1,497
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="/contact?product=analytics-pro"
              className="inline-flex items-center gap-2 border-2 border-white text-white px-8 py-4 rounded-lg font-bold hover:bg-white/10 transition"
            >
              Talk to Sales
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
