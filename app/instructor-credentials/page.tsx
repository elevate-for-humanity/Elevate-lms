import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import {
  Shield,
  GraduationCap,
  Building2,
  Award,
  FileCheck,
  ClipboardCheck,
  Users,
  BookOpen,
  CheckCircle,
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Instructor Credentials & RTI Provider Qualifications | Elevate for Humanity',
  description:
    'Instructor qualification standards, credential partner requirements, and RTI provider documentation for Elevate for Humanity workforce training and registered apprenticeship programs.',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/instructor-credentials',
  },
};

/* ── Per-Program Instructor Requirements ── */
const PROGRAM_CREDENTIALS = [
  {
    program: 'Barber Apprenticeship',
    occupation: 'Barber',
    credentialPartner: 'Licensed Barber School (State-Approved)',
    instructorRequirements: [
      'Active Indiana Master Barber License',
      'Minimum 3 years of professional barbering experience',
      'Completion of instructor training or apprenticeship mentor certification',
      'Current CPR/First Aid certification (for clinical supervision)',
    ],
    programHolderRole: 'Barber Apprenticeship Coordinator — manages apprentice placement, RTI scheduling, and RAPIDS documentation under licensed barber school supervision.',
    smeScope: 'Licensed master barbers at host shops provide supplemental hands-on mentoring and technique instruction.',
    credentialIssued: 'Indiana Barber License — issued by Indiana Professional Licensing Agency (PLA)',
    regulatoryBody: 'Indiana Professional Licensing Agency (PLA)',
  },
  {
    program: 'CNA Certification',
    occupation: 'Certified Nursing Assistant',
    credentialPartner: 'Accredited Nursing Program (State-Approved)',
    instructorRequirements: [
      'Active Indiana RN or LPN license',
      'Minimum 2 years of clinical nursing experience',
      'State-approved nurse aide training instructor certification',
      'Current CPR/BLS certification',
    ],
    programHolderRole: 'Healthcare Training Manager — coordinates clinical rotation scheduling, student progress tracking, and exam preparation under nursing program oversight.',
    smeScope: 'Experienced CNAs and healthcare professionals provide supplemental skills practice and patient care mentoring.',
    credentialIssued: 'CNA Certification — issued by Indiana State Department of Health (ISDH)',
    regulatoryBody: 'Indiana State Department of Health (ISDH)',
  },
  {
    program: 'CDL Commercial Driving',
    occupation: 'Commercial Driver',
    credentialPartner: 'ELDT-Compliant CDL School (FMCSA Registered)',
    instructorRequirements: [
      'Active CDL Class A or Class B license (matching program)',
      'Minimum 2 years of commercial driving experience',
      'ELDT (Entry-Level Driver Training) instructor certification',
      'Clean driving record (no major violations in past 3 years)',
    ],
    programHolderRole: 'CDL Program Coordinator — manages student enrollment, DOT physical scheduling, behind-the-wheel hour tracking, and BMV exam coordination.',
    smeScope: 'Experienced commercial drivers provide supplemental road mentoring and pre-trip inspection practice.',
    credentialIssued: 'CDL Class A or Class B — issued by Indiana Bureau of Motor Vehicles (BMV)',
    regulatoryBody: 'FMCSA (Federal Motor Carrier Safety Administration) / Indiana BMV',
  },
  {
    program: 'HVAC Technician',
    occupation: 'HVAC Installer / Maintenance Technician',
    credentialPartner: 'Authorized Testing Partner',
    instructorRequirements: [
      'EPA 608 Universal Certification',
      'OSHA 30-Hour Construction Safety certification',
      'Minimum 5 years of HVAC field experience',
      'NATE certification preferred',
    ],
    programHolderRole: 'Trades Program Lead — coordinates lab scheduling, equipment access, safety compliance, and certification exam preparation.',
    smeScope: 'EPA-certified HVAC technicians provide supplemental equipment training, troubleshooting labs, and refrigerant handling instruction.',
    credentialIssued: 'EPA 608 Certification + OSHA 10-Hour — issued by EPA and OSHA',
    regulatoryBody: 'EPA / OSHA / Indiana DOE',
  },
  {
    program: 'IT Help Desk',
    occupation: 'IT Support Specialist',
    credentialPartner: 'Certiport Authorized Testing Center',
    instructorRequirements: [
      'Active Certiport IT Specialist or equivalent certification',
      'Minimum 3 years of IT support or systems administration experience',
      'Certiport Educator certification preferred',
      'Experience with LMS-based instruction delivery',
    ],
    programHolderRole: 'Technology Program Lead — manages module sequencing, lab environment setup, practice exam scheduling, and student progress tracking.',
    smeScope: 'Certified IT professionals provide supplemental tutoring, lab mentoring, and exam preparation support.',
    credentialIssued: 'IT Specialist — Device Configuration & Management — issued by Certiport',
    regulatoryBody: 'Certiport',
  },
  {
    program: 'Cybersecurity Analyst',
    occupation: 'Cybersecurity Analyst',
    credentialPartner: 'Certiport Authorized Testing Center',
    instructorRequirements: [
      'Active Certiport IT Specialist — Cybersecurity or equivalent certification',
      'Minimum 3 years of cybersecurity or network security experience',
      'CySA+, CISSP, or CEH certification preferred',
      'Experience with virtual lab environments and threat simulation',
    ],
    programHolderRole: 'Technology Program Lead — manages curriculum delivery, virtual lab access, assessment scheduling, and certification readiness evaluation.',
    smeScope: 'Certified cybersecurity professionals provide supplemental threat analysis labs, incident response exercises, and exam preparation.',
    credentialIssued: 'IT Specialist — Cybersecurity — issued by Certiport',
    regulatoryBody: 'Certiport',
  },
  {
    program: 'Welding',
    occupation: 'Welder',
    credentialPartner: 'AWS-Accredited Testing Facility / Authorized Testing Partner',
    instructorRequirements: [
      'AWS Certified Welder (minimum D1.1 structural)',
      'OSHA 30-Hour Construction Safety certification',
      'Minimum 5 years of professional welding experience',
      'AWS Certified Welding Inspector (CWI) preferred',
    ],
    programHolderRole: 'Trades Program Lead — coordinates shop scheduling, safety compliance, welding process instruction, and certification testing.',
    smeScope: 'AWS-certified welders provide supplemental technique instruction, joint preparation labs, and weld quality mentoring.',
    credentialIssued: 'AWS D1.1 Certification + OSHA 10-Hour — issued by AWS and OSHA',
    regulatoryBody: 'AWS (American Welding Society) / OSHA',
  },
  {
    program: 'Electrical',
    occupation: 'Electrician',
    credentialPartner: 'Authorized Testing Partner',
    instructorRequirements: [
      'Active Indiana Journeyman or Master Electrician license',
      'OSHA 30-Hour Construction Safety certification',
      'Minimum 5 years of electrical field experience',
      'NCCER Certified Instructor preferred',
    ],
    programHolderRole: 'Trades Program Lead — coordinates lab scheduling, NEC code instruction, safety compliance, and NCCER assessment administration.',
    smeScope: 'Licensed electricians provide supplemental wiring labs, code interpretation mentoring, and job site safety instruction.',
    credentialIssued: 'OSHA 10-Hour + NCCER Core Certification — issued by OSHA and NCCER',
    regulatoryBody: 'Indiana DOE / OSHA / NCCER',
  },
];

export default function InstructorCredentialsPage() {
  return (
    <div className="bg-white min-h-screen">
      {/* Breadcrumbs */}
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[
            { label: 'Instructional Framework', href: '/instructional-framework' },
            { label: 'Instructor Credentials' },
          ]} />
        </div>
      </div>

      {/* Hero */}
      <section className="relative h-[260px] sm:h-[340px] overflow-hidden">
        <Image
          src="/images/pages/instructor-credentials-page-1.jpg"
          alt="Professional instructor working with students"
          fill
          sizes="100vw"
          className="object-cover"
          priority
        />
        <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-10">
          <div className="max-w-6xl mx-auto">
            <p className="text-slate-600 text-sm font-medium uppercase tracking-wider mb-2">
              RTI Provider Qualifications
            </p>
            <h1 className="text-3xl sm:text-4xl font-bold text-slate-900">
              Instructor Credentials
            </h1>
          </div>
        </div>
      </section>

      {/* Intro */}
      <section className="py-12">
        <div className="max-w-4xl mx-auto px-4">
          <div className="border-l-4 border-brand-blue-600 pl-6 mb-8">
            <p className="text-gray-700 leading-relaxed">
              All instructors delivering Related Technical Instruction (RTI) through Elevate
              programs hold occupation-specific credentials that match the program they teach.
              This page documents the qualification standards for each program, the role of
              credential partners and program holders, and the scope of subject matter expert
              involvement.
            </p>
          </div>

          <div className="grid sm:grid-cols-3 gap-4 mb-10">
            <div className="bg-white rounded-lg p-4 text-center">
              <GraduationCap className="w-6 h-6 text-brand-blue-600 mx-auto mb-2" />
              <p className="text-sm font-semibold text-gray-900">Credential Partners</p>
              <p className="text-xs text-gray-600 mt-1">State-approved or licensed instructional authorities</p>
            </div>
            <div className="bg-white rounded-lg p-4 text-center">
              <FileCheck className="w-6 h-6 text-brand-blue-600 mx-auto mb-2" />
              <p className="text-sm font-semibold text-gray-900">Program Holders</p>
              <p className="text-xs text-gray-600 mt-1">Authorized RTI coordinators under licensed supervision</p>
            </div>
            <div className="bg-white rounded-lg p-4 text-center">
              <Award className="w-6 h-6 text-brand-blue-600 mx-auto mb-2" />
              <p className="text-sm font-semibold text-gray-900">Subject Matter Experts</p>
              <p className="text-xs text-gray-600 mt-1">Supplemental instruction and mentoring</p>
            </div>
          </div>

          {/* Qualification Standard */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-6 mb-10">
            <h2 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
              <Shield className="w-5 h-5 text-amber-600" />
              Instructor Qualification Standard
            </h2>
            <p className="text-sm text-gray-700 mb-3">
              For apprenticeship compliance and ETPL review, RTI instructors must be clearly
              qualified for the occupation they teach. The following standards apply across
              all programs:
            </p>
            <ul className="space-y-2 text-sm text-gray-700">
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-brand-green-600 flex-shrink-0 mt-0.5" />
                <span><strong>Credential match:</strong> Instructor license or certification must correspond to the occupation being taught</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-brand-green-600 flex-shrink-0 mt-0.5" />
                <span><strong>Field experience:</strong> Minimum years of documented professional experience in the occupation</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-brand-green-600 flex-shrink-0 mt-0.5" />
                <span><strong>MOU documentation:</strong> All credential partners and program holders operate under signed agreements with defined scope</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-brand-green-600 flex-shrink-0 mt-0.5" />
                <span><strong>Periodic review:</strong> Instructor credentials are verified annually and maintained in compliance files</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* Per-Program Credential Details */}
      <section className="py-12">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Program-Specific Instructor Requirements</h2>
          <p className="text-gray-600 mb-8">
            Detailed qualification standards for each program, including credential partner type,
            instructor requirements, program holder role, and SME scope.
          </p>

          <div className="space-y-8">
            {PROGRAM_CREDENTIALS.map((prog, i) => (
              <div key={i} className="bg-white rounded-xl border overflow-hidden">
                {/* Header */}
                <div className="bg-white px-6 py-4">
                  <h3 className="text-lg font-bold text-slate-900">{prog.program}</h3>
                  <p className="text-brand-blue-100 text-sm">Occupation: {prog.occupation}</p>
                </div>

                <div className="p-6 space-y-5">
                  {/* Credential Partner */}
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1 flex items-center gap-1">
                      <GraduationCap className="w-3.5 h-3.5" /> Credential Partner (Tier 1)
                    </p>
                    <p className="text-sm text-gray-900 font-medium">{prog.credentialPartner}</p>
                    <p className="text-xs text-gray-500 mt-1">Regulatory body: {prog.regulatoryBody}</p>
                  </div>

                  {/* Instructor Requirements */}
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                      Instructor Qualification Requirements
                    </p>
                    <ul className="space-y-1">
                      {prog.instructorRequirements.map((req, j) => (
                        <li key={j} className="text-sm text-gray-700 flex items-start gap-2">
                          <ClipboardCheck className="w-4 h-4 text-brand-green-600 flex-shrink-0 mt-0.5" />
                          {req}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Program Holder Role */}
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1 flex items-center gap-1">
                      <FileCheck className="w-3.5 h-3.5" /> Program Holder Role (Tier 2)
                    </p>
                    <p className="text-sm text-gray-700">{prog.programHolderRole}</p>
                  </div>

                  {/* SME Scope */}
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1 flex items-center gap-1">
                      <Award className="w-3.5 h-3.5" /> SME Scope (Tier 3)
                    </p>
                    <p className="text-sm text-gray-700">{prog.smeScope}</p>
                  </div>

                  {/* Credential Issued */}
                  <div className="bg-white rounded-lg p-3">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                      Credential Issued
                    </p>
                    <p className="text-sm text-gray-900 font-medium">{prog.credentialIssued}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* MOU Framework */}
      <section className="py-12">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">MOU & Agreement Framework</h2>
          <p className="text-gray-600 mb-6">
            All instructional partners operate under signed agreements that define scope,
            accountability, and compliance requirements.
          </p>

          <div className="space-y-4">
            {[
              {
                type: 'Credential Partner MOU',
                parties: 'Elevate + State-Approved Training Provider',
                covers: 'RTI delivery scope, instructor qualifications, curriculum alignment, assessment protocols, credential issuance process, reporting requirements',
              },
              {
                type: 'Program Holder Agreement',
                parties: 'Elevate + Authorized RTI Coordinator',
                covers: 'Coordination scope, curriculum management responsibilities, progress documentation requirements, instructional supervision chain, periodic review schedule',
              },
              {
                type: 'SME Instructor Agreement',
                parties: 'Elevate + Subject Matter Expert',
                covers: 'Supplemental instruction scope, credential verification, session documentation, curriculum compliance, liability and insurance',
              },
              {
                type: 'Employer OJT Agreement',
                parties: 'Elevate + Employer Partner',
                covers: 'Work process schedule, supervisor designation, wage progression (apprenticeship), evaluation schedule, safety compliance, hour verification process',
              },
            ].map((item, i) => (
              <div key={i} className="border rounded-lg p-5">
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
                  <span className="font-semibold text-gray-900">{item.type}</span>
                  <span className="text-xs text-gray-500 sm:ml-auto">{item.parties}</span>
                </div>
                <p className="text-gray-600 text-sm">
                  <span className="font-medium">Covers:</span> {item.covers}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-6 bg-white border rounded-lg p-4">
            <p className="text-sm text-gray-700">
              <span className="font-semibold">Disclosure:</span> Specific provider names, MOU documents, and instructor credential files are maintained in internal compliance records and disclosed to authorized reviewers (ETPL, DWD, DOL, workforce boards) upon request.
            </p>
          </div>
        </div>
      </section>

      {/* Navigation */}
      <section className="py-12">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex flex-wrap gap-3">
            <Link
              href="/instructional-framework"
              className="inline-flex items-center gap-2 px-4 py-2 bg-brand-blue-600 text-white rounded-lg text-sm font-medium hover:bg-brand-blue-700 transition"
            >
              Instructional Framework
            </Link>
            <Link
              href="/accreditation"
              className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-white transition"
            >
              Accreditation & Approvals
            </Link>
            <Link
              href="/workone-partner-packet"
              className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-white transition"
            >
              WorkOne Partner Packet
            </Link>
            <Link
              href="/pathways/training-model"
              className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-white transition"
            >
              How Training Works
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
