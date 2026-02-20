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
      <div className="bg-slate-50 border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[
            { label: 'Store', href: '/store' }, 
            { label: 'Add-Ons', href: '/store/add-ons' },
            { label: 'Compliance Automation' }
          ]} />
        </div>
      </div>

      {/* Hero Section */}
      <section className="relative h-[50vh] min-h-[400px] flex items-center overflow-hidden">
        <Image
          src="/images/heroes-hq/funding-hero.jpg"
          alt="Compliance Automation"
          fill
          className="object-cover"
          priority quality={90}
        />
        
        <div className="relative z-10 max-w-6xl mx-auto px-4 w-full">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center">
              <Shield className="w-6 h-6 text-slate-900" />
            </div>
            <span className="text-emerald-200 font-medium">Platform Add-On</span>
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-slate-900 mb-4">
            Compliance Automation
          </h1>
          <p className="text-xl text-emerald-100 max-w-2xl mb-6">
            Automate WIOA reporting, audit preparation, and compliance tracking. 
            Reduce administrative burden while maintaining perfect documentation.
          </p>
          <div className="flex flex-wrap gap-4">
            <Link 
              href="/contact?product=compliance-automation"
              className="inline-flex items-center gap-2 bg-white text-emerald-700 px-6 py-3 rounded-lg font-semibold hover:bg-emerald-50 transition-colors"
            >
              Request Demo
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link 
              href="#features"
              className="inline-flex items-center gap-2 border-2 border-white text-slate-900 px-6 py-3 rounded-lg font-semibold hover:bg-white/10 transition-colors"
            >
              View Features
            </Link>
          </div>
        </div>
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
      <section className="py-16 bg-slate-50">
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
      <section className="py-16 bg-slate-50">
        <div className="max-w-4xl mx-auto px-4">
          <div className="bg-slate-100 rounded-2xl p-8 md:p-12 text-slate-900 text-center">
            <h2 className="text-3xl font-bold mb-4">Enterprise Pricing</h2>
            <p className="text-xl text-emerald-100 mb-8 max-w-2xl mx-auto">
              Compliance Automation is available as an add-on to Enterprise licenses. 
              Pricing is based on organization size and compliance requirements.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link
                href="/contact?product=compliance-automation"
                className="inline-flex items-center gap-2 bg-white text-emerald-600 px-8 py-4 rounded-lg font-semibold hover:bg-emerald-50 transition-colors"
              >
                Request Pricing
              </Link>
              <Link
                href="/store/add-ons"
                className="inline-flex items-center gap-2 border-2 border-white text-slate-900 px-8 py-4 rounded-lg font-semibold hover:bg-white/10 transition-colors"
              >
                View All Add-Ons
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-slate-900 mb-4">Ready to Simplify Compliance?</h2>
          <p className="text-xl text-slate-700 mb-8">
            Schedule a demo to see how Compliance Automation can reduce your administrative burden.
          </p>
          <Link
            href="/contact?product=compliance-automation&demo=true"
            className="inline-flex items-center gap-2 bg-emerald-600 text-slate-900 px-8 py-4 rounded-lg font-semibold hover:bg-emerald-700 transition-colors"
          >
            Schedule Demo
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>
    </div>
  );
}
