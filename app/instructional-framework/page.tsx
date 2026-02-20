import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import {
  Shield,
  GraduationCap,
  Building2,
  BookOpen,
  ClipboardCheck,
  Monitor,
  Users,
  Award,
  FileCheck,
  Clock,
  BarChart3,
  Layers,
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Instructional Delivery Framework | Elevate for Humanity',
  description:
    'Official instructional architecture for Elevate for Humanity. RTI delivery, OJT structure, provider tiers, competency tracking, and LMS documentation for registered apprenticeship and workforce training programs.',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/instructional-framework',
  },
};

/* ── Provider Tier Data ── */
const PROVIDER_TIERS = [
  {
    tier: 1,
    label: 'Credential Partners (State-Approved RTI Providers)',
    role: 'Primary Instruction',
    icon: GraduationCap,
    description:
      'State-approved or licensed instructional authorities that deliver occupation-specific classroom, clinical, and lab instruction. These are the primary RTI providers — their credentials match the occupation they teach.',
    requirements: [
      'State licensure or accreditation for the occupation taught',
      'Documented curriculum aligned to industry and DOL standards',
      'Qualified instructors with verifiable occupation-specific credentials',
      'Signed Memorandum of Understanding (MOU) with Elevate',
      'Credential match: license/approval must correspond to the program delivered',
    ],
    examples: 'Accredited nursing programs (CNA), ELDT-compliant CDL schools, DOE-approved trade schools, licensed barber schools',
  },
  {
    tier: 2,
    label: 'Program Holders (Authorized RTI Coordinators)',
    role: 'Curriculum Management & RTI Coordination',
    icon: FileCheck,
    description:
      'Credentialed operators who manage curriculum delivery and RTI coordination under licensed instructional supervision. Program Holders are not independent instructors — they coordinate RTI delivery, manage module sequencing, and ensure curriculum alignment between Credential Partners and Elevate standards.',
    requirements: [
      'Signed program holder agreement defining scope of coordination',
      'Demonstrated subject matter knowledge in the assigned occupation',
      'Operates under the instructional authority of a Tier 1 Credential Partner',
      'Responsible for RTI scheduling, module delivery, and progress documentation',
      'Subject to periodic program review by Elevate',
    ],
    examples: 'Barber apprenticeship coordinators, healthcare training managers, trade program leads',
  },
  {
    tier: 3,
    label: 'Credentialed Subject Matter Experts (SMEs)',
    role: 'Supplemental Instruction & Mentoring',
    icon: Award,
    description:
      'Industry professionals with occupation-specific credentials who provide supplemental instruction, mentoring, lab supervision, and module support. SMEs operate under Elevate curriculum oversight and are not sole RTI authorities — state-approved training providers are always involved in RTI delivery.',
    requirements: [
      'Active industry license or certification for the occupation',
      'Minimum 3 years of documented field experience',
      'Signed instructor agreement with defined scope of instruction',
      'Subject to Elevate curriculum standards and assessment protocols',
      'Credential must match the occupation being supported',
    ],
    examples: 'Licensed master barbers, EPA-certified HVAC technicians, CompTIA-certified IT professionals, AWS-certified welders',
  },
  {
    tier: 4,
    label: 'Employer Partners',
    role: 'On-the-Job Training (OJT)',
    icon: Building2,
    description:
      'Approved employers who provide structured workplace training under a documented work process schedule. OJT hours are tracked, supervised, and verified. For registered apprenticeship programs, employers commit to wage progression tied to skill milestones.',
    requirements: [
      'Signed OJT agreement with work process schedule',
      'Designated workplace supervisor for each apprentice or trainee',
      'Commitment to wage progression (registered apprenticeship programs)',
      'Monthly or quarterly evaluation submissions',
      'Compliance with workplace safety and labor standards',
    ],
    examples: 'Host barbershops, healthcare facilities, HVAC contractors, trucking companies, IT employers',
  },
];

/* ── RTI Program Hours ── */
const RTI_PROGRAMS = [
  { program: 'Barber Apprenticeship', totalHours: 2000, rtiHours: 144, ojtHours: 1500, method: 'In-Person + LMS', credential: 'Indiana Barber License', credentialIssuer: 'Indiana PLA / USDOL' },
  { program: 'CNA Certification', totalHours: 150, rtiHours: 105, ojtHours: 45, method: 'Hybrid', credential: 'CNA Certification', credentialIssuer: 'Indiana ISDH' },
  { program: 'CDL Commercial Driving', totalHours: 160, rtiHours: 40, ojtHours: 120, method: 'In-Person', credential: 'CDL Class A/B', credentialIssuer: 'Indiana BMV' },
  { program: 'HVAC Technician', totalHours: 400, rtiHours: 200, ojtHours: 200, method: 'Hybrid', credential: 'EPA 608 + OSHA 10', credentialIssuer: 'EPA / OSHA' },
  { program: 'IT Support', totalHours: 320, rtiHours: 280, ojtHours: 40, method: 'Online + Labs', credential: 'CompTIA A+', credentialIssuer: 'CompTIA' },
  { program: 'Cybersecurity', totalHours: 400, rtiHours: 360, ojtHours: 40, method: 'Online + Labs', credential: 'CompTIA Security+', credentialIssuer: 'CompTIA' },
  { program: 'Welding', totalHours: 400, rtiHours: 160, ojtHours: 240, method: 'In-Person', credential: 'AWS D1.1 + OSHA 10', credentialIssuer: 'AWS / OSHA' },
  { program: 'Electrical', totalHours: 400, rtiHours: 200, ojtHours: 200, method: 'Hybrid', credential: 'OSHA 10 + NCCER Core', credentialIssuer: 'OSHA / NCCER' },
];

/* ── Authorized RTI Provider Registry ── */
const RTI_REGISTRY = [
  { program: 'Barber Apprenticeship', credentialPartner: 'Licensed Barber School (State-Approved)', partnerType: 'State-Approved School', programHolder: 'Barber Apprenticeship Coordinator', rtiHours: 144, mouStatus: 'Required', credentialIssued: 'Indiana Barber License (PLA)' },
  { program: 'CNA Certification', credentialPartner: 'Accredited Nursing Program', partnerType: 'State-Approved School', programHolder: 'Healthcare Training Manager', rtiHours: 105, mouStatus: 'Required', credentialIssued: 'CNA Certification (ISDH)' },
  { program: 'CDL Commercial Driving', credentialPartner: 'ELDT-Compliant CDL School', partnerType: 'State-Approved School', programHolder: 'CDL Program Coordinator', rtiHours: 40, mouStatus: 'Required', credentialIssued: 'CDL Class A/B (BMV)' },
  { program: 'HVAC Technician', credentialPartner: 'DOE-Approved Trade School', partnerType: 'State-Approved School', programHolder: 'Trades Program Lead', rtiHours: 200, mouStatus: 'Required', credentialIssued: 'EPA 608 + OSHA 10' },
  { program: 'IT Support', credentialPartner: 'Authorized CompTIA Academy', partnerType: 'Authorized Training Center', programHolder: 'Technology Program Lead', rtiHours: 280, mouStatus: 'Required', credentialIssued: 'CompTIA A+' },
  { program: 'Cybersecurity', credentialPartner: 'Authorized CompTIA Academy', partnerType: 'Authorized Training Center', programHolder: 'Technology Program Lead', rtiHours: 360, mouStatus: 'Required', credentialIssued: 'CompTIA Security+' },
  { program: 'Welding', credentialPartner: 'AWS-Accredited Testing Facility', partnerType: 'State-Approved School', programHolder: 'Trades Program Lead', rtiHours: 160, mouStatus: 'Required', credentialIssued: 'AWS D1.1 + OSHA 10' },
  { program: 'Electrical', credentialPartner: 'DOE-Approved Trade School', partnerType: 'State-Approved School', programHolder: 'Trades Program Lead', rtiHours: 200, mouStatus: 'Required', credentialIssued: 'OSHA 10 + NCCER Core' },
];

export default function InstructionalFrameworkPage() {
  return (
    <div className="bg-white min-h-screen">
      {/* Breadcrumbs */}
      <div className="bg-slate-50 border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'Instructional Framework' }]} />
        </div>
      </div>

      {/* Hero */}
      <section className="relative h-[260px] sm:h-[340px]">
        <Image
          src="/images/programs-hq/training-classroom.jpg"
          alt="Instructor-led classroom training session"
          fill
          sizes="100vw"
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-10">
          <div className="max-w-6xl mx-auto">
            <p className="text-white/80 text-sm font-medium uppercase tracking-wider mb-2">
              Official Compliance Document
            </p>
            <h1 className="text-3xl sm:text-4xl font-bold text-white">
              Instructional Delivery Framework
            </h1>
          </div>
        </div>
      </section>

      {/* Governance Statement */}
      <section className="py-12 bg-white">
        <div className="max-w-4xl mx-auto px-4">
          <div className="border-l-4 border-brand-blue-600 pl-6 mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-3">RTI Governance Statement</h2>
            <p className="text-gray-700 leading-relaxed">
              Related Technical Instruction (RTI) is delivered through state-approved training
              providers and licensed credential partners aligned to occupation-specific curriculum.
              Authorized program holders coordinate curriculum delivery and RTI scheduling under
              licensed instructional supervision. Credentialed subject matter experts provide
              supplemental instruction, mentoring, and supervised module support. On-the-Job
              Training (OJT) is conducted by approved employer partners in real work environments
              under documented work process schedules. All instruction is tracked through the
              institutional Learning Management System (LMS) under centralized program oversight
              by Elevate for Humanity.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 gap-6 mb-8">
            <div className="bg-slate-50 rounded-lg p-5">
              <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                <Shield className="w-5 h-5 text-brand-blue-600" />
                Institutional Classification
              </h3>
              <p className="text-gray-700 text-sm">
                Hybrid Workforce Training Provider — Registered Apprenticeship Sponsor with
                authorized RTI providers and employer OJT sites operating under centralized
                curriculum oversight.
              </p>
            </div>
            <div className="bg-slate-50 rounded-lg p-5">
              <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                <FileCheck className="w-5 h-5 text-brand-blue-600" />
                Curriculum Ownership
              </h3>
              <p className="text-gray-700 text-sm">
                Elevate maintains curriculum standards and assessment protocols for all programs.
                RTI providers deliver instruction under these standards. Curriculum alignment is
                verified through MOU agreements and periodic program reviews.
              </p>
            </div>
          </div>

          <h2 className="text-2xl font-bold text-gray-900 mb-2">Instructional Authority Hierarchy</h2>
          <p className="text-gray-600 mb-6">
            Six-level accountability structure defining who is responsible at each stage of training delivery.
          </p>

          <div className="space-y-4">
            {[
              { role: 'Sponsor (Oversight & Compliance)', entity: 'Elevate for Humanity', detail: 'Curriculum standards, enrollment, funding navigation, progress tracking, credential verification, RAPIDS registration, ETPL compliance, institutional accountability' },
              { role: 'Primary RTI Providers', entity: 'State-Approved / Licensed Credential Partners', detail: 'Occupation-specific classroom instruction, clinical rotations, lab sessions, certification exam preparation. Credentials must match the occupation taught.' },
              { role: 'Program Holders', entity: 'Authorized Curriculum Managers & RTI Coordinators', detail: 'Curriculum delivery coordination, module sequencing, RTI scheduling, progress documentation. Operate under licensed instructional supervision of Tier 1 Credential Partners.' },
              { role: 'Subject Matter Experts', entity: 'Credentialed SMEs (Supplemental Instruction)', detail: 'Mentoring, supplemental labs, module support, practice sessions. Not sole RTI authorities — state-approved providers are always involved.' },
              { role: 'Employer Partners', entity: 'OJT Providers (Hands-On Apprenticeship Training)', detail: 'Structured workplace training under documented work process schedules, supervisor verification, wage progression, periodic evaluations.' },
              { role: 'Central Compliance System', entity: 'Institutional LMS', detail: 'Single system of record for RTI attendance, module completion, assessments, instructor verification, OJT hour logging, and cohort progress reporting.' },
            ].map((item, i) => (
              <div key={i} className="flex gap-4 items-start bg-gray-50 rounded-lg p-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-brand-blue-600 text-white flex items-center justify-center text-sm font-bold">
                  {i + 1}
                </div>
                <div>
                  <p className="font-semibold text-gray-900">{item.role}</p>
                  <p className="text-brand-blue-700 text-sm font-medium">{item.entity}</p>
                  <p className="text-gray-600 text-sm mt-1">{item.detail}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Role Definitions */}
          <div className="mt-10 bg-amber-50 border border-amber-200 rounded-lg p-6">
            <h3 className="font-bold text-gray-900 mb-3">Formal Role Definitions</h3>
            <p className="text-sm text-gray-600 mb-4">
              These definitions standardize terminology across all compliance documents, partnership packets, and ETPL submissions.
            </p>
            <dl className="space-y-3 text-sm">
              <div>
                <dt className="font-semibold text-gray-900">Credential Partner</dt>
                <dd className="text-gray-700 ml-4">A state-approved or licensed instructional authority whose credentials match the occupation they teach. Credential Partners are the primary RTI providers and may issue industry certifications.</dd>
              </div>
              <div>
                <dt className="font-semibold text-gray-900">Program Holder</dt>
                <dd className="text-gray-700 ml-4">An authorized RTI coordinator who manages curriculum delivery under the instructional supervision of a Credential Partner. Program Holders are not independent instructors — they coordinate scheduling, module delivery, and progress documentation.</dd>
              </div>
              <div>
                <dt className="font-semibold text-gray-900">Subject Matter Expert (SME)</dt>
                <dd className="text-gray-700 ml-4">An industry professional with occupation-specific credentials who provides supplemental instruction, mentoring, and lab support. SMEs are never the sole RTI authority for any program.</dd>
              </div>
              <div>
                <dt className="font-semibold text-gray-900">Employer Partner</dt>
                <dd className="text-gray-700 ml-4">An approved employer providing structured OJT under a documented work process schedule with designated supervisors and periodic evaluations.</dd>
              </div>
            </dl>
          </div>
        </div>
      </section>

      {/* Provider Tier System */}
      <section className="py-12 bg-slate-50">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Provider Tier System</h2>
          <p className="text-gray-600 mb-8">
            All instructional partners are classified into three tiers based on authorization
            level, credential requirements, and scope of instruction.
          </p>

          <div className="space-y-6">
            {PROVIDER_TIERS.map((tier) => {
              const Icon = tier.icon;
              return (
                <div key={tier.tier} className="bg-white rounded-xl border p-6">
                  <div className="flex items-start gap-4 mb-4">
                    <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-brand-blue-50 flex items-center justify-center">
                      <Icon className="w-6 h-6 text-brand-blue-600" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-bold text-brand-blue-600 bg-brand-blue-50 px-2 py-0.5 rounded">
                          TIER {tier.tier}
                        </span>
                        <span className="text-xs text-gray-500">{tier.role}</span>
                      </div>
                      <h3 className="text-lg font-bold text-gray-900">{tier.label}</h3>
                    </div>
                  </div>
                  <p className="text-gray-700 text-sm mb-4">{tier.description}</p>
                  <div className="mb-3">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                      Requirements
                    </p>
                    <ul className="space-y-1">
                      {tier.requirements.map((req, i) => (
                        <li key={i} className="text-sm text-gray-700 flex items-start gap-2">
                          <ClipboardCheck className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                          {req}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <p className="text-xs text-gray-500">
                    <span className="font-medium">Examples:</span> {tier.examples}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* RTI Hours Table */}
      <section className="py-12 bg-white">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">RTI Hour Structure by Program</h2>
          <p className="text-gray-600 mb-6">
            Fixed RTI hour minimums per program regardless of provider. All hours are tracked
            through the institutional LMS.
          </p>

          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-slate-50">
                  <th className="text-left p-3 font-semibold text-gray-900 border-b">Program</th>
                  <th className="text-center p-3 font-semibold text-gray-900 border-b">Total Hours</th>
                  <th className="text-center p-3 font-semibold text-gray-900 border-b">RTI Hours</th>
                  <th className="text-center p-3 font-semibold text-gray-900 border-b">OJT Hours</th>
                  <th className="text-left p-3 font-semibold text-gray-900 border-b">Delivery</th>
                  <th className="text-left p-3 font-semibold text-gray-900 border-b">Credential</th>
                  <th className="text-left p-3 font-semibold text-gray-900 border-b">Issued By</th>
                </tr>
              </thead>
              <tbody>
                {RTI_PROGRAMS.map((p, i) => (
                  <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
                    <td className="p-3 font-medium text-gray-900 border-b">{p.program}</td>
                    <td className="p-3 text-center text-gray-700 border-b">{p.totalHours.toLocaleString()}</td>
                    <td className="p-3 text-center text-brand-blue-700 font-medium border-b">{p.rtiHours}</td>
                    <td className="p-3 text-center text-gray-700 border-b">{p.ojtHours.toLocaleString()}</td>
                    <td className="p-3 text-gray-700 border-b">{p.method}</td>
                    <td className="p-3 text-gray-700 border-b">{p.credential}</td>
                    <td className="p-3 text-gray-700 border-b text-xs">{p.credentialIssuer}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Authorized RTI Provider Registry */}
      <section className="py-12 bg-slate-50">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Authorized RTI Provider Registry</h2>
          <p className="text-gray-600 mb-6">
            Per-program registry of credential partners, program holders, and RTI authorization.
            This registry answers the question: &ldquo;Who delivers RTI for each program?&rdquo;
          </p>

          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-white">
                  <th className="text-left p-3 font-semibold text-gray-900 border-b">Program</th>
                  <th className="text-left p-3 font-semibold text-gray-900 border-b">Credential Partner</th>
                  <th className="text-left p-3 font-semibold text-gray-900 border-b">Partner Type</th>
                  <th className="text-left p-3 font-semibold text-gray-900 border-b">Program Holder</th>
                  <th className="text-center p-3 font-semibold text-gray-900 border-b">RTI Hours</th>
                  <th className="text-center p-3 font-semibold text-gray-900 border-b">MOU</th>
                  <th className="text-left p-3 font-semibold text-gray-900 border-b">Credential Issued</th>
                </tr>
              </thead>
              <tbody>
                {RTI_REGISTRY.map((r, i) => (
                  <tr key={i} className={i % 2 === 0 ? 'bg-slate-50/50' : 'bg-white'}>
                    <td className="p-3 font-medium text-gray-900 border-b">{r.program}</td>
                    <td className="p-3 text-gray-700 border-b">{r.credentialPartner}</td>
                    <td className="p-3 text-gray-700 border-b text-xs">{r.partnerType}</td>
                    <td className="p-3 text-gray-700 border-b">{r.programHolder}</td>
                    <td className="p-3 text-center text-brand-blue-700 font-medium border-b">{r.rtiHours}</td>
                    <td className="p-3 text-center border-b">
                      <span className="text-xs font-medium text-green-700 bg-green-50 px-2 py-0.5 rounded">{r.mouStatus}</span>
                    </td>
                    <td className="p-3 text-gray-700 border-b text-xs">{r.credentialIssued}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-6 bg-white border rounded-lg p-4">
            <p className="text-sm text-gray-700">
              <span className="font-semibold">Note:</span> Specific provider names are maintained in internal compliance files and disclosed to authorized reviewers (ETPL, DWD, DOL, workforce boards) upon request. This public registry documents the structural framework and provider type requirements.
            </p>
          </div>
        </div>
      </section>

      {/* Competency & Assessment */}
      <section className="py-12 bg-slate-50">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Competency Tracking & Assessment</h2>
          <p className="text-gray-600 mb-8">
            How student progress is measured, documented, and reported across all programs.
          </p>

          <div className="grid sm:grid-cols-2 gap-6">
            {[
              {
                icon: Monitor,
                title: 'LMS Module Completion',
                desc: 'Structured modules with required completion thresholds. Progress is recorded automatically and visible to students, instructors, and program administrators.',
              },
              {
                icon: ClipboardCheck,
                title: 'Competency Examinations',
                desc: 'Occupation-specific assessments administered at defined milestones. Results are documented in the student record and used for certification readiness determination.',
              },
              {
                icon: Users,
                title: 'Instructor Verification',
                desc: 'RTI providers and SMEs submit attendance records and skill evaluations. Instructor sign-off is required before advancing to the next training phase.',
              },
              {
                icon: BarChart3,
                title: 'Employer OJT Evaluations',
                desc: 'Workplace supervisors complete monthly or quarterly evaluations documenting skill acquisition, hours completed, and readiness for independent work.',
              },
              {
                icon: BookOpen,
                title: 'AI-Assisted Tutoring',
                desc: 'AI tutoring provides reinforcement and individualized learning support within the supervised instructional framework. It is an academic support tool, not a primary instructor or credential authority.',
              },
              {
                icon: Layers,
                title: 'Progress Reporting',
                desc: 'Cohort sponsors and workforce partners receive structured progress reports including RTI hours completed, OJT hours logged, assessment scores, and projected completion dates.',
              },
            ].map((item, i) => {
              const Icon = item.icon;
              return (
                <div key={i} className="bg-white rounded-lg border p-5">
                  <Icon className="w-5 h-5 text-brand-blue-600 mb-3" />
                  <h3 className="font-semibold text-gray-900 mb-2">{item.title}</h3>
                  <p className="text-gray-600 text-sm">{item.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* OJT Structure */}
      <section className="py-12 bg-white">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Employer OJT Structure</h2>
          <p className="text-gray-600 mb-6">
            On-the-Job Training requirements for employer partners participating in registered
            apprenticeship and workforce training programs.
          </p>

          <div className="space-y-4">
            {[
              {
                title: 'Work Process Schedule',
                desc: 'Each OJT employer receives a documented work process schedule specifying the hour breakdown by skill area. This schedule is aligned to the occupation and filed with the apprenticeship registration.',
              },
              {
                title: 'Supervisor Verification',
                desc: 'A designated workplace supervisor is assigned to each apprentice or trainee. The supervisor documents hours, verifies skill acquisition, and submits evaluations through the LMS or standardized reporting forms.',
              },
              {
                title: 'Wage Progression',
                desc: 'For registered apprenticeship programs, employer partners commit to a wage progression schedule tied to skill milestones. Wage increases are documented and reported as part of the apprenticeship record.',
              },
              {
                title: 'Periodic Evaluations',
                desc: 'Employers submit monthly or quarterly evaluations covering attendance, skill development, workplace conduct, and readiness for advancement. These evaluations are maintained in the student file.',
              },
            ].map((item, i) => (
              <div key={i} className="border rounded-lg p-5">
                <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-brand-blue-600" />
                  {item.title}
                </h3>
                <p className="text-gray-600 text-sm">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Credential Issuance */}
      <section className="py-12 bg-slate-50">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Credential Issuance (Dual-Issuer Model)</h2>
          <p className="text-gray-600 mb-6">
            Elevate operates a dual-issuer model: credential partners and certifying bodies issue
            industry credentials, while Elevate issues program completion certificates. This
            separation ensures credential legitimacy and clear institutional accountability.
          </p>

          <div className="space-y-4">
            {[
              {
                type: 'Industry Credential',
                issuer: 'Credential Partner or Certifying Body',
                color: 'bg-brand-blue-50 border-brand-blue-200',
                examples: 'CNA certification (Indiana ISDH), CDL license (Indiana BMV), CompTIA A+ (CompTIA), EPA 608 (EPA), Indiana Barber License (PLA), AWS D1.1 (AWS)',
                note: 'Issued by the licensed authority — not by Elevate. Elevate facilitates enrollment, training, and exam preparation.',
              },
              {
                type: 'Certificate of Completion',
                issuer: 'Elevate for Humanity',
                color: 'bg-green-50 border-green-200',
                examples: 'Program completion certificates, module completion records, workforce readiness certificates, RTI hour documentation',
                note: 'Documents that the student completed the Elevate training pathway. Does not replace industry credentials.',
              },
              {
                type: 'Apprenticeship Credential',
                issuer: 'U.S. Department of Labor / State Apprenticeship Agency',
                color: 'bg-amber-50 border-amber-200',
                examples: 'Certificate of Completion of Apprenticeship issued through the registered apprenticeship framework (RAPIDS)',
                note: 'Federal credential issued upon completion of all RTI and OJT requirements under the registered apprenticeship.',
              },
            ].map((item, i) => (
              <div key={i} className={`rounded-lg border p-5 ${item.color}`}>
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
                  <span className="font-semibold text-gray-900">{item.type}</span>
                  <span className="text-xs text-gray-500 sm:ml-auto">Issued by: {item.issuer}</span>
                </div>
                <p className="text-gray-700 text-sm mb-2">{item.examples}</p>
                <p className="text-gray-500 text-xs italic">{item.note}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Registration & Links */}
      <section className="py-12 bg-white">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Registration & Compliance References</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="bg-slate-50 rounded-lg p-5">
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Registered Apprenticeship Sponsor</p>
              <p className="font-semibold text-gray-900">RAPIDS ID: 2025-IN-132301</p>
              <p className="text-sm text-gray-600 mt-1">Sponsor of Record: 2Exclusive LLC (DBA Elevate for Humanity)</p>
            </div>
            <div className="bg-slate-50 rounded-lg p-5">
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">ETPL / INTraining</p>
              <p className="font-semibold text-gray-900">Location ID: 10004621</p>
              <p className="text-sm text-gray-600 mt-1">Indiana Department of Workforce Development</p>
            </div>
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/accreditation"
              className="inline-flex items-center gap-2 px-4 py-2 bg-brand-blue-600 text-white rounded-lg text-sm font-medium hover:bg-brand-blue-700 transition"
            >
              Accreditation & Approvals
            </Link>
            <Link
              href="/workone-partner-packet"
              className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition"
            >
              WorkOne Partner Packet
            </Link>
            <Link
              href="/pathways/training-model"
              className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition"
            >
              How Training Works
            </Link>
            <Link
              href="/instructor-credentials"
              className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition"
            >
              Instructor Credentials
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
