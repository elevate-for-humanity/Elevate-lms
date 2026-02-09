import Link from 'next/link';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import {
  FileText,
  Download,
  Shield,
  Users,
  Briefcase,
  Building2,
  CheckCircle,
} from 'lucide-react';

export const metadata = {
  title: 'Contract Templates | Elevate for Humanity',
  description:
    'Grant-safe, audit-ready contract templates for workforce partnerships, employer agreements, and platform licensing.',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/contracts',
  },
};

export default function ContractsPage() {
  return (
    <div className="bg-white">
      {/* Hero */}
      <section className="bg-zinc-900    text-white py-20 md:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl">
            <div className="inline-block px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full text-sm font-bold mb-6">
              Legal Templates
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
              Contract Templates
            </h1>
            <p className="text-2xl text-white/90 mb-8 leading-relaxed">
              Grant-safe, audit-ready templates for workforce partnerships,
              employer agreements, and platform licensing.
            </p>
            <div className="bg-green-500/20 backdrop-blur-sm border border-green-400/30 rounded-xl p-4">
              <p className="text-sm text-green-400 font-bold">
                • WIOA/WRG-Safe | • Audit-Ready | • DWD-Approved Language
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Contract Templates */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-8">
            {/* Master Platform License Agreement */}
            <div className="bg-white rounded-3xl shadow-lg border-2 border-blue-200 p-8">
              <div className="flex items-start gap-4 mb-6">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <FileText className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-black mb-2">
                    Master Platform License Agreement
                  </h3>
                  <p className="text-sm text-black">
                    For: Nonprofits, Workforce Orgs, States, Tribal Nations
                  </p>
                </div>
              </div>

              <div className="space-y-4 mb-6">
                <div className="bg-blue-50 rounded-xl p-4">
                  <h4 className="font-bold text-black mb-2">Covers:</h4>
                  <ul className="text-sm text-black space-y-1">
                    <li>• Scope of license (platform access only)</li>
                    <li>• No sale of training or employment</li>
                    <li>• Regulatory compliance requirements</li>
                    <li>• Fee structure (admin fees only)</li>
                    <li>• Data, audits, and oversight</li>
                    <li>• Term & termination (12 months)</li>
                  </ul>
                </div>

                <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                  <p className="text-xs text-black">
                    <strong className="text-black">Grant-Safe:</strong> All
                    fees are platform licensing and administrative fees only and
                    are not tied to grant disbursement.
                  </p>
                </div>
              </div>

              <Link
                href="/contracts/master-license"
                className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold transition w-full justify-center"
              >
                <Download className="w-5 h-5" />
                View Template
              </Link>
            </div>

            {/* Workforce Partnership MOU */}
            <div className="bg-white rounded-3xl shadow-lg border-2 border-green-200 p-8">
              <div className="flex items-start gap-4 mb-6">
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Users className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-black mb-2">
                    Workforce Partnership MOU
                  </h3>
                  <p className="text-sm text-black">
                    For: WorkOne, Workforce Boards, DWD
                  </p>
                </div>
              </div>

              <div className="space-y-4 mb-6">
                <div className="bg-green-50 rounded-xl p-4">
                  <h4 className="font-bold text-black mb-2">Covers:</h4>
                  <ul className="text-sm text-black space-y-1">
                    <li>• Purpose (referrals & enrollment)</li>
                    <li>• Sponsor roles (registration, RTI, tracking)</li>
                    <li>• Partner roles (eligibility, funding)</li>
                    <li>• Funding disclaimer</li>
                    <li>• Data sharing protocols</li>
                    <li>• Term (12 months, renewable)</li>
                  </ul>
                </div>

                <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                  <p className="text-xs text-black">
                    <strong className="text-black">
                      WorkOne-Friendly:
                    </strong>{' '}
                    All funding determinations remain solely with the workforce
                    agency.
                  </p>
                </div>
              </div>

              <Link
                href="/contracts/workforce-mou"
                className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-xl font-bold transition w-full justify-center"
              >
                <Download className="w-5 h-5" />
                View Template
              </Link>
            </div>

            {/* Employer Participation Agreement */}
            <div className="bg-white rounded-3xl shadow-lg border-2 border-orange-200 p-8">
              <div className="flex items-start gap-4 mb-6">
                <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Briefcase className="w-6 h-6 text-orange-600" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-black mb-2">
                    Employer Participation Agreement
                  </h3>
                  <p className="text-sm text-black">
                    For: Barber Shops, Contractors, Businesses
                  </p>
                </div>
              </div>

              <div className="space-y-4 mb-6">
                <div className="bg-orange-50 rounded-xl p-4">
                  <h4 className="font-bold text-black mb-2">Covers:</h4>
                  <ul className="text-sm text-black space-y-1">
                    <li>• Employer responsibilities (hire, train, pay)</li>
                    <li>• Sponsor responsibilities (register, coordinate)</li>
                    <li>• Fee structure (admin fees only)</li>
                    <li>• Funding disclaimer</li>
                    <li>• Wage progression requirements</li>
                    <li>• Licensing and insurance</li>
                  </ul>
                </div>

                <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
                  <p className="text-xs text-black">
                    <strong className="text-black">Clear Terms:</strong>{' '}
                    Funding eligibility is determined by workforce agencies and
                    is not guaranteed.
                  </p>
                </div>
              </div>

              <Link
                href="/contracts/employer-agreement"
                className="inline-flex items-center gap-2 bg-orange-600 hover:bg-orange-700 text-white px-6 py-3 rounded-xl font-bold transition w-full justify-center"
              >
                <Download className="w-5 h-5" />
                View Template
              </Link>
            </div>

            {/* Data Sharing & Confidentiality */}
            <div className="bg-white rounded-3xl shadow-lg border-2 border-blue-200 p-8">
              <div className="flex items-start gap-4 mb-6">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Shield className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-black mb-2">
                    Data Sharing & Confidentiality
                  </h3>
                  <p className="text-sm text-black">
                    For: All Partners (HIPAA-style)
                  </p>
                </div>
              </div>

              <div className="space-y-4 mb-6">
                <div className="bg-blue-50 rounded-xl p-4">
                  <h4 className="font-bold text-black mb-2">Covers:</h4>
                  <ul className="text-sm text-black space-y-1">
                    <li>• Confidential information definition</li>
                    <li>• Permitted use of data</li>
                    <li>• Security safeguards</li>
                    <li>• Compliance with regulations</li>
                    <li>• Breach notification</li>
                    <li>• Data retention policies</li>
                  </ul>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                  <p className="text-xs text-black">
                    <strong className="text-black">Secure:</strong> Data may
                    be used solely for program administration, compliance,
                    reporting, and audits.
                  </p>
                </div>
              </div>

              <Link
                href="/contracts/data-sharing"
                className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold transition w-full justify-center"
              >
                <Download className="w-5 h-5" />
                View Template
              </Link>
            </div>

            {/* White-Label Branding Addendum */}
            <div className="bg-white rounded-3xl shadow-lg border-2 border-indigo-200 p-8 lg:col-span-2">
              <div className="flex items-start gap-4 mb-6">
                <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Building2 className="w-6 h-6 text-indigo-600" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-black mb-2">
                    White-Label / Branding Addendum
                  </h3>
                  <p className="text-sm text-black">
                    Optional: For Professional & Enterprise Tiers
                  </p>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6 mb-6">
                <div className="bg-indigo-50 rounded-xl p-4">
                  <h4 className="font-bold text-black mb-2">Covers:</h4>
                  <ul className="text-sm text-black space-y-1">
                    <li>• Custom branding rights (logo, colors, domain)</li>
                    <li>• No misrepresentation clause</li>
                    <li>• No claim of accreditation unless granted</li>
                    <li>• No resale without written permission</li>
                  </ul>
                </div>

                <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4">
                  <p className="text-xs text-black mb-3">
                    <strong className="text-black">Protection:</strong>{' '}
                    Licensee may use custom branding subject to restrictions on
                    misrepresentation and resale.
                  </p>
                  <p className="text-xs text-black italic">
                    Typically included with Professional and Enterprise
                    licenses.
                  </p>
                </div>
              </div>

              <Link
                href="/contracts/branding-addendum"
                className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-bold transition"
              >
                <Download className="w-5 h-5" />
                View Template
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Grant-Safe Language */}
      <section className="py-20 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="inline-block px-4 py-2 bg-green-100 text-green-700 rounded-full text-sm font-bold mb-4">
              Use This Verbatim
            </div>
            <h2 className="text-4xl font-bold text-black mb-4">
              Grant-Safe Language
            </h2>
            <p className="text-xl text-black">
              For proposals, contracts, and agreements
            </p>
          </div>

          <div className="bg-zinc-900   rounded-3xl p-8 md:p-12 border-2 border-green-200">
            <div className="bg-white rounded-2xl p-6 md:p-8 border border-green-200">
              <p className="text-lg text-black leading-relaxed italic">
                "All fees charged under this agreement are for software access,
                administrative infrastructure, and compliance support. No grant
                funds are used for wages, training delivery, or participant
                stipends unless expressly authorized by the funding agency."
              </p>
            </div>
            <div className="mt-6 flex items-start gap-3">
              <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-1" />
              <p className="text-sm text-black">
                This language protects your WIOA/WRG position and is exactly
                what auditors expect to see.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How to Use */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-black mb-4">
              How to Use These Templates
            </h2>
            <p className="text-xl text-black">
              Match the right contract to your partner type
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                partner: 'WorkOne / DWD',
                contract: 'Workforce Partnership MOU',
                color: 'green',
              },
              {
                partner: 'Licensees (Orgs/States)',
                contract: 'Master License Agreement',
                color: 'blue',
              },
              {
                partner: 'Employers',
                contract: 'Employer Participation Agreement',
                color: 'orange',
              },
              {
                partner: 'White-Label Partners',
                contract: 'Add Branding Addendum',
                color: 'indigo',
              },
            ].map((item, i) => (
              <div
                key={i}
                className={`bg-white rounded-2xl p-6 border-2 border-${item.color}-200`}
              >
                <h3 className="font-bold text-black mb-2">
                  {item.partner}
                </h3>
                <p className="text-sm text-black">→ {item.contract}</p>
              </div>
            ))}
          </div>

          <div className="mt-12 bg-blue-50 border border-blue-200 rounded-2xl p-6 text-center">
            <p className="text-black">
              <strong className="text-black">
                This structure is exactly what auditors expect.
              </strong>
            </p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-zinc-900   text-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold mb-6">Need Custom Contracts?</h2>
          <p className="text-xl mb-10 text-white/90">
            We can customize these templates for your specific state, funding
            source, or partnership structure.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/contact?topic=contracts"
              className="inline-flex items-center justify-center gap-2 bg-white text-black hover:bg-slate-100 px-10 py-5 rounded-xl font-bold text-lg transition shadow-2xl"
            >
              Contact Us
            </Link>
            <Link
              href="/pricing/sponsor-licensing"
              className="inline-flex items-center justify-center gap-2 bg-white/10 backdrop-blur-sm hover:bg-white/20 border-2 border-white text-white px-10 py-5 rounded-xl font-bold text-lg transition"
            >
              View Pricing
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
