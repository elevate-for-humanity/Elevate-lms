'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { 
  Shield, 
  ArrowRight, 
  FileText,
  Clock,
  AlertTriangle,
  ClipboardCheck,
  Calendar,
  Bell,
  Lock,
  Award,
  Users,
CheckCircle, } from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

import { createBrowserClient } from '@supabase/ssr';
const features = [
  {
    icon: ClipboardCheck,
    title: 'Automated Audit Trails',
    description: 'Every action is logged with timestamps, user IDs, and IP addresses for complete accountability.',
  },
  {
    icon: FileText,
    title: 'WIOA Compliance Reports',
    description: 'Generate PIRL-ready reports, quarterly performance summaries, and outcome tracking automatically.',
  },
  {
    icon: AlertTriangle,
    title: 'Risk Monitoring',
    description: 'Real-time alerts when compliance thresholds are at risk or documentation is missing.',
  },
  {
    icon: Calendar,
    title: 'Deadline Tracking',
    description: 'Never miss a reporting deadline with automated reminders and submission tracking.',
  },
  {
    icon: Lock,
    title: 'Data Security',
    description: 'FERPA-compliant data handling with role-based access controls and encryption.',
  },
  {
    icon: Award,
    title: 'Accreditation Support',
    description: 'Maintain documentation for ETPL, DOL apprenticeship, and state licensing requirements.',
  },
];

const complianceAreas = [
  {
    title: 'WIOA Title I',
    items: ['Adult Program', 'Dislocated Worker', 'Youth Program', 'Performance Indicators'],
  },
  {
    title: 'Apprenticeship',
    items: ['DOL Registration', 'RAPIDS Reporting', 'OJT Hours Tracking', 'RTI Documentation'],
  },
  {
    title: 'State Requirements',
    items: ['ETPL Eligibility', 'Provider Licensing', 'Outcome Reporting', 'Financial Audits'],
  },
  {
    title: 'Data Privacy',
    items: ['FERPA Compliance', 'PII Protection', 'Consent Management', 'Data Retention'],
  },
];

export default function ComplianceAutomationPage() {
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
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[
            { label: 'Store', href: '/store' }, 
            { label: 'Add-Ons', href: '/store/add-ons' },
            { label: 'Compliance Automation' }
          ]} />
        </div>
      </div>

      {/* Hero Section */}
      <section className="relative h-[50vh] min-h-48 md:h-64 flex items-center overflow-hidden">
        <Image
          src="/images/pages/store-addons-compliance-hero.jpg"
          alt="Compliance Automation"
          fill
          className="object-cover"
          priority
         sizes="100vw" />
        
      </section>

      {/* Features Grid */}
      <section id="features" className="py-16 lg:py-24">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">Compliance Made Simple</h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Automate the tedious parts of compliance so you can focus on serving students.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature) => (
              <div key={feature.title} className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm hover:shadow-lg transition-shadow">
                <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center mb-4">
                  <feature.icon className="w-6 h-6 text-emerald-600" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">{feature.title}</h3>
                <p className="text-slate-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Compliance Areas */}
      <section className="py-16">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">Comprehensive Coverage</h2>
            <p className="text-lg text-slate-600">Built for the complex compliance landscape of workforce development</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {complianceAreas.map((area) => (
              <div key={area.title} className="bg-white rounded-xl p-6 shadow-sm">
                <h3 className="text-lg font-bold text-slate-900 mb-4 pb-3 border-b">{area.title}</h3>
                <ul className="space-y-2">
                  {area.items.map((item) => (
                    <li key={item} className="flex items-center gap-2 text-sm text-slate-600">
                      <span className="text-slate-400 flex-shrink-0">•</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">How It Works</h2>
            <p className="text-lg text-slate-600">Three steps to compliance peace of mind</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-black text-emerald-600">1</span>
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Connect Your Data</h3>
              <p className="text-slate-600">
                Integrate with your existing LMS, SIS, and workforce systems. We pull data automatically.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-black text-emerald-600">2</span>
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Configure Rules</h3>
              <p className="text-slate-600">
                Set up compliance rules for your specific requirements. We include templates for common frameworks.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-black text-emerald-600">3</span>
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Automate & Monitor</h3>
              <p className="text-slate-600">
                Reports generate automatically. Get alerts when action is needed. Stay audit-ready always.
              </p>
            </div>
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
            <div className="bg-white rounded-2xl border-2 border-emerald-600 p-8 relative">
              <div className="absolute -top-3 left-6 bg-emerald-600 text-white text-xs font-bold px-3 py-1 rounded-full">BEST VALUE</div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">One-Time Payment</h3>
              <div className="text-4xl font-black text-emerald-600 mb-1">$1,297</div>
              <p className="text-sm text-slate-500 mb-6">Pay once, own it forever</p>
              <ul className="space-y-3 mb-8">
                {['Lifetime access — no recurring fees', 'Automated audit trails', 'WIOA compliance reports', 'Risk monitoring & alerts', 'FERPA-compliant data handling', 'Free updates for 12 months'].map((item) => (
                  <li key={item} className="flex items-start gap-2 text-sm text-slate-700">
                    <span className="text-emerald-500 font-bold mt-0.5">✓</span>
                    {item}
                  </li>
                ))}
              </ul>
              <Link
                href="/store/add-ons/compliance-automation/checkout"
                className="block w-full text-center bg-emerald-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-emerald-700 transition"
              >
                Purchase Now — $1,297
              </Link>
            </div>
            <div className="bg-white rounded-2xl border border-slate-200 p-8">
              <h3 className="text-xl font-bold text-slate-900 mb-2">4 Monthly Payments</h3>
              <div className="text-4xl font-black text-slate-900 mb-1">$374<span className="text-lg font-medium text-slate-500">/mo</span></div>
              <p className="text-sm text-slate-500 mb-6">4 payments of $374 ($1,496 total)</p>
              <ul className="space-y-3 mb-8">
                {['Same lifetime access', 'Automated audit trails', 'WIOA compliance reports', 'Risk monitoring & alerts', 'FERPA-compliant data handling', 'Free updates for 12 months'].map((item) => (
                  <li key={item} className="flex items-start gap-2 text-sm text-slate-700">
                    <span className="text-slate-400 font-bold mt-0.5">✓</span>
                    {item}
                  </li>
                ))}
              </ul>
              <Link
                href="/store/add-ons/compliance-automation/checkout?plan=monthly"
                className="block w-full text-center border-2 border-slate-300 text-slate-700 px-6 py-3 rounded-lg font-bold hover:bg-white transition"
              >
                Start Monthly Plan — $374/mo
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-emerald-700">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Ready to Simplify Compliance?</h2>
          <p className="text-xl text-emerald-100 mb-8">
            Purchase Compliance Automation today or talk to our team about your requirements.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="/store/add-ons/compliance-automation/checkout"
              className="inline-flex items-center gap-2 bg-white text-emerald-700 px-8 py-4 rounded-lg font-bold hover:bg-white transition"
            >
              Purchase Now — $1,297
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="/contact?product=compliance-automation"
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
