import { createClient } from '@/lib/supabase/server';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import Link from 'next/link';
import {
  Check,
  CheckCircle,
  XCircle,
  Users,
  Shield,
  Clock,
  DollarSign,
  FileText,
  AlertCircle,
} from 'lucide-react';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Program Holders | Elevate Workforce OS',
  description:
    'Bring your training programs under the Elevate umbrella. Use our ETPL, RAPIDS, WIOA credentials via MOU. Part of the Elevate Workforce Operating System.',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/platform/program-holders',
  },
};

export default async function ProgramHolderLicensePage() {
  const supabase = await createClient();

  if (!supabase) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Service Unavailable</h1>
          <p className="text-gray-600">Please try again later.</p>
        </div>
      </div>
    );
  }
  
  // Fetch program holder pricing
  const { data: pricing } = await supabase
    .from('pricing_plans')
    .select('*')
    .eq('type', 'program_holder');

  return (
    <div className="bg-white">
            <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: "Platform", href: "/platform" }, { label: "Program Holders" }]} />
        <p className="text-sm text-slate-600 mt-1">Part of the <a href="/platform" className="text-brand-red-600 font-medium hover:underline">Elevate Workforce Operating System</a>. <a href="/store/licenses" className="hover:underline">View pricing →</a></p>
      </div>
{/* Hero */}
      <section className="bg-zinc-900    text-white py-20">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <div className="inline-block px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full text-sm font-bold mb-6">
            🤝 MOU-Based Partnership
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            Join Our Program Holder Network
          </h1>
          <p className="text-xl text-white/90 mb-8">
            Bring your training programs under our umbrella.
            <br />
            Use our government credentials. Launch in 30 days.
          </p>
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6 mb-8">
            <div className="grid md:grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-3xl font-bold mb-1">30 Days</div>
                <div className="text-sm text-white/80">To Launch</div>
              </div>
              <div>
                <div className="text-3xl font-bold mb-1">$650K</div>
                <div className="text-sm text-white/80">Credential Value</div>
              </div>
              <div>
                <div className="text-3xl font-bold mb-1">4-8 Years</div>
                <div className="text-sm text-white/80">Time Saved</div>
              </div>
            </div>
          </div>
          <Link
            href="/apply/program-holder"
            className="inline-block bg-white text-brand-blue-600 px-8 py-4 rounded-lg font-bold text-lg hover:bg-gray-100 transition"
          >
            Apply to Join Network →
          </Link>
        </div>
      </section>

      {/* Credentials Included */}
      <section className="py-16 bg-slate-50">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-black mb-4">
              Operate Under OUR Credentials
            </h2>
            <p className="text-xl text-black">
              We already have the approvals. You use them via MOU.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl p-6 shadow-lg">
              <div className="text-4xl mb-4">🇺🇸</div>
              <h3 className="text-xl font-bold mb-3">Federal Approvals</h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="font-semibold">
                      DOL Registered Apprenticeship Sponsor
                    </div>
                    <div className="text-black">
                      RAPIDS ID: 2025-IN-132301
                    </div>
                    <a
                      href="https://www.apprenticeship.gov"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-brand-blue-600 hover:underline text-xs"
                    >
                      Verify on apprenticeship.gov →
                    </a>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="font-semibold">
                      WIOA Eligible Training Provider
                    </div>
                    <div className="text-black">
                      Federal workforce funding approved
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-lg">
              <div className="text-4xl mb-4">🏛️</div>
              <h3 className="text-xl font-bold mb-3">
                Indiana State Approvals
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="font-semibold">ETPL Listed Provider</div>
                    <div className="text-black">Provider ID: 10000949</div>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="font-semibold">Indiana DWD Approved</div>
                    <div className="text-black">
                      INTraining Location ID: 10004621
                    </div>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="font-semibold">
                      Workforce Ready Grant (WRG) Approved
                    </div>
                    <div className="text-black">
                      Free state funding for students
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-lg">
              <div className="text-4xl mb-4">🤝</div>
              <h3 className="text-xl font-bold mb-3">Official Partnerships</h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div className="font-semibold">
                    Justice Reinvestment Initiative (JRI) Partner
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div className="font-semibold">
                    WorkOne Centers Approved Provider
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div className="font-semibold">SNAP E&T Partner</div>
                </div>
              </div>
            </div>

            <div className="bg-zinc-900   rounded-xl p-6 shadow-lg text-white">
              <div className="text-4xl mb-4">
                <DollarSign className="w-5 h-5 inline-block" />
              </div>
              <h3 className="text-xl font-bold mb-3">Total Value</h3>
              <div className="text-3xl font-bold mb-2">$300K - $650K</div>
              <div className="text-white/90 text-sm mb-4">
                + 4-8 years saved getting these approvals yourself
              </div>
              <div className="text-sm">
                You get immediate access to all of these via MOU.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-black mb-4">
              How It Works
            </h2>
            <p className="text-xl text-black">
              Simple process. Clear requirements. Fast approval.
            </p>
          </div>

          <div className="space-y-6">
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-12 h-12 bg-brand-blue-100 rounded-full flex items-center justify-center font-bold text-brand-blue-600">
                1
              </div>
              <div>
                <h3 className="text-xl font-bold text-black mb-2">
                  Submit Application
                </h3>
                <p className="text-black">
                  Tell us about your organization, programs, and experience.
                  Takes 15-20 minutes.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 w-12 h-12 bg-brand-blue-100 rounded-full flex items-center justify-center font-bold text-brand-blue-600">
                2
              </div>
              <div>
                <h3 className="text-xl font-bold text-black mb-2">
                  We Review (2-3 Days)
                </h3>
                <p className="text-black">
                  We check references, verify compliance history, and assess
                  program fit.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 w-12 h-12 bg-brand-blue-100 rounded-full flex items-center justify-center font-bold text-brand-blue-600">
                3
              </div>
              <div>
                <h3 className="text-xl font-bold text-black mb-2">
                  Sign MOU
                </h3>
                <p className="text-black">
                  If approved, we generate your MOU. Review and sign
                  electronically.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 w-12 h-12 bg-brand-blue-100 rounded-full flex items-center justify-center font-bold text-brand-blue-600">
                4
              </div>
              <div>
                <h3 className="text-xl font-bold text-black mb-2">
                  Setup Payment
                </h3>
                <p className="text-black">
                  Set up your monthly license fee. First payment includes setup
                  fee.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 w-12 h-12 bg-green-100 rounded-full flex items-center justify-center font-bold text-green-600">
                5
              </div>
              <div>
                <h3 className="text-xl font-bold text-black mb-2">
                  Launch in 30 Days
                </h3>
                <p className="text-black">
                  Platform access granted. Onboarding scheduled. Start serving
                  students.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-16 bg-slate-50">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-black mb-4">Pricing</h2>
            <p className="text-xl text-black">
              Based on your student volume. All credentials included.
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-6">
            <div className="bg-white rounded-xl p-6 shadow-lg">
              <div className="text-sm font-bold text-black mb-2">SMALL</div>
              <div className="text-3xl font-bold text-black mb-1">
                $4,000
              </div>
              <div className="text-sm text-black mb-4">/month</div>
              <div className="text-sm text-black mb-4">
                Up to 500 students
              </div>
              <div className="text-xs text-slate-500">Setup: $15,000</div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-lg border-2 border-brand-blue-500">
              <div className="text-sm font-bold text-brand-blue-600 mb-2">MEDIUM</div>
              <div className="text-3xl font-bold text-black mb-1">
                $8,000
              </div>
              <div className="text-sm text-black mb-4">/month</div>
              <div className="text-sm text-black mb-4">
                Up to 2,500 students
              </div>
              <div className="text-xs text-slate-500">Setup: $25,000</div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-lg">
              <div className="text-sm font-bold text-black mb-2">LARGE</div>
              <div className="text-3xl font-bold text-black mb-1">
                $16,000
              </div>
              <div className="text-sm text-black mb-4">/month</div>
              <div className="text-sm text-black mb-4">
                Up to 10,000 students
              </div>
              <div className="text-xs text-slate-500">Setup: $35,000</div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-lg">
              <div className="text-sm font-bold text-black mb-2">
                ENTERPRISE
              </div>
              <div className="text-3xl font-bold text-black mb-1">
                $30,000
              </div>
              <div className="text-sm text-black mb-4">/month</div>
              <div className="text-sm text-black mb-4">
                Unlimited students
              </div>
              <div className="text-xs text-slate-500">Setup: $50,000</div>
            </div>
          </div>
        </div>
      </section>

      {/* Requirements */}
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-black mb-4">
              Requirements
            </h2>
            <p className="text-xl text-black">
              Not everyone qualifies. We protect our credentials.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-green-50 rounded-xl p-6 border-2 border-green-200">
              <h3 className="text-lg font-bold text-green-900 mb-4 flex items-center gap-2">
                <Check className="w-5 h-5" />
                Must Have
              </h3>
              <ul className="space-y-2 text-sm text-green-800">
                <li>
                  <CheckCircle className="w-5 h-5 inline-block" /> Located in
                  Indiana (for now - expanding soon)
                </li>
                <li>
                  <CheckCircle className="w-5 h-5 inline-block" /> Clean
                  compliance history
                </li>
                <li>
                  <CheckCircle className="w-5 h-5 inline-block" /> Quality
                  training programs
                </li>
                <li>
                  <CheckCircle className="w-5 h-5 inline-block" /> Professional
                  references
                </li>
                <li>
                  <CheckCircle className="w-5 h-5 inline-block" /> Financial
                  stability
                </li>
                <li>
                  <CheckCircle className="w-5 h-5 inline-block" /> Programs
                  align with our approvals
                </li>
              </ul>
            </div>

            <div className="bg-red-50 rounded-xl p-6 border-2 border-red-200">
              <h3 className="text-lg font-bold text-red-900 mb-4 flex items-center gap-2">
                <AlertCircle className="w-5 h-5" />
                Auto-Reject
              </h3>
              <ul className="space-y-2 text-sm text-red-800">
                <li>
                  <XCircle className="w-5 h-5 inline-block" /> Previous
                  compliance violations
                </li>
                <li>
                  <XCircle className="w-5 h-5 inline-block" /> Bad references
                </li>
                <li>
                  <XCircle className="w-5 h-5 inline-block" /> Programs don't
                  fit our approvals
                </li>
                <li>
                  <XCircle className="w-5 h-5 inline-block" /> Financial
                  instability
                </li>
                <li>
                  <XCircle className="w-5 h-5 inline-block" /> Located outside
                  Indiana (until we expand)
                </li>
                <li>
                  <XCircle className="w-5 h-5 inline-block" /> Incomplete
                  application
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-zinc-900   text-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">
            Ready to Join Our Network?
          </h2>
          <p className="text-xl text-white/90 mb-8">
            Application takes 15-20 minutes. Decision in 2-3 days.
          </p>
          <Link
            href="/apply/program-holder"
            className="inline-block bg-white text-brand-blue-600 px-8 py-4 rounded-lg font-bold text-lg hover:bg-gray-100 transition"
          >
            Apply Now →
          </Link>
          <p className="mt-6 text-white/80 text-sm">
            Questions? Email us at info@elevateforhumanity.org or call (317)
            314-3757
          </p>
        </div>
      </section>
    </div>
  );
}
