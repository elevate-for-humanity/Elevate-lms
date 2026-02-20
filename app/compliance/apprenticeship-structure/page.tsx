
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
  Monitor,
  Users,
  CheckCircle,
} from 'lucide-react';
import { PrintButton } from './PrintButton';

export const metadata: Metadata = {
  title: 'Apprenticeship & RTI Structure | Compliance | Elevate for Humanity',
  description:
    'Master compliance document: institutional hierarchy, RTI delivery model, OJT structure, credential issuance chain, and per-program hour mapping for registered apprenticeship and workforce training programs.',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/compliance/apprenticeship-structure',
  },
};

/* ── Per-Program RTI/OJT Hour Map ── */
const PROGRAM_HOURS = [
  { program: 'Barber Apprenticeship', occupation: 'Barber (330.371-010)', rtiHours: 144, ojtHours: 1500, totalHours: 2000, rtiMethod: 'In-Person + LMS', credential: 'Indiana Barber License', issuer: 'Indiana PLA', registered: true },
  { program: 'CNA Certification', occupation: 'Nursing Assistant', rtiHours: 105, ojtHours: 45, totalHours: 150, rtiMethod: 'Hybrid', credential: 'CNA Certification', issuer: 'Indiana ISDH', registered: false },
  { program: 'CDL Commercial Driving', occupation: 'Commercial Driver', rtiHours: 40, ojtHours: 120, totalHours: 160, rtiMethod: 'In-Person', credential: 'CDL Class A/B', issuer: 'Indiana BMV', registered: false },
  { program: 'HVAC Technician', occupation: 'HVAC Installer/Technician', rtiHours: 200, ojtHours: 200, totalHours: 400, rtiMethod: 'Hybrid', credential: 'EPA 608 + OSHA 10', issuer: 'EPA / OSHA', registered: false },
  { program: 'IT Support', occupation: 'IT Support Specialist', rtiHours: 280, ojtHours: 40, totalHours: 320, rtiMethod: 'Online + Labs', credential: 'CompTIA A+', issuer: 'CompTIA', registered: false },
  { program: 'Cybersecurity', occupation: 'Cybersecurity Analyst', rtiHours: 360, ojtHours: 40, totalHours: 400, rtiMethod: 'Online + Labs', credential: 'CompTIA Security+', issuer: 'CompTIA', registered: false },
  { program: 'Welding', occupation: 'Welder', rtiHours: 160, ojtHours: 240, totalHours: 400, rtiMethod: 'In-Person', credential: 'AWS D1.1 + OSHA 10', issuer: 'AWS / OSHA', registered: false },
  { program: 'Electrical', occupation: 'Electrician', rtiHours: 200, ojtHours: 200, totalHours: 400, rtiMethod: 'Hybrid', credential: 'OSHA 10 + NCCER Core', issuer: 'OSHA / NCCER', registered: false },
];

export default function ApprenticeshipStructurePage() {

  return (
    <div className="bg-white min-h-screen print:bg-white">
      {/* Breadcrumbs — hidden on print */}
      <div className="bg-slate-50 border-b print:hidden">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[
            { label: 'Compliance', href: '/compliance' },
            { label: 'Apprenticeship & RTI Structure' },
          ]} />
        </div>
      </div>

      {/* Hero — hidden on print */}
      <section className="relative h-[240px] sm:h-[300px] print:hidden">
        <Image
          src="/images/heroes-hq/programs-hero.jpg"
          alt="Workforce training program overview"
          fill
          sizes="100vw"
          className="object-cover"
          priority quality={90}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-10">
          <div className="max-w-6xl mx-auto">
            <p className="text-white/80 text-sm font-medium uppercase tracking-wider mb-2">
              Master Compliance Document
            </p>
            <h1 className="text-3xl sm:text-4xl font-bold text-white">
              Apprenticeship & RTI Structure
            </h1>
          </div>
        </div>
      </section>

      {/* Print header — visible only on print */}
      <div className="hidden print:block px-8 pt-8 pb-4 border-b-2 border-gray-900">
        <h1 className="text-2xl font-bold text-gray-900">Apprenticeship & RTI Structure</h1>
        <p className="text-sm text-gray-600">Elevate for Humanity — Master Compliance Document</p>
        <p className="text-xs text-gray-500 mt-1">RAPIDS ID: 2025-IN-132301 | INTraining Location ID: 10004621</p>
      </div>

      {/* Document Purpose */}
      <section className="py-10 bg-white">
        <div className="max-w-4xl mx-auto px-4">
          <div className="border-l-4 border-brand-blue-600 pl-6 mb-8 print:border-gray-900">
            <h2 className="text-lg font-bold text-gray-900 mb-2">Document Purpose</h2>
            <p className="text-gray-700 text-sm leading-relaxed">
              This document defines the institutional structure for apprenticeship and workforce
              training programs operated under Elevate for Humanity. It serves as the backbone
              reference for workforce boards, ETPL reviewers, partnership due diligence, grant
              evaluators, and DOL apprenticeship audits. All roles, hour structures, and
              credential chains documented here are binding across all programs.
            </p>
          </div>

          {/* Registration */}
          <div className="grid sm:grid-cols-2 gap-4 mb-10">
            <div className="bg-slate-50 rounded-lg p-5 print:border print:bg-white">
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Registered Apprenticeship Sponsor</p>
              <p className="font-bold text-gray-900">2Exclusive LLC (DBA Elevate for Humanity)</p>
              <p className="text-sm text-gray-600 mt-1">RAPIDS ID: 2025-IN-132301</p>
            </div>
            <div className="bg-slate-50 rounded-lg p-5 print:border print:bg-white">
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">ETPL / INTraining</p>
              <p className="font-bold text-gray-900">Location ID: 10004621</p>
              <p className="text-sm text-gray-600 mt-1">Indiana Department of Workforce Development (DWD)</p>
            </div>
          </div>
        </div>
      </section>

      {/* Institutional Hierarchy */}
      <section className="py-10 bg-slate-50 print:bg-white print:border-t">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Institutional Hierarchy</h2>
          <p className="text-gray-600 text-sm mb-6">
            Six-level accountability structure. Each level has defined authority, scope, and documentation requirements.
          </p>

          <div className="space-y-3">
            {[
              { level: 1, role: 'Sponsor (Oversight & Compliance)', entity: 'Elevate for Humanity', icon: Shield, scope: 'RAPIDS registration, ETPL compliance, curriculum standards, enrollment management, funding navigation, progress tracking, credential verification, institutional accountability. Final authority on all program decisions.' },
              { level: 2, role: 'Primary RTI Providers (Credential Partners)', entity: 'State-Approved / Licensed Training Institutions', icon: GraduationCap, scope: 'Occupation-specific classroom instruction, clinical rotations, lab sessions, certification exam preparation. Credentials must match the occupation taught. Operate under signed MOU with Elevate.' },
              { level: 3, role: 'Program Holders (RTI Coordinators)', entity: 'Authorized Curriculum Managers', icon: FileCheck, scope: 'Curriculum delivery coordination, module sequencing, RTI scheduling, progress documentation. Operate under the instructional authority of Tier 2 Credential Partners. Not independent instructors.' },
              { level: 4, role: 'Subject Matter Experts (SMEs)', entity: 'Credentialed Industry Professionals', icon: Award, scope: 'Supplemental instruction, mentoring, lab supervision, module support. Never sole RTI authority — state-approved providers are always involved in RTI delivery for every program.' },
              { level: 5, role: 'Employer Partners (OJT Providers)', entity: 'Approved Employers', icon: Building2, scope: 'Structured workplace training under documented work process schedules, designated supervisors, wage progression (registered apprenticeship), monthly/quarterly evaluations.' },
              { level: 6, role: 'Central Compliance System', entity: 'Institutional LMS', icon: Monitor, scope: 'Single system of record for RTI attendance, module completion, assessments, instructor verification, OJT hour logging, cohort progress reporting. Serves as the compliance documentation backbone.' },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.level} className="flex gap-4 items-start bg-white rounded-lg p-4 border print:border-gray-300">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-brand-blue-600 text-white flex items-center justify-center text-sm font-bold print:bg-gray-900">
                    {item.level}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Icon className="w-4 h-4 text-brand-blue-600 print:text-gray-700" />
                      <p className="font-bold text-gray-900 text-sm">{item.role}</p>
                    </div>
                    <p className="text-brand-blue-700 text-xs font-medium mb-1 print:text-gray-700">{item.entity}</p>
                    <p className="text-gray-600 text-xs leading-relaxed">{item.scope}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* RTI/OJT Hour Map */}
      <section className="py-10 bg-white">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">RTI & OJT Hour Structure by Program</h2>
          <p className="text-gray-600 text-sm mb-6">
            Fixed hour minimums per program. These are not flexible — they apply regardless of
            which credential partner delivers RTI. All hours are tracked through the institutional LMS.
          </p>

          <div className="overflow-x-auto">
            <table className="w-full text-xs border-collapse print:text-[10px]">
              <thead>
                <tr className="bg-slate-50 print:bg-gray-100">
                  <th className="text-left p-2.5 font-semibold text-gray-900 border-b">Program</th>
                  <th className="text-left p-2.5 font-semibold text-gray-900 border-b">Occupation</th>
                  <th className="text-center p-2.5 font-semibold text-gray-900 border-b">RTI Hrs</th>
                  <th className="text-center p-2.5 font-semibold text-gray-900 border-b">OJT Hrs</th>
                  <th className="text-center p-2.5 font-semibold text-gray-900 border-b">Total</th>
                  <th className="text-left p-2.5 font-semibold text-gray-900 border-b">RTI Method</th>
                  <th className="text-left p-2.5 font-semibold text-gray-900 border-b">Credential</th>
                  <th className="text-left p-2.5 font-semibold text-gray-900 border-b">Issued By</th>
                  <th className="text-center p-2.5 font-semibold text-gray-900 border-b">RAPIDS</th>
                </tr>
              </thead>
              <tbody>
                {PROGRAM_HOURS.map((p, i) => (
                  <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
                    <td className="p-2.5 font-medium text-gray-900 border-b">{p.program}</td>
                    <td className="p-2.5 text-gray-600 border-b">{p.occupation}</td>
                    <td className="p-2.5 text-center text-brand-blue-700 font-semibold border-b print:text-gray-900">{p.rtiHours}</td>
                    <td className="p-2.5 text-center text-gray-700 border-b">{p.ojtHours.toLocaleString()}</td>
                    <td className="p-2.5 text-center font-semibold text-gray-900 border-b">{p.totalHours.toLocaleString()}</td>
                    <td className="p-2.5 text-gray-600 border-b">{p.rtiMethod}</td>
                    <td className="p-2.5 text-gray-700 border-b">{p.credential}</td>
                    <td className="p-2.5 text-gray-600 border-b">{p.issuer}</td>
                    <td className="p-2.5 text-center border-b">
                      {p.registered ? (
                        <span className="text-green-700 font-semibold">Yes</span>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className="text-xs text-gray-500 mt-3">
            RAPIDS column indicates programs currently registered under USDOL Registered Apprenticeship.
            Non-RAPIDS programs follow the same RTI/OJT structure for institutional consistency.
          </p>
        </div>
      </section>

      {/* Credential Issuance Chain */}
      <section className="py-10 bg-slate-50 print:bg-white print:border-t">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Credential Issuance Chain</h2>
          <p className="text-gray-600 text-sm mb-6">
            Dual-issuer model. Elevate does not issue industry credentials. Credential partners
            and certifying bodies issue industry credentials. Elevate issues program completion
            certificates.
          </p>

          <div className="space-y-4">
            <div className="bg-brand-blue-50 border border-brand-blue-200 rounded-lg p-5 print:bg-white print:border-gray-300">
              <div className="flex items-center gap-2 mb-2">
                <GraduationCap className="w-5 h-5 text-brand-blue-600 print:text-gray-700" />
                <h3 className="font-bold text-gray-900">Industry Credentials</h3>
                <span className="text-xs text-gray-500 ml-auto">Issued by: Credential Partner or Certifying Body</span>
              </div>
              <p className="text-sm text-gray-700 mb-2">
                CNA (ISDH), CDL (BMV), CompTIA A+ (CompTIA), CompTIA Security+ (CompTIA),
                EPA 608 (EPA), AWS D1.1 (AWS), Indiana Barber License (PLA), OSHA 10/30 (OSHA),
                NCCER Core (NCCER)
              </p>
              <p className="text-xs text-gray-500 italic">
                Elevate facilitates enrollment, training, and exam preparation. The credential is issued by the licensed authority.
              </p>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-5 print:bg-white print:border-gray-300">
              <div className="flex items-center gap-2 mb-2">
                <FileCheck className="w-5 h-5 text-green-600 print:text-gray-700" />
                <h3 className="font-bold text-gray-900">Completion Certificates</h3>
                <span className="text-xs text-gray-500 ml-auto">Issued by: Elevate for Humanity</span>
              </div>
              <p className="text-sm text-gray-700 mb-2">
                Program completion certificates, module completion records, workforce readiness
                certificates, RTI hour documentation
              </p>
              <p className="text-xs text-gray-500 italic">
                Documents that the student completed the Elevate training pathway. Does not replace industry credentials.
              </p>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-5 print:bg-white print:border-gray-300">
              <div className="flex items-center gap-2 mb-2">
                <Shield className="w-5 h-5 text-amber-600 print:text-gray-700" />
                <h3 className="font-bold text-gray-900">Apprenticeship Credentials</h3>
                <span className="text-xs text-gray-500 ml-auto">Issued by: USDOL / State Apprenticeship Agency</span>
              </div>
              <p className="text-sm text-gray-700 mb-2">
                Certificate of Completion of Apprenticeship issued through the registered
                apprenticeship framework upon completion of all RTI and OJT requirements.
              </p>
              <p className="text-xs text-gray-500 italic">
                Federal credential. Elevate is the registered sponsor; DOL issues the completion certificate.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* RTI Delivery Model */}
      <section className="py-10 bg-white">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">RTI Delivery Model</h2>
          <p className="text-gray-600 text-sm mb-6">
            How Related Technical Instruction is delivered, tracked, and validated.
          </p>

          <div className="bg-gray-50 rounded-lg p-6 border print:bg-white">
            <p className="text-sm text-gray-700 leading-relaxed mb-4">
              Related Technical Instruction (RTI) is delivered through state-approved training
              providers and licensed credential partners aligned to occupation-specific curriculum.
              Authorized program holders coordinate curriculum delivery and RTI scheduling under
              licensed instructional supervision. Credentialed subject matter experts provide
              supplemental instruction, mentoring, and supervised module support. All RTI is
              tracked through the institutional LMS under centralized program oversight.
            </p>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">RTI Delivery Sources</p>
                <ul className="space-y-1 text-sm text-gray-700">
                  <li className="flex items-start gap-2"><CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />Licensed/State-Approved Training Providers</li>
                  <li className="flex items-start gap-2"><CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />Credentialed Subject Matter Experts (supplemental)</li>
                  <li className="flex items-start gap-2"><CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />LMS Modules (structured, tracked)</li>
                  <li className="flex items-start gap-2"><CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />AI-Assisted Tutoring (academic support, not primary instruction)</li>
                </ul>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">RTI Compliance Controls</p>
                <ul className="space-y-1 text-sm text-gray-700">
                  <li className="flex items-start gap-2"><CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />Credential match: instructor license matches occupation</li>
                  <li className="flex items-start gap-2"><CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />Fixed RTI hour minimums per program</li>
                  <li className="flex items-start gap-2"><CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />MOU-governed partner relationships</li>
                  <li className="flex items-start gap-2"><CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />LMS as single system of record</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* OJT Structure */}
      <section className="py-10 bg-slate-50 print:bg-white print:border-t">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">OJT Structure</h2>
          <p className="text-gray-600 text-sm mb-6">
            On-the-Job Training requirements for employer partners.
          </p>

          <div className="grid sm:grid-cols-2 gap-4">
            {[
              { title: 'Work Process Schedule', desc: 'Documented hour breakdown by skill area, aligned to occupation, filed with apprenticeship registration.' },
              { title: 'Supervisor Designation', desc: 'Named workplace supervisor for each apprentice/trainee. Responsible for hour verification and skill sign-off.' },
              { title: 'Wage Progression', desc: 'Registered apprenticeship programs include wage increases tied to skill milestones. Documented in apprenticeship record.' },
              { title: 'Periodic Evaluations', desc: 'Monthly or quarterly evaluations covering attendance, skill development, workplace conduct, and advancement readiness.' },
            ].map((item, i) => (
              <div key={i} className="bg-white rounded-lg border p-4 print:bg-white">
                <h3 className="font-semibold text-gray-900 text-sm mb-1">{item.title}</h3>
                <p className="text-gray-600 text-xs">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Competency Verification */}
      <section className="py-10 bg-white">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Competency-Based Assessment</h2>
          <p className="text-gray-600 text-sm mb-6">
            All programs use competency-based assessment aligned to industry skill standards.
            Competencies are mapped to specific RTI hours, OJT hours, assessment methods, and
            objective pass criteria. Full rubric documentation is maintained in the
            {' '}<Link href="/compliance/competency-verification" className="text-brand-blue-600 underline hover:text-brand-blue-700">Competency Verification Matrix</Link>.
          </p>

          <div className="grid sm:grid-cols-2 gap-4 mb-6">
            <div className="bg-slate-50 rounded-lg p-4 print:border print:bg-white">
              <p className="font-semibold text-gray-900 text-sm mb-2">Assessment Authority</p>
              <ul className="space-y-1 text-xs text-gray-700">
                <li className="flex items-start gap-2"><CheckCircle className="w-3.5 h-3.5 text-green-600 flex-shrink-0 mt-0.5" />RTI competencies → Credential Partner / Instructor</li>
                <li className="flex items-start gap-2"><CheckCircle className="w-3.5 h-3.5 text-green-600 flex-shrink-0 mt-0.5" />OJT competencies → Employer Supervisor</li>
                <li className="flex items-start gap-2"><CheckCircle className="w-3.5 h-3.5 text-green-600 flex-shrink-0 mt-0.5" />Final completion → Program Holder + Sponsor</li>
              </ul>
            </div>
            <div className="bg-slate-50 rounded-lg p-4 print:border print:bg-white">
              <p className="font-semibold text-gray-900 text-sm mb-2">Evaluation Checkpoints</p>
              <ul className="space-y-1 text-xs text-gray-700">
                <li className="flex items-start gap-2"><CheckCircle className="w-3.5 h-3.5 text-green-600 flex-shrink-0 mt-0.5" />30-day evaluation (initial progress)</li>
                <li className="flex items-start gap-2"><CheckCircle className="w-3.5 h-3.5 text-green-600 flex-shrink-0 mt-0.5" />Midpoint evaluation (competency milestone)</li>
                <li className="flex items-start gap-2"><CheckCircle className="w-3.5 h-3.5 text-green-600 flex-shrink-0 mt-0.5" />Final review (certification readiness)</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* LMS as Compliance System */}
      <section className="py-10 bg-slate-50 print:bg-white print:border-t">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">LMS as Compliance Record System</h2>
          <p className="text-gray-600 text-sm mb-6">
            The institutional LMS is the single source of truth for all training documentation.
          </p>

          <div className="grid sm:grid-cols-3 gap-4">
            {[
              { label: 'RTI Attendance', desc: 'Automated tracking of classroom, online, and lab attendance hours' },
              { label: 'Module Completion', desc: 'Structured modules with completion thresholds and timestamps' },
              { label: 'Assessments', desc: 'Competency exams, quizzes, and skill evaluations with scored records' },
              { label: 'Instructor Verification', desc: 'Instructor sign-off on attendance, skill evaluations, and phase advancement' },
              { label: 'OJT Hour Logging', desc: 'Employer-submitted OJT hours with supervisor verification' },
              { label: 'Cohort Progress Reports', desc: 'Structured reports for workforce partners (La Plaza, WorkOne, etc.)' },
            ].map((item, i) => (
              <div key={i} className="bg-slate-50 rounded-lg p-4 print:border print:bg-white">
                <p className="font-semibold text-gray-900 text-sm mb-1">{item.label}</p>
                <p className="text-gray-600 text-xs">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Navigation — hidden on print */}
      <section className="py-10 bg-slate-50 print:hidden">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex flex-wrap gap-3">
            <Link href="/compliance/credential-partners" className="inline-flex items-center gap-2 px-4 py-2 bg-brand-blue-600 text-white rounded-lg text-sm font-medium hover:bg-brand-blue-700 transition">
              Credential Partner Registry
            </Link>
            <Link href="/instructional-framework" className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition">
              Instructional Framework
            </Link>
            <Link href="/instructor-credentials" className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition">
              Instructor Credentials
            </Link>
            <Link href="/compliance/workforce-partnership-packet" className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition">
              Workforce Partnership Packet
            </Link>
            <PrintButton />
          </div>
        </div>
      </section>
    </div>
  );
}
