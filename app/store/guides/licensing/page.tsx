import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import Link from 'next/link';
import { ArrowRight, AlertTriangle } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Licensing Guide | Elevate LMS Platform',
  description: 'Step-by-step guide to licensing the Elevate LMS platform. Understand managed vs source-use options, setup process, and billing.',
};

const MASTER_STATEMENT = `All platform products are licensed access to systems operated by Elevate for Humanity. Ownership of software, infrastructure, and intellectual property is not transferred.`;

export default function LicensingGuidePage() {
  return (
    <div className="min-h-screen bg-white">
            <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: "Store", href: "/store" }, { label: "Licensing" }]} />
      </div>
{/* Header */}
      <section className="bg-white text-slate-900 py-16">
        <div className="max-w-4xl mx-auto px-4">
          <h1 className="text-4xl font-black mb-4">Licensing Guide</h1>
          <p className="text-xl text-slate-700">
            Everything you need to know about licensing the Elevate LMS platform.
          </p>
        </div>
      </section>

      {/* Content */}
      <section className="py-12 px-4">
        <div className="max-w-4xl mx-auto prose prose-slate prose-lg">
          
          {/* Step 1 */}
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
              <span className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">1</span>
              Choose Your License Type
            </h2>
            <div className="mt-4 grid md:grid-cols-2 gap-6">
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
                <h3 className="font-bold text-blue-900 mb-2">Managed Platform (Recommended)</h3>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Setup: $7,500–$15,000</li>
                  <li>• Monthly: $1,500–$3,500</li>
                  <li>• We handle hosting, security, updates</li>
                  <li>• Self-service checkout available</li>
                </ul>
                <Link href="/store/licenses/managed" className="inline-block mt-4 text-blue-600 font-medium hover:underline">
                  View Managed License →
                </Link>
              </div>
              <div className="bg-slate-100 border border-slate-200 rounded-xl p-6">
                <h3 className="font-bold text-slate-900 mb-2">Source-Use (Enterprise Only)</h3>
                <ul className="text-sm text-slate-600 space-y-1">
                  <li>• Starting at $75,000</li>
                  <li>• Requires enterprise approval</li>
                  <li>• Internal use only, no resale</li>
                  <li>• You assume operational responsibility</li>
                </ul>
                <Link href="/store/licenses/source-use" className="inline-block mt-4 text-slate-600 font-medium hover:underline">
                  View Source-Use License →
                </Link>
              </div>
            </div>
          </div>

          {/* Step 2 */}
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
              <span className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">2</span>
              Complete Checkout (Managed Only)
            </h2>
            <p className="text-slate-600 mt-4">
              For managed licenses, checkout is self-service. You'll pay the setup fee and first month's subscription via Stripe. No sales call required.
            </p>
            <ul className="mt-4 space-y-2">
              <li className="flex items-start gap-2">
                <span className="text-slate-400 flex-shrink-0">•</span>
                <span>Enter organization details</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-slate-400 flex-shrink-0">•</span>
                <span>Accept license agreement</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-slate-400 flex-shrink-0">•</span>
                <span>Complete payment</span>
              </li>
            </ul>
          </div>

          {/* Step 3 */}
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
              <span className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">3</span>
              Tenant Provisioning
            </h2>
            <p className="text-slate-600 mt-4">
              After payment, we provision your dedicated organization space within 24 hours. You'll receive:
            </p>
            <ul className="mt-4 space-y-2">
              <li className="flex items-start gap-2">
                <span className="text-slate-400 flex-shrink-0">•</span>
                <span>Admin account credentials</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-slate-400 flex-shrink-0">•</span>
                <span>Organization subdomain (yourorg.elevateforhumanity.org)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-slate-400 flex-shrink-0">•</span>
                <span>Onboarding checklist</span>
              </li>
            </ul>
          </div>

          {/* Step 4 */}
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
              <span className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">4</span>
              Invite Team & Assign Roles
            </h2>
            <p className="text-slate-600 mt-4">
              Add your team members and assign appropriate roles:
            </p>
            <ul className="mt-4 space-y-2">
              <li><strong>Admin:</strong> Full platform access, user management, settings</li>
              <li><strong>Instructor:</strong> Course creation, grading, student management</li>
              <li><strong>Staff:</strong> Limited admin access, enrollment management</li>
            </ul>
          </div>

          {/* Step 5 */}
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
              <span className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">5</span>
              Add Programs & Content
            </h2>
            <p className="text-slate-600 mt-4">
              Set up your training programs, courses, and content. You can:
            </p>
            <ul className="mt-4 space-y-2">
              <li className="flex items-start gap-2">
                <span className="text-slate-400 flex-shrink-0">•</span>
                <span>Create courses from scratch</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-slate-400 flex-shrink-0">•</span>
                <span>Import existing content (SCORM, video, documents)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-slate-400 flex-shrink-0">•</span>
                <span>Use our course templates</span>
              </li>
            </ul>
          </div>

          {/* Step 6 */}
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
              <span className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">6</span>
              Domain Options
            </h2>
            <p className="text-slate-600 mt-4">
              Choose how users access your platform:
            </p>
            <div className="mt-4 space-y-4">
              <div className="bg-slate-50 p-4 rounded-lg">
                <h4 className="font-bold text-slate-900">Default: Subdomain</h4>
                <p className="text-sm text-slate-600">yourorg.elevateforhumanity.org — No setup required, works immediately.</p>
              </div>
              <div className="bg-slate-50 p-4 rounded-lg">
                <h4 className="font-bold text-slate-900">Optional: Custom Domain</h4>
                <p className="text-sm text-slate-600">lms.yourcompany.com — Requires DNS configuration. We provide instructions.</p>
              </div>
            </div>
          </div>

          {/* Step 7 - Billing & Enforcement */}
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
              <span className="w-8 h-8 bg-amber-600 text-slate-900 rounded-full flex items-center justify-center text-sm font-bold">7</span>
              Billing & Enforcement
            </h2>
            <div className="mt-4 bg-amber-50 border border-amber-200 rounded-xl p-6">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-6 h-6 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-amber-900">Payment Enforcement Policy</h4>
                  <p className="text-amber-800 mt-2">
                    An active subscription is required for continued platform operation. 
                    Non-payment results in automatic platform lockout. This is not negotiable.
                  </p>
                  <ul className="mt-4 text-sm text-amber-800 space-y-1">
                    <li>• Invoices are sent monthly via Stripe</li>
                    <li>• 7-day grace period after failed payment</li>
                    <li>• Platform access suspended after grace period</li>
                    <li>• Data retained for 30 days after suspension</li>
                    <li>• Reactivation requires payment of outstanding balance</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Step 8 */}
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
              <span className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">8</span>
              Support & SLA
            </h2>
            <p className="text-slate-600 mt-4">
              All managed licenses include:
            </p>
            <ul className="mt-4 space-y-2">
              <li className="flex items-start gap-2">
                <span className="text-slate-400 flex-shrink-0">•</span>
                <span>Email support (24-48 hour response)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-slate-400 flex-shrink-0">•</span>
                <span>99.9% uptime SLA</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-slate-400 flex-shrink-0">•</span>
                <span>Automatic security updates</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-slate-400 flex-shrink-0">•</span>
                <span>Daily backups</span>
              </li>
            </ul>
          </div>

        </div>
      </section>

      {/* Master Statement */}
      <section className="py-8 px-4 bg-slate-100">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-sm text-slate-600 italic">{MASTER_STATEMENT}</p>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-4 bg-blue-600 text-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-black mb-4">Ready to Get Started?</h2>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/store/demo" className="inline-flex items-center justify-center gap-2 bg-white text-blue-600 px-8 py-4 rounded-lg font-bold text-lg hover:bg-blue-50">
              Try Demo First
            </Link>
            <Link href="/store/licenses/managed" className="inline-flex items-center justify-center gap-2 bg-blue-800 text-slate-900 px-8 py-4 rounded-lg font-bold text-lg hover:bg-blue-900">
              Start License Setup <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
