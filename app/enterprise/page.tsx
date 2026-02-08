import { Metadata } from 'next';
import Link from 'next/link';
import { 
  Shield, 
  Lock, 
  FileCheck, 
  AlertTriangle,
  Building2,
  Scale,
  ClipboardCheck,
  Phone
} from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

export const metadata: Metadata = {
  title: 'Enterprise Source-Use Access | Elevate for Humanity',
  description: 'Restricted source-use access for qualified enterprises requiring internal operation of the Workforce OS under strict contractual controls.',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/enterprise',
  },
  robots: {
    index: true,
    follow: true,
  },
};

const requirements = [
  'Established enterprise with verifiable operational history',
  'Dedicated technical team for deployment and maintenance',
  'Compliance with security audit requirements',
  'Agreement to usage restrictions and audit rights',
  'Annual maintenance and security update obligations',
];

const restrictions = [
  'No resale or redistribution of source code',
  'No rebranding as competing product',
  'No credential authority transfer',
  'No sublicensing without explicit approval',
  'Mandatory security patch application within 30 days',
  'Annual compliance audit participation',
];

const includedItems = [
  'Full source code access under restricted license',
  'Deployment documentation and architecture guides',
  'Security configuration templates',
  'Initial implementation support (40 hours)',
  'Annual security updates and patches',
  'Quarterly compliance review calls',
];

export default function EnterprisePage() {
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Breadcrumbs */}
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'Enterprise Source-Use' }]} />
        </div>
      </div>

      {/* Hero - Serious, gated tone */}
      <section className="bg-slate-900 text-white py-16">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex items-center gap-3 mb-6">
            <Lock className="w-8 h-8 text-amber-400" />
            <span className="text-amber-400 font-semibold uppercase tracking-wider text-sm">
              Restricted Access
            </span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-6">
            Enterprise Source-Use Access
          </h1>
          <p className="text-xl text-slate-300 mb-8 max-w-3xl">
            Available to qualified enterprises requiring internal operation of the 
            Workforce OS under strict contractual controls. This is not a standard 
            product offering.
          </p>
          <div className="bg-amber-900/30 border border-amber-700/50 rounded-lg p-4 flex items-start gap-3">
            <AlertTriangle className="w-6 h-6 text-amber-400 flex-shrink-0 mt-0.5" />
            <p className="text-amber-200 text-sm">
              Enterprise source-use requires qualification review and legal agreement. 
              Most organizations are better served by our{' '}
              <Link href="/managed" className="underline hover:text-white">
                Managed Platform
              </Link>{' '}
              offering.
            </p>
          </div>
        </div>
      </section>

      {/* What This Is */}
      <section className="py-12 bg-white border-b">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-2xl font-bold mb-6">What This Is</h2>
          <div className="prose prose-slate max-w-none">
            <p className="text-lg text-gray-700">
              Enterprise Source-Use is a <strong>restricted license agreement</strong> that 
              grants qualified organizations the right to deploy and operate the Workforce OS 
              internally. This is fundamentally different from our Managed Platform offering.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6 mt-8">
            <div className="bg-slate-50 rounded-lg p-6">
              <Building2 className="w-8 h-8 text-slate-600 mb-3" />
              <h3 className="font-bold mb-2">You Host</h3>
              <p className="text-sm text-gray-600">
                Your infrastructure, your operations team, your responsibility.
              </p>
            </div>
            <div className="bg-slate-50 rounded-lg p-6">
              <Scale className="w-8 h-8 text-slate-600 mb-3" />
              <h3 className="font-bold mb-2">Strict Terms</h3>
              <p className="text-sm text-gray-600">
                Contractual restrictions on use, modification, and distribution.
              </p>
            </div>
            <div className="bg-slate-50 rounded-lg p-6">
              <ClipboardCheck className="w-8 h-8 text-slate-600 mb-3" />
              <h3 className="font-bold mb-2">Audit Rights</h3>
              <p className="text-sm text-gray-600">
                We retain audit rights to ensure compliance with license terms.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Qualification Requirements */}
      <section className="py-12 bg-slate-50">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-2xl font-bold mb-6">Qualification Requirements</h2>
          <p className="text-gray-600 mb-6">
            Enterprise source-use is not available to all organizations. Applicants must meet 
            the following criteria:
          </p>
          <div className="bg-white rounded-lg border p-6">
            <ul className="space-y-4">
              {requirements.map((req, index) => (
                <li key={index} className="flex items-start gap-3">
                  <Shield className="w-5 h-5 text-slate-500 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">{req}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Restrictions */}
      <section className="py-12 bg-white border-y">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-2xl font-bold mb-6">License Restrictions</h2>
          <p className="text-gray-600 mb-6">
            Source-use access is granted under strict contractual terms. The following 
            activities are explicitly prohibited:
          </p>
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <ul className="space-y-3">
              {restrictions.map((restriction, index) => (
                <li key={index} className="flex items-start gap-3">
                  <Lock className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">{restriction}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* What's Included */}
      <section className="py-12 bg-slate-50">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-2xl font-bold mb-6">What's Included</h2>
          <div className="bg-white rounded-lg border p-6">
            <ul className="space-y-3">
              {includedItems.map((item, index) => (
                <li key={index} className="flex items-start gap-3">
                  <FileCheck className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-12 bg-white border-t">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-2xl font-bold mb-6">Investment</h2>
          <div className="bg-slate-900 text-white rounded-xl p-8">
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <p className="text-slate-400 text-sm uppercase tracking-wider mb-2">
                  Initial License Fee
                </p>
                <p className="text-3xl font-bold">Starting at $75,000</p>
                <p className="text-slate-400 text-sm mt-2">
                  One-time fee, includes implementation support
                </p>
              </div>
              <div>
                <p className="text-slate-400 text-sm uppercase tracking-wider mb-2">
                  Annual Maintenance
                </p>
                <p className="text-3xl font-bold">$25,000/year</p>
                <p className="text-slate-400 text-sm mt-2">
                  Security updates, patches, compliance support
                </p>
              </div>
            </div>
            <div className="mt-8 pt-8 border-t border-slate-700">
              <p className="text-slate-400 text-sm">
                Final pricing determined after qualification review and scope assessment. 
                Custom terms available for government and large enterprise deployments.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-12 bg-slate-100">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-2xl font-bold mb-4">Request Enterprise Review</h2>
          <p className="text-gray-600 mb-8 max-w-2xl mx-auto">
            Submit your organization for qualification review. Our team will assess 
            your requirements and determine eligibility within 5 business days.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/contact?type=enterprise"
              className="bg-slate-900 text-white px-8 py-4 rounded-lg font-semibold hover:bg-slate-800 transition"
            >
              Request Enterprise Review
            </Link>
            <Link
              href="/managed"
              className="border-2 border-slate-300 text-slate-700 px-8 py-4 rounded-lg font-semibold hover:border-slate-400 transition"
            >
              Learn About Managed Platform
            </Link>
          </div>
        </div>
      </section>

      {/* Disclaimer */}
      <section className="py-8 bg-white border-t">
        <div className="max-w-4xl mx-auto px-4">
          <p className="text-xs text-gray-500 text-center">
            Enterprise Source-Use Access is subject to qualification approval and execution 
            of a binding license agreement. Elevate for Humanity reserves the right to 
            decline applications that do not meet qualification criteria. All pricing is 
            subject to change and final terms are determined during contract negotiation.
          </p>
        </div>
      </section>
      {/* CTA Section */}
      <section className="bg-blue-700 text-white py-12">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-3">Ready to Start Your Career?</h2>
          <p className="text-blue-100 mb-6">Apply today for free career training programs.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/apply"
              className="inline-flex items-center justify-center bg-white text-blue-700 px-6 py-3 rounded-lg font-bold hover:bg-gray-100 transition"
            >
              Apply Now
            </Link>
            <a
              href="/contact"
              className="inline-flex items-center justify-center gap-2 border-2 border-white text-white px-6 py-3 rounded-lg font-bold hover:bg-blue-800 transition"
            >
              <Phone className="w-4 h-4" />
              Contact Us
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
