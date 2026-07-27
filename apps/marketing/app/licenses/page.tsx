import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';

export const metadata: Metadata = {
  title: 'Platform Licensing | Elevate for Humanity',
  description:
    'Operate your organization on enterprise platforms built and managed by Elevate for Humanity. Managed LMS and restricted source-use licensing.',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/licenses',
  },
};

export default function LicensesPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero - Clean, no overlay */}
      <section className="relative h-[40vh] min-h-[300px]">
        <Image sizes="100vw"
          src="/images/pages/employer-hero.webp"
          alt="Platform Licensing"
          fill
          className="object-cover"
          priority
        />
      </section>

      {/* Header */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-6">Platform Licensing</h1>
          <p className="text-xl text-slate-700 mb-8">
            Operate your organization on enterprise platforms built and managed by Elevate for
            Humanity.
          </p>
          <p className="text-sm text-slate-600 border-l-4 border-slate-300 pl-4 text-left max-w-2xl mx-auto">
            All products are licensed access to platforms operated by Elevate for Humanity.
            Ownership of software, infrastructure, and intellectual property is not transferred.
          </p>
        </div>
      </section>

      {/* Primary License - Managed Enterprise LMS */}
      <section className="py-16 px-4 bg-slate-50">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-2xl shadow-lg p-8 md:p-12">
            <div className="inline-block bg-blue-100 text-blue-800 text-xs font-bold px-3 py-1 rounded-full mb-4">
              PRIMARY LICENSE
            </div>

            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-6">
              Managed Enterprise LMS Platform
            </h2>

            <p className="text-lg text-slate-700 mb-8">
              A subscription-based, enterprise Learning Management System operated by Elevate for
              Humanity. You manage your organization, users, and programs. We manage the platform,
              infrastructure, security, upgrades, and enforcement.
            </p>

            <h3 className="text-lg font-bold text-slate-900 mb-4">Includes</h3>
            <ul className="space-y-3 text-slate-700 mb-8">
              <li className="flex items-start gap-3">
                <span className="text-blue-600 font-bold">•</span>
                Enterprise LMS (courses, assessments, certificates)
              </li>
              <li className="flex items-start gap-3">
                <span className="text-blue-600 font-bold">•</span>
                Multi-tenant organization setup
              </li>
              <li className="flex items-start gap-3">
                <span className="text-blue-600 font-bold">•</span>
                Custom domain and branding
              </li>
              <li className="flex items-start gap-3">
                <span className="text-blue-600 font-bold">•</span>
                Fully managed hosting, security, and upgrades
              </li>
              <li className="flex items-start gap-3">
                <span className="text-blue-600 font-bold">•</span>
                Compliance-ready infrastructure
              </li>
              <li className="flex items-start gap-3">
                <span className="text-blue-600 font-bold">•</span>
                License enforcement with automatic lockout on non-payment
              </li>
            </ul>

            <h3 className="text-lg font-bold text-slate-900 mb-4">Pricing</h3>
            <div className="bg-slate-50 rounded-lg p-6 mb-8">
              <div className="space-y-2 text-slate-700">
                <p>
                  <span className="font-semibold">One-time setup:</span> $7,500–$15,000
                </p>
                <p>
                  <span className="font-semibold">Subscription:</span> $1,500–$3,500 per month
                </p>
                <p className="text-sm text-slate-600 mt-4">Annual commitment preferred</p>
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-8">
              <p className="text-amber-900 font-semibold">
                An active subscription is required for continued operation. Non-payment results in
                total platform lockout.
              </p>
            </div>

            <Link
              href="/store/licenses/starter-license"
              className="inline-block bg-blue-600 text-white px-8 py-4 rounded-lg font-bold text-lg hover:bg-blue-700 transition-colors"
            >
              Start License Setup
            </Link>
          </div>
        </div>
      </section>

      {/* Secondary License - Restricted Source-Use */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-slate-900 rounded-2xl shadow-lg p-8 md:p-12 text-white">
            <div className="inline-block bg-slate-700 text-slate-300 text-xs font-bold px-3 py-1 rounded-full mb-4">
              ENTERPRISE ONLY
            </div>

            <h2 className="text-2xl md:text-3xl font-bold mb-6">Restricted Source-Use License</h2>

            <p className="text-slate-300 mb-8">
              A restricted license granting internal use of source code only. This option exists for
              organizations that require code-level deployment and are prepared to assume
              operational responsibility.
            </p>

            <h3 className="text-lg font-bold mb-4">This license does NOT include</h3>
            <ul className="space-y-2 text-slate-400 mb-8">
              <li>• Ownership of the software</li>
              <li>• Rebranding or white-label rights</li>
              <li>• Resale or sublicensing rights</li>
              <li>• Credential or ETPL authority</li>
              <li>• Managed hosting or infrastructure</li>
              <li>• The right to represent the platform as customer-owned</li>
            </ul>

            <h3 className="text-lg font-bold mb-4">Pricing</h3>
            <div className="mb-8">
              <p className="text-2xl font-bold text-white">Starting at $75,000</p>
              <p className="text-slate-400 mt-2">Enterprise approval required. Sold selectively.</p>
            </div>

            <Link
              href="/licenses/enterprise-review"
              className="inline-block bg-white text-slate-900 px-8 py-4 rounded-lg font-bold text-lg hover:bg-slate-100 transition-colors"
            >
              Request Enterprise Review
            </Link>
          </div>
        </div>
      </section>

      {/* Clarifier */}
      <section className="py-12 px-4 bg-slate-100">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-lg font-bold text-slate-900">
            Managed licenses provide operational access.
            <br />
            Source-use licenses provide limited code access without ownership.
          </p>
        </div>
      </section>

      {/* Footer */}
      <section className="py-8 px-4 bg-slate-900 text-center">
        <p className="text-slate-400 text-sm">Powered by Elevate for Humanity</p>
      </section>
    </div>
  );
}
