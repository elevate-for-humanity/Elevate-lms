import Image from 'next/image';
import { Metadata } from 'next';
import Link from 'next/link';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import {
  Circle,
  Users,
  Award,
  TrendingUp,
  FileText,
  Clock,
  ArrowRight,
  Phone,
} from 'lucide-react';

export const metadata: Metadata = {
  title:
    'SNAP E&T Partner | Career Pathway Execution Partner | Elevate for Humanity',
  description:
    'ETPL-approved, WIOA-aligned training provider for SNAP E&T participants. 80-hour compliance tracking, work-based learning, apprenticeships, and credentialed pathways. Indiana FSSA and WorkOne partner.',
  keywords: [
    'SNAP E&T partner',
    'SNAP employment and training',
    'WIOA SNAP alignment',
    'career pathway execution',
    'ETPL provider',
    'SNAP E&T third party',
    'workforce development SNAP',
    'Indiana FSSA partner',
    'WorkOne partner',
  ],
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/snap-et-partner',
  },
};

export default function SNAPETPartnerPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Breadcrumbs */}
      <div className="bg-slate-50 border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'Funding', href: '/funding' }, { label: 'SNAP E&T Partner' }]} />
        </div>
      </div>

      {/* Hero */}
      <section className="bg-brand-blue-900 text-white py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="max-w-4xl">
            <div className="inline-block bg-yellow-400 text-brand-blue-900 px-6 py-3 rounded-full font-bold text-sm mb-6">
              DOL-USDA ALIGNED PROVIDER
            </div>
            <h1 className="text-5xl md:text-6xl font-bold mb-6">
              SNAP E&T Career Pathway Execution Partner
            </h1>
            <p className="text-2xl text-brand-blue-100 mb-8">
              ETPL-approved, WIOA-aligned training provider ready to serve SNAP
              E&T participants with credentialed pathways, 80-hour compliance
              tracking, and verified outcomes.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href="#capabilities"
                className="inline-block px-8 py-4 bg-yellow-400 text-brand-blue-900 font-bold rounded-lg hover:bg-yellow-300 transition text-lg text-center"
              >
                View Capabilities
              </Link>
              <a
                href="/support"
                className="inline-block px-8 py-4 bg-white/10 text-white font-bold rounded-lg hover:bg-white/20 transition text-lg border-2 border-white text-center"
              >
                Partner Inquiry: support center
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Why EFH is Positioned */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">
              Why Elevate for Humanity is Positioned
            </h2>
            <p className="text-xl text-black">
              We already operate like a federal contractor with proven
              compliance infrastructure
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white rounded-xl p-8 shadow-lg">
              <div className="w-16 h-16 bg-brand-green-100 rounded-full flex items-center justify-center mb-4">
                <Image src="/images/icons/award.png" alt="Icon" width={32} height={32} className="w-8 h-8 text-brand-green-600" />
              </div>
              <h3 className="text-xl font-bold mb-3">Already Approved</h3>
              <ul className="space-y-2 text-sm text-black">
                <li className="flex items-start gap-2">
                  <Circle className="w-4 h-4 text-brand-green-600 flex-shrink-0 mt-0.5" />
                  <span>ETPL programs (WIOA eligible)</span>
                </li>
                <li className="flex items-start gap-2">
                  <Circle className="w-4 h-4 text-brand-green-600 flex-shrink-0 mt-0.5" />
                  <span>DOL Registered Apprenticeship Sponsor</span>
                </li>
                <li className="flex items-start gap-2">
                  <Circle className="w-4 h-4 text-brand-green-600 flex-shrink-0 mt-0.5" />
                  <span>DWD INTraining Location ID: 10004621</span>
                </li>
                <li className="flex items-start gap-2">
                  <Circle className="w-4 h-4 text-brand-green-600 flex-shrink-0 mt-0.5" />
                  <span>WRG approved programs</span>
                </li>
                <li className="flex items-start gap-2">
                  <Circle className="w-4 h-4 text-brand-green-600 flex-shrink-0 mt-0.5" />
                  <span>JRI partner (justice-involved)</span>
                </li>
              </ul>
            </div>

            <div className="bg-white rounded-xl p-8 shadow-lg">
              <div className="w-16 h-16 bg-brand-blue-100 rounded-full flex items-center justify-center mb-4">
                <Clock className="w-8 h-8 text-brand-blue-600" />
              </div>
              <h3 className="text-xl font-bold mb-3">
                80-Hour Compliance Ready
              </h3>
              <ul className="space-y-2 text-sm text-black">
                <li className="flex items-start gap-2">
                  <Circle className="w-4 h-4 text-brand-blue-600 flex-shrink-0 mt-0.5" />
                  <span>Real-time attendance tracking</span>
                </li>
                <li className="flex items-start gap-2">
                  <Circle className="w-4 h-4 text-brand-blue-600 flex-shrink-0 mt-0.5" />
                  <span>Hour verification system</span>
                </li>
                <li className="flex items-start gap-2">
                  <Circle className="w-4 h-4 text-brand-blue-600 flex-shrink-0 mt-0.5" />
                  <span>Monthly compliance reports</span>
                </li>
                <li className="flex items-start gap-2">
                  <Circle className="w-4 h-4 text-brand-blue-600 flex-shrink-0 mt-0.5" />
                  <span>SNAP E&T hour code tagging</span>
                </li>
                <li className="flex items-start gap-2">
                  <Circle className="w-4 h-4 text-brand-blue-600 flex-shrink-0 mt-0.5" />
                  <span>Automated export for FSSA</span>
                </li>
              </ul>
            </div>

            <div className="bg-white rounded-xl p-8 shadow-lg">
              <div className="w-16 h-16 bg-brand-blue-100 rounded-full flex items-center justify-center mb-4">
                <Image src="/images/icons/trending-up.png" alt="Icon" width={32} height={32} className="w-8 h-8 text-brand-blue-600" />
              </div>
              <h3 className="text-xl font-bold mb-3">Verified Outcomes</h3>
              <ul className="space-y-2 text-sm text-black">
                <li className="flex items-start gap-2">
                  <Circle className="w-4 h-4 text-brand-blue-600 flex-shrink-0 mt-0.5" />
                  <span>Credential tracking system</span>
                </li>
                <li className="flex items-start gap-2">
                  <Circle className="w-4 h-4 text-brand-blue-600 flex-shrink-0 mt-0.5" />
                  <span>Job placement verification</span>
                </li>
                <li className="flex items-start gap-2">
                  <Circle className="w-4 h-4 text-brand-blue-600 flex-shrink-0 mt-0.5" />
                  <span>Wage gain documentation</span>
                </li>
                <li className="flex items-start gap-2">
                  <Circle className="w-4 h-4 text-brand-blue-600 flex-shrink-0 mt-0.5" />
                  <span>Employer partnerships</span>
                </li>
                <li className="flex items-start gap-2">
                  <Circle className="w-4 h-4 text-brand-blue-600 flex-shrink-0 mt-0.5" />
                  <span>Performance reporting dashboard</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* SNAP E&T Program Mapping */}
      <section id="capabilities" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">
              SNAP E&T Allowable Activities
            </h2>
            <p className="text-xl text-black">
              Our programs map directly to SNAP E&T categories
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full bg-white rounded-xl shadow-lg">
              <thead className="bg-brand-blue-600 text-white">
                <tr>
                  <th className="px-6 py-4 text-left">SNAP E&T Category</th>
                  <th className="px-6 py-4 text-left">Our Programs</th>
                  <th className="px-6 py-4 text-center">80-Hour Compliant</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                <tr>
                  <td className="px-6 py-4 font-semibold">
                    Education & Training
                  </td>
                  <td className="px-6 py-4">
                    CNA, HVAC, Barber, Esthetics, Tax Prep, CHW, Home Health
                    Aide, Peer Recovery Coach, CDL
                  </td>
                  <td className="px-6 py-4 text-center text-brand-green-600 font-bold">
                    <Image src="/images/icons/check-circle.png" alt="Check" width={20} height={20} className="w-5 h-5 inline-block" />
                  </td>
                </tr>
                <tr className="bg-gray-50">
                  <td className="px-6 py-4 font-semibold">Work Experience</td>
                  <td className="px-6 py-4">
                    DOL Registered Apprenticeships (Barber, HVAC, Building
                    Maintenance), On-the-Job Training, Work-Based Learning
                  </td>
                  <td className="px-6 py-4 text-center text-brand-green-600 font-bold">
                    <Image src="/images/icons/check-circle.png" alt="Check" width={20} height={20} className="w-5 h-5 inline-block" />
                  </td>
                </tr>
                <tr>
                  <td className="px-6 py-4 font-semibold">Job Readiness</td>
                  <td className="px-6 py-4">
                    Business Startup, Workforce Readiness, Soft Skills Training,
                    Resume Writing, Interview Prep
                  </td>
                  <td className="px-6 py-4 text-center text-brand-green-600 font-bold">
                    <Image src="/images/icons/check-circle.png" alt="Check" width={20} height={20} className="w-5 h-5 inline-block" />
                  </td>
                </tr>
                <tr className="bg-gray-50">
                  <td className="px-6 py-4 font-semibold">
                    Supervised Job Search
                  </td>
                  <td className="px-6 py-4">
                    Career Coaching, Case Management, Job Placement Services,
                    Employer Connections
                  </td>
                  <td className="px-6 py-4 text-center text-brand-green-600 font-bold">
                    <Image src="/images/icons/check-circle.png" alt="Check" width={20} height={20} className="w-5 h-5 inline-block" />
                  </td>
                </tr>
                <tr>
                  <td className="px-6 py-4 font-semibold">Barrier Supports</td>
                  <td className="px-6 py-4">
                    Transportation Reimbursement, Childcare Assistance,
                    Emergency Support Services
                  </td>
                  <td className="px-6 py-4 text-center text-brand-green-600 font-bold">
                    <Image src="/images/icons/check-circle.png" alt="Check" width={20} height={20} className="w-5 h-5 inline-block" />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* What We Provide */}
      <section className="py-20 bg-white text-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">
              What We Provide as a SNAP E&T Partner
            </h2>
            <p className="text-xl text-brand-green-100">
              Complete execution layer for SNAP → Training → Job pathway
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-8">
              <h3 className="text-2xl font-bold mb-6">
                For State/Intermediaries
              </h3>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <Image src="/images/icons/check-circle.png" alt="Check" width={20} height={20} className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <span>Immediate absorption of SNAP E&T participants</span>
                </li>
                <li className="flex items-start gap-3">
                  <Image src="/images/icons/check-circle.png" alt="Check" width={20} height={20} className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <span>80-hour monthly compliance tracking</span>
                </li>
                <li className="flex items-start gap-3">
                  <Image src="/images/icons/check-circle.png" alt="Check" width={20} height={20} className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <span>Automated reporting to FSSA/WorkOne</span>
                </li>
                <li className="flex items-start gap-3">
                  <Image src="/images/icons/check-circle.png" alt="Check" width={20} height={20} className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <span>Verified credential attainment</span>
                </li>
                <li className="flex items-start gap-3">
                  <Image src="/images/icons/check-circle.png" alt="Check" width={20} height={20} className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <span>Job placement with wage verification</span>
                </li>
                <li className="flex items-start gap-3">
                  <Image src="/images/icons/check-circle.png" alt="Check" width={20} height={20} className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <span>Braided funding coordination (WIOA + SNAP E&T)</span>
                </li>
              </ul>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-8">
              <h3 className="text-2xl font-bold mb-6">For Participants</h3>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <Image src="/images/icons/check-circle.png" alt="Check" width={20} height={20} className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <span>Industry-recognized credentials</span>
                </li>
                <li className="flex items-start gap-3">
                  <Image src="/images/icons/check-circle.png" alt="Check" width={20} height={20} className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <span>Stackable credential pathways</span>
                </li>
                <li className="flex items-start gap-3">
                  <Image src="/images/icons/check-circle.png" alt="Check" width={20} height={20} className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <span>Earn-while-you-learn apprenticeships</span>
                </li>
                <li className="flex items-start gap-3">
                  <Image src="/images/icons/check-circle.png" alt="Check" width={20} height={20} className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <span>Case management and support services</span>
                </li>
                <li className="flex items-start gap-3">
                  <Image src="/images/icons/check-circle.png" alt="Check" width={20} height={20} className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <span>Direct employer connections</span>
                </li>
                <li className="flex items-start gap-3">
                  <Image src="/images/icons/check-circle.png" alt="Check" width={20} height={20} className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <span>Barrier removal (transportation, childcare)</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Our Infrastructure */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Our Infrastructure</h2>
            <p className="text-xl text-black">
              Built for federal contractor-level compliance
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-8">
            <div className="bg-white rounded-xl p-6 shadow-lg text-center">
              <div className="text-4xl font-bold text-brand-blue-600 mb-2">15+</div>
              <p className="font-bold mb-2">Training Programs</p>
              <p className="text-sm text-black">
                All ETPL-approved and credentialed
              </p>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-lg text-center">
              <div className="text-4xl font-bold text-brand-green-600 mb-2">500+</div>
              <p className="font-bold mb-2">Students Trained</p>
              <p className="text-sm text-black">
                Proven track record of outcomes
              </p>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-lg text-center">
              <div className="text-4xl font-bold text-brand-blue-600 mb-2">85%</div>
              <p className="font-bold mb-2">Job Placement Rate</p>
              <p className="text-sm text-black">
                Verified employer connections
              </p>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-lg text-center">
              <div className="text-4xl font-bold text-brand-orange-600 mb-2">
                100%
              </div>
              <p className="font-bold mb-2">Compliance Ready</p>
              <p className="text-sm text-black">
                Real-time tracking and reporting
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Partnership Process */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Partnership Process</h2>
            <p className="text-xl text-black">
              How we become your SNAP E&T execution partner
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-brand-blue-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
                1
              </div>
              <h3 className="text-xl font-bold mb-3">Intro Meeting</h3>
              <p className="text-black">
                Meet with FSSA/WorkOne to present capabilities
              </p>
              <p className="text-sm text-black mt-2">2-4 weeks</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-brand-blue-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
                2
              </div>
              <h3 className="text-xl font-bold mb-3">Program Mapping</h3>
              <p className="text-black">
                Map programs to SNAP E&T categories and get approval
              </p>
              <p className="text-sm text-black mt-2">30-60 days</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-brand-blue-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
                3
              </div>
              <h3 className="text-xl font-bold mb-3">Contract/MOU</h3>
              <p className="text-black">
                Execute partnership agreement and set up reporting
              </p>
              <p className="text-sm text-black mt-2">30-90 days</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-brand-blue-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
                4
              </div>
              <h3 className="text-xl font-bold mb-3">First Referrals</h3>
              <p className="text-black">
                Begin receiving and serving SNAP E&T participants
              </p>
              <p className="text-sm text-black mt-2">Same quarter</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-brand-blue-900 text-white">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-4xl font-bold mb-6">Ready to Partner?</h2>
          <p className="text-xl text-brand-blue-100 mb-8">
            Contact us to discuss SNAP E&T partnership opportunities
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/contact"
              className="inline-flex items-center justify-center gap-2 px-10 py-5 bg-yellow-400 text-brand-blue-900 font-bold rounded-lg hover:bg-yellow-300 transition text-lg"
            >
              Contact Us <ArrowRight className="w-5 h-5" />
            </Link>
            <a
              href="/support"
              className="inline-flex items-center justify-center gap-2 px-10 py-5 bg-white text-brand-blue-600 font-bold rounded-lg hover:bg-gray-50 transition text-lg"
            >
              <Phone className="w-5 h-5" /> Get Help Online
            </a>
          </div>
          <p className="mt-6 text-brand-blue-200">Elizabeth Greene, Founder & CEO</p>
          <div className="mt-8 flex flex-wrap gap-4 justify-center">
            <Link href="/fssa-partnership-request" className="text-yellow-400 hover:underline font-semibold">
              FSSA Partnership Request →
            </Link>
            <Link href="/grants" className="text-yellow-400 hover:underline font-semibold">
              View All Funding Options →
            </Link>
            <Link href="/programs" className="text-yellow-400 hover:underline font-semibold">
              Browse Programs →
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
