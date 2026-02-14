import { Metadata } from 'next';
import Link from 'next/link';
import { Shield, Clock, FileCheck, Building2, Users, ArrowRight } from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

export const metadata: Metadata = {
  title: 'White-Label Workforce Platform | Elevate for Humanity',
  description: 'Deploy a compliant workforce platform in weeks, not years. Built for training providers and workforce agencies.',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/platform/licensing',
  },
};

export default function PlatformLicensingPage() {
  return (
    <div className="min-h-screen bg-white">
      <Breadcrumbs
        items={[
          { label: 'Platform', href: '/platform' },
          { label: 'Licensing' },
        ]}
      />
      <div className="max-w-7xl mx-auto px-4 pb-2">
        <p className="text-sm text-slate-600 font-medium">Part of the <a href="/platform" className="text-brand-red-600 hover:underline">Elevate Workforce Operating System</a></p>
      </div>
      {/* Hero - Above the fold */}
      <section className="bg-slate-900 text-white py-24 lg:py-32">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <div className="inline-block px-4 py-1.5 bg-blue-600/20 border border-blue-500/30 rounded-full text-blue-300 text-sm font-medium mb-6">
            White-Label Workforce Platform
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-black mb-6 leading-tight">
            Deploy a compliant workforce platform in weeks, not years.
          </h1>
          <p className="text-xl text-slate-300 mb-10 max-w-2xl mx-auto">
            Infrastructure for training providers and workforce agencies who need 
            enrollment, funding logic, reporting, and portals—without building from scratch.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/platform/licensing/request"
              className="inline-flex items-center justify-center gap-2 bg-blue-600 text-white px-8 py-4 rounded-lg text-lg font-bold hover:bg-blue-700 transition"
            >
              Request Licensing Brief
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="/contact?subject=platform-demo"
              className="inline-flex items-center justify-center gap-2 bg-white/10 text-white px-8 py-4 rounded-lg text-lg font-medium hover:bg-white/20 transition border border-white/20"
            >
              Schedule Technical Walkthrough
            </Link>
          </div>
        </div>
      </section>

      {/* Who It's For */}
      <section className="py-20 bg-white">
        <div className="max-w-5xl mx-auto px-6">
          <h2 className="text-3xl font-black text-gray-900 mb-4 text-center">
            Built for Institutional Buyers
          </h2>
          <p className="text-lg text-gray-600 text-center mb-12 max-w-2xl mx-auto">
            This is not a consumer product. It's infrastructure for organizations 
            that operate funded workforce programs.
          </p>
          
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-slate-50 rounded-xl p-8 border border-slate-200">
              <div className="w-12 h-12 bg-brand-blue-100 rounded-lg flex items-center justify-center mb-4">
                <Building2 className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Training Providers</h3>
              <ul className="space-y-2 text-gray-600">
                <li>• Career and technical schools</li>
                <li>• Community colleges with workforce programs</li>
                <li>• Apprenticeship sponsors</li>
                <li>• ETPL-listed providers</li>
              </ul>
            </div>
            
            <div className="bg-slate-50 rounded-xl p-8 border border-slate-200">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                <Users className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Workforce Agencies</h3>
              <ul className="space-y-2 text-gray-600">
                <li>• Workforce development boards</li>
                <li>• State workforce agencies</li>
                <li>• Regional workforce partnerships</li>
                <li>• WIOA grant administrators</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* What's Included */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-5xl mx-auto px-6">
          <h2 className="text-3xl font-black text-gray-900 mb-12 text-center">
            What's Included
          </h2>
          
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: FileCheck,
                title: 'Enrollment & Eligibility',
                items: ['WIOA eligibility screening', 'Document collection', 'E-signatures', 'Automated workflows'],
              },
              {
                icon: Shield,
                title: 'Compliance & Reporting',
                items: ['WIOA/WRG reporting', 'Apprenticeship hour tracking', 'Audit-ready records', 'Outcome documentation'],
              },
              {
                icon: Users,
                title: 'Multi-Portal System',
                items: ['Student portal', 'Employer portal', 'Staff/admin portal', 'Partner portal'],
              },
            ].map((feature, idx) => (
              <div key={idx} className="bg-white rounded-xl p-6 border border-slate-200">
                <div className="w-10 h-10 bg-brand-blue-100 rounded-lg flex items-center justify-center mb-4">
                  <feature.icon className="w-5 h-5 text-blue-600" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-3">{feature.title}</h3>
                <ul className="space-y-1.5 text-sm text-gray-600">
                  {feature.items.map((item, i) => (
                    <li key={i}>• {item}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          
          <div className="mt-8 grid md:grid-cols-3 gap-6">
            {[
              {
                icon: Clock,
                title: 'LMS & Training Delivery',
                items: ['Course management', 'Progress tracking', 'Certificates', 'SCORM support'],
              },
              {
                icon: Building2,
                title: 'Funding Integration',
                items: ['Grant tracking', 'Cost allocation', 'Invoice generation', 'Payment processing'],
              },
              {
                icon: Shield,
                title: 'Your Branding',
                items: ['Custom domain', 'Logo & colors', 'Email templates', 'White-labeled portals'],
              },
            ].map((feature, idx) => (
              <div key={idx} className="bg-white rounded-xl p-6 border border-slate-200">
                <div className="w-10 h-10 bg-brand-blue-100 rounded-lg flex items-center justify-center mb-4">
                  <feature.icon className="w-5 h-5 text-blue-600" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-3">{feature.title}</h3>
                <ul className="space-y-1.5 text-sm text-gray-600">
                  {feature.items.map((item, i) => (
                    <li key={i}>• {item}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How Licensing Works */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-6">
          <h2 className="text-3xl font-black text-gray-900 mb-12 text-center">
            How Licensing Works
          </h2>
          
          <div className="space-y-8">
            {[
              {
                step: '1',
                title: 'Request Licensing Brief',
                description: 'Tell us about your organization, student volume, and compliance requirements. We will send a detailed brief within 48 hours.',
              },
              {
                step: '2',
                title: 'Technical Walkthrough',
                description: 'Schedule a call to review the platform, discuss customization needs, and scope the deployment.',
              },
              {
                step: '3',
                title: 'Deploy',
                description: 'We configure your instance, migrate any existing data, and train your team. Most deployments complete in 4-8 weeks.',
              },
            ].map((item, idx) => (
              <div key={idx} className="flex gap-6">
                <div className="flex-shrink-0 w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-lg">
                  {item.step}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{item.title}</h3>
                  <p className="text-gray-600">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-slate-900 text-white">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-black mb-6">
            Ready to deploy workforce infrastructure?
          </h2>
          <p className="text-lg text-slate-300 mb-8">
            Request a licensing brief to get started. No sales pitch—just the details you need to evaluate fit.
          </p>
          <Link
            href="/platform/licensing/request"
            className="inline-flex items-center justify-center gap-2 bg-blue-600 text-white px-8 py-4 rounded-lg text-lg font-bold hover:bg-blue-700 transition"
          >
            Request Licensing Brief
            <ArrowRight className="w-5 h-5" />
          </Link>
          <p className="mt-6 text-sm text-slate-400">
            Or email directly: <a href="mailto:elevate4humanityedu@gmail.com" className="underline">elevate4humanityedu@gmail.com</a>
          </p>
        </div>
      </section>
    </div>
  );
}
