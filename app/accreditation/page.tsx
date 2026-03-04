import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import {
  Award,
  Shield,
  FileCheck,
  Building2,
  ExternalLink,
  CheckCircle,
} from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

export const metadata: Metadata = {
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/accreditation',
  },
  title: 'Accreditation & Compliance | Elevate for Humanity',
  description:
    'Elevate for Humanity is a workforce training provider offering industry-aligned certification programs. View our ETPL listing, DWD provider status, apprenticeship registration, and compliance documentation.',
  keywords:
    'workforce training provider, ETPL, EPA 608 testing site, WIOA eligible, Indiana workforce development, industry certification training, DWD approved',
};

export default function AccreditationPage() {
  const credentials = [
    {
      name: 'Indiana ETPL — Eligible Training Provider',
      description:
        'Listed on the Indiana Eligible Training Provider List (ETPL) under the Workforce Innovation and Opportunity Act (WIOA). Eligible participants may receive funded training through their local WorkOne office.',
      id_number: 'INTraining Location ID: 10004621 · Program: Emergency Health & Safety Technician',
      icon: FileCheck,
    },
    {
      name: 'Indiana DWD Approved Training Provider',
      description:
        'Recognized by the Indiana Department of Workforce Development as an approved training provider for WIOA, Workforce Ready Grant (WRG), and Next Level Jobs.',
      icon: Building2,
    },
    {
      name: 'U.S. DOL Registered Apprenticeship Sponsor',
      description:
        'Registered with the U.S. Department of Labor as an apprenticeship sponsor for structured earn-and-learn programs.',
      id_number: 'RAPIDS Program ID: 2025-IN-132301 · Program: Emergency Health & Safety Technician',
      icon: Award,
    },
    {
      name: 'SAM.gov Active Federal Contractor',
      description:
        'Registered in the System for Award Management (SAM.gov) for federal contracting eligibility.',
      id_number: 'UEI: VX2GK5S8SZH8 · CAGE: 0Q856 · Entity: Selfish Inc',
      icon: Building2,
    },
    {
      name: 'EPA Section 608 Approved Testing Site',
      description:
        'Authorized to administer proctored EPA Section 608 refrigerant handling certification examinations on-site through EPA-approved certifying organizations (ESCO Institute and Mainstream Engineering).',
      icon: Shield,
    },
    {
      name: '501(c)(3) Nonprofit — Selfish Inc',
      description:
        'IRS-recognized tax-exempt charitable organization. Candid/GuideStar registered nonprofit.',
      icon: CheckCircle,
    },
    {
      name: 'ITAP / INDOT Registration',
      description:
        '2Exclusive LLC-S registered with INDOT\'s Indiana Transportation Advancement Program for transportation and construction-aligned workforce services.',
      icon: Building2,
    },
    {
      name: 'CareerSafe / OSHA-Aligned Safety Training',
      description:
        'OSHA 10-Hour and OSHA 30-Hour safety certification preparation integrated into trades and safety pathways.',
      icon: Shield,
    },
    {
      name: 'ByBlack Certified',
      description:
        'Verified Black-owned business certification through the U.S. Black Chambers, Inc.',
      icon: CheckCircle,
    },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Breadcrumbs */}
      <div className="bg-slate-50 border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'Accreditation & Compliance' }]} />
        </div>
      </div>

      {/* Hero */}
      <section className="relative w-full">
        <div className="relative h-[60vh] min-h-[400px] max-h-[720px] w-full overflow-hidden">
          <Image
            src="/images/pages/accreditation-hero.jpg"
            alt="Workforce training classroom"
            fill
            className="object-cover"
            priority
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-900/60 via-slate-900/35 to-transparent" />
          <div className="absolute inset-0 flex items-center">
            <div className="max-w-5xl mx-auto px-4">
              <h1 className="text-3xl md:text-4xl font-bold text-white mb-3 drop-shadow-lg">
                Accreditation &amp; Compliance
              </h1>
              <p className="text-lg text-white/85 max-w-2xl drop-shadow">
                ETPL-listed, DWD-approved workforce training with verifiable credentials and compliance documentation
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Credentials Grid */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-4">
            Our Credentials
          </h2>
          <p className="text-center text-gray-600 max-w-2xl mx-auto mb-12">
            Elevate for Humanity Career & Technical Institute is a workforce training provider
            offering industry-recognized certification programs aligned with
            employer demand and workforce standards.
          </p>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {credentials.map((cred, index) => {
              const Icon = cred.icon;
              return (
                <div
                  key={index}
                  className="bg-white rounded-xl shadow-sm border p-6"
                >
                  <Icon className="w-10 h-10 text-brand-blue-600 mb-4" />
                  <h3 className="font-bold text-lg mb-2">{cred.name}</h3>
                  <p className="text-gray-600 mb-2">{cred.description}</p>
                  {cred.id_number && (
                    <p className="text-sm text-brand-blue-600 font-mono">
                      {cred.id_number}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* What This Means */}
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-8">
            What This Means for Students
          </h2>
          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <span className="w-3 h-3 rounded-full bg-brand-green-500 mt-2 flex-shrink-0" />
              <div>
                <h3 className="font-bold text-lg">
                  Industry-Recognized Certifications
                </h3>
                <p className="text-gray-600">
                  Students receive preparation and authorized proctored testing
                  access for credentials including EPA Section 608 and OSHA
                  safety certifications.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <span className="w-3 h-3 rounded-full bg-brand-green-500 mt-2 flex-shrink-0" />
              <div>
                <h3 className="font-bold text-lg">Workforce Funding Access</h3>
                <p className="text-gray-600">
                  Eligible students may use WIOA, Workforce Ready Grant (WRG),
                  or other workforce funding sources to cover training costs.
                  Federal financial aid (FAFSA, Pell Grants, federal loans) is
                  not currently offered.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <span className="w-3 h-3 rounded-full bg-brand-green-500 mt-2 flex-shrink-0" />
              <div>
                <h3 className="font-bold text-lg">Employer-Aligned Training</h3>
                <p className="text-gray-600">
                  Programs are designed around real workforce pathways and
                  employer demand in facilities maintenance, building operations,
                  and technical support roles.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Legal Entity Attribution */}
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-8">
            Legal Entity Attribution
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-slate-50 rounded-xl p-6 border">
              <h3 className="font-bold text-lg mb-3">2Exclusive LLC-S</h3>
              <p className="text-xs text-brand-blue-600 font-medium mb-3">Legal Entity — DBA Elevate for Humanity Career &amp; Technical Institute</p>
              <p className="text-gray-600 text-sm mb-3">
                Indiana-registered LLC operating workforce training programs under
                the DBA &quot;Elevate for Humanity Career &amp; Technical Institute.&quot;
                Holds ITAP/INDOT registration and serves as the training provider
                of record for ETPL-listed programs. Delivers certification programs,
                apprenticeship training, and career pathway services as an Indiana
                DWD-approved training provider.
              </p>
              <p className="text-xs text-gray-500">
                Registrations: ITAP/INDOT, ETPL provider, DOL RAPIDS sponsor
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Programs: HVAC, CDL, CNA, Electrical, Welding, IT Support, Barber, Business
              </p>
            </div>
            <div className="bg-slate-50 rounded-xl p-6 border">
              <h3 className="font-bold text-lg mb-3">Selfish Inc</h3>
              <p className="text-xs text-brand-blue-600 font-medium mb-3">501(c)(3) Nonprofit Organization</p>
              <p className="text-gray-600 text-sm mb-3">
                IRS-recognized tax-exempt charitable organization. Registered on
                SAM.gov and Candid/GuideStar. Provides governance, fiscal oversight,
                and community support services including barrier reduction for
                justice-involved individuals, veterans, and low-income participants.
              </p>
              <p className="text-xs text-gray-500">
                SAM.gov UEI: VX2GK5S8SZH8 &middot; CAGE: 0Q856
              </p>
            </div>
          </div>
          <p className="text-center text-gray-500 text-sm mt-6">
            All entities operate under unified leadership. &quot;Elevate for Humanity Career &amp; Technical Institute&quot; is a DBA of 2Exclusive LLC-S.
            Selfish Inc is the 501(c)(3) nonprofit entity.
          </p>
        </div>
      </section>

      {/* Compliance & Data Handling */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-center mb-8">
            Compliance &amp; Data Handling
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-white rounded-lg p-5 border">
              <h3 className="font-bold mb-2">FERPA Compliance</h3>
              <p className="text-gray-600 text-sm">
                Student education records are protected under the Family
                Educational Rights and Privacy Act. Access is restricted to
                authorized personnel only.
              </p>
            </div>
            <div className="bg-white rounded-lg p-5 border">
              <h3 className="font-bold mb-2">WIOA Reporting</h3>
              <p className="text-gray-600 text-sm">
                Participant data is reported to Indiana DWD and federal workforce
                agencies as required by WIOA performance accountability standards.
              </p>
            </div>
            <div className="bg-white rounded-lg p-5 border">
              <h3 className="font-bold mb-2">PII Protection</h3>
              <p className="text-gray-600 text-sm">
                Social Security numbers, identity documents, and income
                verification data are encrypted at rest and in transit. Access is
                logged and auditable.
              </p>
            </div>
          </div>
          <p className="text-center mt-6">
            <Link href="/privacy-policy" className="text-brand-blue-600 hover:underline text-sm">
              Read our full Privacy Policy →
            </Link>
          </p>
        </div>
      </section>

      {/* Important Disclosure */}
      <section className="py-12 bg-slate-50 border-y">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-xl font-bold mb-4">Important Information</h2>
          <div className="space-y-3 text-gray-600 text-sm">
            <p>
              Elevate for Humanity Career & Technical Institute is a workforce training
              provider offering industry-recognized certification programs.
              Programs are not institutionally accredited degree programs. They
              are aligned with industry certification standards and include
              access to authorized proctored certification examinations such as
              EPA Section 608.
            </p>
            <p>
              Certification outcomes are issued by the respective certifying
              organizations upon successful completion of required examinations.
              Elevate for Humanity Career & Technical Institute provides training,
              preparation, and authorized proctored testing access but does not
              independently issue federal or state licenses.
            </p>
            <p>
              Financial aid through federal student aid (FAFSA, Pell Grants, and
              federal loans) is not currently offered. Students may utilize
              workforce funding programs, grants, employer sponsorships, or
              self-pay enrollment options where eligible.
            </p>
          </div>
        </div>
      </section>

      {/* Verification Links */}
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-center mb-8">
            Verify Our Credentials
          </h2>
          <p className="text-center text-gray-600 mb-8 text-sm">
            All credentials listed on this page can be independently verified
            through the following public registries.
          </p>
          <div className="grid md:grid-cols-2 gap-6">
            <a
              href="https://intraining.dwd.in.gov/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition border"
            >
              <div>
                <span className="font-medium block">Indiana INTraining — ETPL Provider Search</span>
                <span className="text-xs text-gray-500">Search: &quot;Elevate for Humanity&quot; · Location ID: 10004621</span>
              </div>
              <ExternalLink className="w-5 h-5 text-gray-400 flex-shrink-0" />
            </a>
            <a
              href="https://www.apprenticeship.gov/partner-finder"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition border"
            >
              <div>
                <span className="font-medium block">DOL RAPIDS Apprenticeship Lookup</span>
                <span className="text-xs text-gray-500">RAPIDS ID: 2025-IN-132301 · Indianapolis, IN</span>
              </div>
              <ExternalLink className="w-5 h-5 text-gray-400 flex-shrink-0" />
            </a>
            <a
              href="https://sam.gov/search/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition border"
            >
              <div>
                <span className="font-medium block">SAM.gov Entity Search</span>
                <span className="text-xs text-gray-500">UEI: VX2GK5S8SZH8 · CAGE: 0Q856 · Entity: Selfish Inc</span>
              </div>
              <ExternalLink className="w-5 h-5 text-gray-400 flex-shrink-0" />
            </a>
            <a
              href="https://www.epa.gov/section608"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition border"
            >
              <div>
                <span className="font-medium block">EPA Section 608 Certification Program</span>
                <span className="text-xs text-gray-500">Authorized proctored testing site</span>
              </div>
              <ExternalLink className="w-5 h-5 text-gray-400 flex-shrink-0" />
            </a>
            <a
              href="https://www.in.gov/dwd/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition border"
            >
              <div>
                <span className="font-medium block">Indiana Department of Workforce Development</span>
                <span className="text-xs text-gray-500">WIOA + WRG approved training provider</span>
              </div>
              <ExternalLink className="w-5 h-5 text-gray-400 flex-shrink-0" />
            </a>
            <a
              href="https://www.guidestar.org/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition border"
            >
              <div>
                <span className="font-medium block">Candid / GuideStar Nonprofit Profile</span>
                <span className="text-xs text-gray-500">Search: &quot;Selfish Inc&quot; · 501(c)(3) verified</span>
              </div>
              <ExternalLink className="w-5 h-5 text-gray-400 flex-shrink-0" />
            </a>
          </div>
        </div>
      </section>

      {/* Compliance Documentation */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-center mb-4">
            Compliance Documentation
          </h2>
          <p className="text-center text-gray-600 mb-8 text-sm">
            The following documents are available for workforce partners, funding agencies,
            and regulatory reviewers. Contact us for additional documentation.
          </p>
          <div className="grid md:grid-cols-2 gap-4">
            {[
              {
                title: 'DOL Apprenticeship Standards',
                desc: 'Registered program standards filed with USDOL Office of Apprenticeship.',
                status: 'Available on request',
              },
              {
                title: 'ETPL Provider Documentation',
                desc: 'Indiana ETPL listing confirmation and approved program details.',
                status: 'Available on request',
              },
              {
                title: 'Apprenticeship Agreement Template',
                desc: 'Tri-party agreement between sponsor, employer, and apprentice.',
                href: '/compliance/competency-verification/barber/apprenticeship-agreement',
                status: 'View online',
              },
              {
                title: 'Partner Compliance Requirements',
                desc: 'Insurance, licensing, and worksite standards for host employers.',
                href: '/partners/barbershop-apprenticeship/handbook',
                status: 'View online',
              },
              {
                title: 'Instructional Framework',
                desc: 'RTI curriculum structure, competency standards, and assessment criteria.',
                href: '/instructional-framework',
                status: 'View online',
              },
              {
                title: 'Institutional Governance',
                desc: 'Organizational structure, oversight roles, and decision authority.',
                href: '/institutional-governance',
                status: 'View online',
              },
            ].map((doc) => (
              <div key={doc.title} className="bg-white p-4 rounded-lg border border-gray-200">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-900 text-sm">{doc.title}</h3>
                    <p className="text-xs text-gray-500 mt-1">{doc.desc}</p>
                  </div>
                  <FileCheck className="w-5 h-5 text-brand-green-600 flex-shrink-0 mt-0.5" />
                </div>
                {doc.href ? (
                  <Link href={doc.href} className="text-xs text-brand-blue-600 hover:underline mt-2 inline-block">
                    {doc.status} →
                  </Link>
                ) : (
                  <span className="text-xs text-gray-400 mt-2 inline-block">{doc.status}</span>
                )}
              </div>
            ))}
          </div>
          <p className="text-center text-gray-500 text-xs mt-6">
            For document requests not listed above (EIN verification, insurance certificates,
            W-9, or audit records), contact{' '}
            <a href="mailto:elevate4humanityedu@gmail.com" className="text-brand-blue-600 hover:underline">
              elevate4humanityedu@gmail.com
            </a>
          </p>
        </div>
      </section>

      {/* Outcomes Methodology */}
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-center mb-4">
            Outcomes Reporting Methodology
          </h2>
          <p className="text-center text-gray-600 mb-8 text-sm">
            Elevate reports training outcomes using the following standards.
            All outcome data is derived from internal LMS records and verified
            through employer confirmation.
          </p>
          <div className="space-y-6">
            <div className="border border-gray-200 rounded-lg p-5">
              <h3 className="font-semibold text-gray-900 mb-2">Data Sources</h3>
              <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
                <li>LMS completion records (lesson progress, quiz scores, seat time)</li>
                <li>Instructor attestations (module sign-off, competency checkpoints)</li>
                <li>Employer-verified OJL hour logs (GPS-geofenced timeclock + supervisor approval)</li>
                <li>Credential issuance records (immutable issuance snapshots with SHA-256 hash)</li>
                <li>Employment verification (employer confirmation at 30/90/180 days post-completion)</li>
              </ul>
            </div>
            <div className="border border-gray-200 rounded-lg p-5">
              <h3 className="font-semibold text-gray-900 mb-2">Reporting Standards</h3>
              <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
                <li><strong>Completion rate:</strong> Participants who met all competency gates (OJL + RTI hours for apprenticeship, lesson + quiz + engagement hours for course-based) divided by total enrolled participants in the reporting cohort.</li>
                <li><strong>Employment rate:</strong> Completers who obtained employment in a training-related occupation within 180 days of completion, verified by employer confirmation or wage record match.</li>
                <li><strong>Credential attainment:</strong> Completers who earned an industry-recognized credential from a third-party authority (not issued by Elevate).</li>
                <li><strong>Reporting period:</strong> Outcomes are reported on a rolling 12-month basis aligned with the program year (July 1 – June 30).</li>
              </ul>
            </div>
            <div className="border border-gray-200 rounded-lg p-5">
              <h3 className="font-semibold text-gray-900 mb-2">Limitations & Disclaimers</h3>
              <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
                <li>Outcome data reflects participants who completed training. Participants who withdrew or were terminated are excluded from completion and employment rates.</li>
                <li>Employment verification depends on employer response and may undercount actual employment.</li>
                <li>Elevate is a new program (RAPIDS registered 2025). Historical outcome data is limited. Early cohort data will be reported as it becomes available.</li>
                <li>Sample sizes for individual programs may be small. Interpret program-level rates with appropriate caution.</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-brand-blue-600">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to Start Your Training?
          </h2>
          <p className="text-brand-blue-100 mb-8">
            Explore workforce training programs and check your eligibility for
            funded training options.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/apply"
              className="bg-white text-brand-blue-600 px-8 py-4 rounded-lg font-bold hover:bg-gray-100 transition"
            >
              Apply Now
            </Link>
            <Link
              href="/programs"
              className="border-2 border-white text-white px-8 py-4 rounded-lg font-bold hover:bg-brand-blue-700 transition"
            >
              Browse Programs
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
