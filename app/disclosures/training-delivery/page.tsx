import { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, Monitor, Wrench, HeartHandshake, Building2, MapPin } from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

const SITE_URL = 'https://www.elevateforhumanity.org';

export const metadata: Metadata = {
  title: 'Training Delivery Model Disclosure | Elevate for Humanity',
  description: 'How Elevate for Humanity delivers training: online didactic instruction via LMS, hands-on training at approved employer partner sites, and virtual support services.',
  alternates: { canonical: `${SITE_URL}/disclosures/training-delivery` },
};

export default function TrainingDeliveryDisclosure() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <section className="bg-brand-blue-700 text-white py-12">
        <div className="max-w-4xl mx-auto px-4">
          <Breadcrumbs
            items={[
              { label: 'Home', href: '/' },
              { label: 'Disclosures', href: '/disclosures' },
              { label: 'Training Delivery Model' },
            ]}
          />
          <h1 className="text-3xl sm:text-4xl font-bold mt-4 mb-3">Training Delivery Model</h1>
          <p className="text-slate-300 text-lg">
            How Elevate for Humanity delivers workforce training across all programs.
          </p>
        </div>
      </section>

      {/* Summary Statement */}
      <section className="py-10 bg-brand-blue-50 border-b border-brand-blue-100">
        <div className="max-w-4xl mx-auto px-4">
          <div className="bg-white rounded-lg border border-brand-blue-200 p-6">
            <h2 className="text-lg font-bold text-slate-900 mb-3">Institutional Disclosure</h2>
            <p className="text-sm text-slate-700 leading-relaxed">
              Elevate for Humanity (operating as 2Exclusive LLC-S, DBA Elevate for Humanity Career
              &amp; Training Institute) is a <strong>workforce training institute</strong> and{' '}
              <strong>DOL Registered Apprenticeship Sponsor</strong> (RAPIDS: 2025-IN-132301). We are
              an Indiana DWD-approved training provider listed on the Eligible Training Provider List
              (ETPL). Elevate is <strong>not a traditional campus-based institution</strong>. Training
              is delivered through a combination of online instruction and employer-based hands-on
              learning at approved partner sites.
            </p>
          </div>
        </div>
      </section>

      {/* Delivery Components */}
      <section className="py-12">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-slate-900 mb-8">How Training Is Delivered</h2>

          <div className="space-y-8">
            {/* Didactic */}
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-12 h-12 bg-brand-blue-100 rounded-lg flex items-center justify-center">
                <Monitor className="w-6 h-6 text-brand-blue-700" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">
                  Didactic / Classroom Instruction — Online
                </h3>
                <p className="text-sm text-slate-600 mb-2">
                  All Related Technical Instruction (RTI) and classroom-equivalent coursework is
                  delivered online through the Elevate Learning Management System (LMS). This includes
                  curriculum modules, video instruction, quizzes, assessments, and progress tracking.
                </p>
                <p className="text-sm text-slate-600">
                  Students access course materials on their own schedule with structured deadlines.
                  Instructor support is available via the platform, email, and scheduled virtual sessions.
                </p>
              </div>
            </div>

            {/* Hands-on */}
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-12 h-12 bg-brand-orange-100 rounded-lg flex items-center justify-center">
                <Wrench className="w-6 h-6 text-brand-orange-700" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">
                  Hands-On / OJT Training — Employer Partner Sites
                </h3>
                <p className="text-sm text-slate-600 mb-3">
                  Practical, hands-on training and On-the-Job Training (OJT) hours are completed at
                  approved employer partner locations. Training sites are selected based on program
                  requirements, licensing standards, and geographic accessibility.
                </p>
                <div className="bg-white rounded-lg p-4 border border-slate-200">
                  <h4 className="text-sm font-semibold text-slate-800 mb-2">Training Sites by Program Type</h4>
                  <ul className="text-sm text-slate-600 space-y-2">
                    <li className="flex gap-2">
                      <span className="text-brand-orange-600 font-bold">•</span>
                      <span><strong>Barber &amp; Cosmetology Apprenticeships:</strong> Licensed partner barbershops and salons in the Indianapolis metro area</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="text-brand-orange-600 font-bold">•</span>
                      <span><strong>Healthcare (CNA, Phlebotomy, Medical Assistant):</strong> Partner clinical facilities, nursing homes, and medical offices</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="text-brand-orange-600 font-bold">•</span>
                      <span><strong>CDL / Commercial Driving:</strong> Partner driving schools with yard and road training facilities</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="text-brand-orange-600 font-bold">•</span>
                      <span><strong>Skilled Trades (HVAC, Electrical, Welding, Plumbing):</strong> Employer worksites and partner training labs</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="text-brand-orange-600 font-bold">•</span>
                      <span><strong>IT, Business, &amp; Tax Preparation:</strong> Delivered fully online; no physical training site required</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Support */}
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <HeartHandshake className="w-6 h-6 text-green-700" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">
                  Support Services — Virtual &amp; In-Person
                </h3>
                <p className="text-sm text-slate-600">
                  Career counseling, case management, funding navigation, and advising are available
                  virtually (video, phone, chat) and in-person by appointment. WIOA-funded participants
                  also work with their assigned WorkOne career advisor. Supportive services (transportation
                  assistance, childcare support, supplies) are coordinated through applicable funding programs.
                </p>
              </div>
            </div>

            {/* Admin office */}
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Building2 className="w-6 h-6 text-purple-700" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">
                  Administrative Office, Testing, and Hands-On Training
                </h3>
                <p className="text-sm text-slate-600 mb-2">
                  Elevate for Humanity maintains this location for administrative operations,
                  enrollment support, scheduled meetings, authorized proctored testing, and approved
                  hands-on training activities. Services at this site are available{' '}
                  <strong>by appointment only</strong>. This is not a walk-in location. Instruction,
                  testing, and practical training are provided only when scheduled in advance and
                  when required staff, faculty, or proctors are present.
                </p>
                <div className="flex items-start gap-2 text-sm text-slate-600">
                  <MapPin className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
                  <span>8888 Keystone Crossing, Suite 1300, Indianapolis, IN 46240</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Credentials */}
      <section className="py-10 border-t border-slate-200">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-xl font-bold text-slate-900 mb-4">Credential Issuance</h2>
          <p className="text-sm text-slate-600 mb-3">
            Industry credentials and licenses are issued by recognized third-party certifying
            authorities — not by Elevate for Humanity. Elevate issues program completion certificates
            documenting hours completed, competencies achieved, and program requirements met.
          </p>
          <div className="bg-white rounded-lg p-4 border border-slate-200">
            <h3 className="text-sm font-semibold text-slate-800 mb-2">Credentialing Authorities</h3>
            <ul className="text-sm text-slate-600 grid sm:grid-cols-2 gap-1">
              <li>• Indiana Professional Licensing Agency (PLA)</li>
              <li>• Indiana State Department of Health (ISDH)</li>
              <li>• Indiana Bureau of Motor Vehicles (BMV)</li>
              <li>• U.S. Environmental Protection Agency (EPA)</li>
              <li>• Occupational Safety &amp; Health Admin (OSHA)</li>
              <li>• National Center for Construction Ed (NCCER)</li>
              <li>• American Welding Society (AWS)</li>
              <li>• Certiport / Pearson VUE</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Funding Eligibility Disclaimer */}
      <section className="py-10 border-t border-slate-200">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-xl font-bold text-slate-900 mb-4">Funding &amp; Tuition Disclosure</h2>
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <p className="text-sm text-amber-900 leading-relaxed">
              <strong>Important:</strong> Many Elevate programs may be available at no cost to eligible
              participants through federal and state workforce funding programs including WIOA
              (Workforce Innovation and Opportunity Act), WRG (Workforce Ready Grant), and Job Ready Indy
              (Job Ready Indy). Eligibility is determined by your local WorkOne
              career center, not by Elevate. Not all applicants will qualify for funded training.
              Self-pay options and payment plans are available for participants who do not qualify
              for workforce funding. See{' '}
              <Link href="/tuition-fees" className="text-amber-800 underline font-semibold">
                Tuition &amp; Fees
              </Link>{' '}
              for program-specific costs.
            </p>
          </div>
        </div>
      </section>

      {/* Employer Partner Documentation */}
      <section className="py-10 border-t border-slate-200">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-xl font-bold text-slate-900 mb-4">Employer Partner Documentation</h2>
          <p className="text-sm text-slate-600 mb-3">
            All employer training sites operate under documented agreements with Elevate for Humanity.
            See our{' '}
            <Link href="/partners/training-sites" className="text-brand-red-600 underline font-semibold">
              Employer Partners &amp; Training Sites
            </Link>{' '}
            page for current partner listings. Training site documentation includes:
          </p>
          <ul className="text-sm text-slate-600 space-y-1 mb-4">
            <li>• Memoranda of Understanding (MOUs) with employer partners</li>
            <li>• Training site agreements specifying supervision, safety, and competency standards</li>
            <li>• RAPIDS-linked employer registrations for apprenticeship programs</li>
            <li>• OJT contracts for WIOA-funded placements</li>
            <li>• Clinical affiliation agreements for healthcare programs</li>
          </ul>
          <p className="text-sm text-slate-600">
            Training site agreements are maintained on file and available for review by authorized
            regulatory agencies, workforce boards, and grant auditors upon request.
          </p>
        </div>
      </section>

      {/* Contact */}
      <section className="py-10 bg-brand-blue-700 text-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-2xl font-bold mb-3">Questions About Our Training Model?</h2>
          <p className="text-white/80 mb-6">
            Contact our enrollment team for details about specific program delivery, training sites,
            or funding eligibility.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/contact"
              className="inline-flex items-center justify-center px-6 py-3 bg-white text-brand-blue-700 font-bold rounded-lg hover:bg-white transition"
            >
              Contact Us <ArrowRight className="ml-2 w-4 h-4" />
            </Link>
            <Link
              href="/disclosures"
              className="inline-flex items-center justify-center px-6 py-3 border-2 border-white/30 text-white font-bold rounded-lg hover:bg-white/10 transition"
            >
              All Disclosures
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
