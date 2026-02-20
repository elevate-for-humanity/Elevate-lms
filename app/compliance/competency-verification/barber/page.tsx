
import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import {
  Shield,
  GraduationCap,
  Building2,
  FileCheck,
  CheckCircle,
  AlertTriangle,
  ClipboardCheck,
  BookOpen,
  Clock,
  UserCheck,
} from 'lucide-react';
import { PrintButton } from './PrintButton';
import { BARBER_SECTIONS, BARBER_STATS } from './barber-rubric-data';
import type { RubricSection, RubricItem } from './barber-rubric-data';

export const metadata: Metadata = {
  title: 'Barber Apprenticeship Competency Rubric | Compliance | Elevate for Humanity',
  description:
    'State-aligned, apprenticeship-grade barbering competency rubric system. 6 sections, 30 competencies covering sanitation, cutting technique, razor skills, client services, shop operations, and OJT performance. RAPIDS ID: 2025-IN-132301.',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/compliance/competency-verification/barber',
  },
};

function CompetencyCard({ item, sectionNum }: { item: RubricItem; sectionNum: number }) {
  return (
    <div className="bg-white rounded-lg border overflow-hidden print:break-inside-avoid print:border-gray-300">
      <div className="bg-slate-50 px-4 py-2.5 border-b flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 print:bg-gray-100">
        <span className="font-semibold text-gray-900 text-sm">
          <span className="text-brand-blue-600 print:text-gray-700">{item.id}</span> {item.competency}
        </span>
        <div className="flex gap-3 text-xs text-gray-500">
          {item.rtiHours > 0 && <span>RTI: {item.rtiHours}h</span>}
          {item.ojtHours > 0 && <span>OJT: {item.ojtHours}h</span>}
        </div>
      </div>
      <div className="p-4 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div>
            <p className="font-semibold text-gray-500 uppercase tracking-wider mb-0.5">Assessment Method</p>
            <p className="text-gray-700">{item.assessmentType}</p>
          </div>
          <div>
            <p className="font-semibold text-gray-500 uppercase tracking-wider mb-0.5">Evaluator</p>
            <p className="text-gray-700">{item.evaluator}</p>
          </div>
        </div>

        <div>
          <p className="font-semibold text-gray-500 uppercase tracking-wider text-xs mb-1.5">Pass Criteria (minimum score: 3)</p>
          <ul className="space-y-1">
            {item.passCriteria.map((c, i) => (
              <li key={i} className="text-xs text-gray-700 flex items-start gap-1.5">
                <CheckCircle className="w-3.5 h-3.5 text-green-600 flex-shrink-0 mt-0.5" />
                {c}
              </li>
            ))}
          </ul>
        </div>

        {item.failurePolicy && (
          <div className="bg-red-50 border border-red-200 rounded px-3 py-2 flex items-start gap-2 print:bg-white print:border-gray-400">
            <AlertTriangle className="w-3.5 h-3.5 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-red-800">{item.failurePolicy}</p>
          </div>
        )}

        {/* Scoring row for print */}
        <div className="border-t pt-2 mt-2 print:block hidden">
          <div className="grid grid-cols-5 gap-1 text-center text-[9px] text-gray-500">
            <div className="border rounded py-1">1 - Not Competent</div>
            <div className="border rounded py-1">2 - Developing</div>
            <div className="border rounded py-1">3 - Competent</div>
            <div className="border rounded py-1">4 - Advanced</div>
            <div className="border rounded py-1">5 - Mastery</div>
          </div>
          <div className="mt-2 flex gap-4 text-[9px] text-gray-400">
            <span>Score: ____</span>
            <span>Evaluator Signature: ________________________</span>
            <span>Date: __________</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function SectionBlock({ section }: { section: RubricSection }) {
  const sectionRTI = section.items.reduce((sum, i) => sum + i.rtiHours, 0);
  const sectionOJT = section.items.reduce((sum, i) => sum + i.ojtHours, 0);

  return (
    <div className="print:break-before-page">
      <div className="bg-brand-blue-600 rounded-t-xl px-6 py-4 print:bg-gray-900 print:rounded-none">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-brand-blue-200 text-xs font-medium uppercase tracking-wider print:text-gray-400">
              Section {section.section} of 6
            </p>
            <h3 className="text-lg font-bold text-white mt-1">{section.title}</h3>
          </div>
          <div className="text-right text-xs text-brand-blue-200 print:text-gray-400">
            <p>{section.items.length} competencies</p>
            <p>RTI: {sectionRTI}h | OJT: {sectionOJT}h</p>
          </div>
        </div>
      </div>
      <div className="bg-gray-50 border-x px-6 py-3 border-b print:bg-white print:border-gray-300">
        <p className="text-sm text-gray-600">{section.description}</p>
      </div>
      <div className="border-x border-b rounded-b-xl p-4 space-y-3 print:border-gray-300 print:rounded-none">
        {section.items.map((item) => (
          <CompetencyCard key={item.id} item={item} sectionNum={section.section} />
        ))}
      </div>
    </div>
  );
}

export default function BarberCompetencyRubricPage() {

  return (
    <div className="bg-white min-h-screen print:bg-white">
      {/* Breadcrumbs */}
      <div className="bg-slate-50 border-b print:hidden">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[
            { label: 'Compliance', href: '/compliance' },
            { label: 'Competency Verification', href: '/compliance/competency-verification' },
            { label: 'Barber Apprenticeship' },
          ]} />
        </div>
      </div>

      {/* Hero */}
      <section className="relative h-[240px] sm:h-[300px] print:hidden">
        <Image
          src="/images/programs-hq/barber-training.jpg"
          alt="Barber apprentice training in a barbershop"
          fill
          sizes="100vw"
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-10">
          <div className="max-w-6xl mx-auto">
            <p className="text-white/80 text-sm font-medium uppercase tracking-wider mb-2">
              RAPIDS-Registered Apprenticeship Rubric
            </p>
            <h1 className="text-3xl sm:text-4xl font-bold text-white">
              Barber Apprenticeship Competency Rubric
            </h1>
          </div>
        </div>
      </section>

      {/* Print header */}
      <div className="hidden print:block px-8 pt-8 pb-4 border-b-2 border-gray-900">
        <h1 className="text-2xl font-bold text-gray-900">Barber Apprenticeship — Competency Rubric</h1>
        <p className="text-sm text-gray-600">Elevate for Humanity | RAPIDS ID: 2025-IN-132301</p>
        <p className="text-xs text-gray-500 mt-1">Occupation: Barber (330.371-010) | Total: 2,000 hours (144 RTI + 1,500 OJT)</p>
      </div>

      {/* Overview */}
      <section className="py-10 bg-white">
        <div className="max-w-4xl mx-auto px-4">
          {/* Registration */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
            <div className="bg-slate-50 rounded-lg p-3 text-center print:border print:bg-white">
              <p className="text-2xl font-bold text-brand-blue-600 print:text-gray-900">{BARBER_STATS.totalCompetencies}</p>
              <p className="text-xs text-gray-500">Competencies</p>
            </div>
            <div className="bg-slate-50 rounded-lg p-3 text-center print:border print:bg-white">
              <p className="text-2xl font-bold text-brand-blue-600 print:text-gray-900">{BARBER_STATS.sections}</p>
              <p className="text-xs text-gray-500">Sections</p>
            </div>
            <div className="bg-slate-50 rounded-lg p-3 text-center print:border print:bg-white">
              <p className="text-2xl font-bold text-brand-blue-600 print:text-gray-900">{BARBER_STATS.totalRTIHours}</p>
              <p className="text-xs text-gray-500">RTI Hours</p>
            </div>
            <div className="bg-slate-50 rounded-lg p-3 text-center print:border print:bg-white">
              <p className="text-2xl font-bold text-brand-blue-600 print:text-gray-900">{BARBER_STATS.totalOJTHours.toLocaleString()}</p>
              <p className="text-xs text-gray-500">OJT Hours</p>
            </div>
          </div>

          {/* Scoring & Registration */}
          <div className="grid sm:grid-cols-2 gap-4 mb-8">
            <div className="bg-slate-50 rounded-lg p-5 print:border print:bg-white">
              <h3 className="font-semibold text-gray-900 text-sm mb-2">Scoring Scale</h3>
              <div className="space-y-1 text-xs text-gray-700">
                <p><span className="font-semibold text-red-600">1</span> — Not Competent</p>
                <p><span className="font-semibold text-orange-600">2</span> — Developing</p>
                <p><span className="font-semibold text-brand-blue-600">3</span> — Competent (Industry Ready)</p>
                <p><span className="font-semibold text-green-600">4</span> — Advanced</p>
                <p><span className="font-semibold text-purple-600">5</span> — Mastery</p>
              </div>
              <p className="text-xs text-gray-500 mt-3 font-medium">
                Passing standard: Minimum score of 3 in all core competencies.
              </p>
            </div>
            <div className="bg-slate-50 rounded-lg p-5 print:border print:bg-white">
              <h3 className="font-semibold text-gray-900 text-sm mb-2">Registration & Alignment</h3>
              <dl className="space-y-1.5 text-xs text-gray-700">
                <div><dt className="font-semibold text-gray-500 inline">RAPIDS ID:</dt> <dd className="inline">2025-IN-132301</dd></div>
                <div><dt className="font-semibold text-gray-500 inline">Occupation:</dt> <dd className="inline">Barber (DOT 330.371-010)</dd></div>
                <div><dt className="font-semibold text-gray-500 inline">Total Hours:</dt> <dd className="inline">2,000 (144 RTI + 1,500 OJT + supplemental)</dd></div>
                <div><dt className="font-semibold text-gray-500 inline">Credential:</dt> <dd className="inline">Indiana Barber License (PLA)</dd></div>
                <div><dt className="font-semibold text-gray-500 inline">State Board:</dt> <dd className="inline">Indiana Professional Licensing Agency</dd></div>
              </dl>
            </div>
          </div>

          {/* Sign-Off Structure */}
          <div className="border-l-4 border-brand-blue-600 pl-6 mb-8 print:border-gray-900">
            <h2 className="text-lg font-bold text-gray-900 mb-3">Competency Sign-Off Structure</h2>
            <div className="space-y-2">
              {[
                { icon: GraduationCap, role: 'Credential Partner (Licensed Barber Instructor)', scope: 'Verifies technical and academic competencies (Sections 1–3, 5)' },
                { icon: Building2, role: 'Employer Barbershop Supervisor', scope: 'Verifies hands-on performance and workplace readiness (Sections 4–6)' },
                { icon: FileCheck, role: 'Program Holder (RTI Coordinator)', scope: 'Confirms rubric completion, LMS tracking, evaluation checkpoint compliance' },
                { icon: Shield, role: 'Elevate (Sponsor)', scope: 'Issues Completion Certificate, files apprenticeship documentation with DOL' },
              ].map((item, i) => {
                const Icon = item.icon;
                return (
                  <div key={i} className="flex gap-3 items-start text-sm">
                    <Icon className="w-4 h-4 text-brand-blue-600 flex-shrink-0 mt-0.5 print:text-gray-700" />
                    <div>
                      <span className="font-semibold text-gray-900">{item.role}</span>
                      <span className="text-gray-600 text-xs block">{item.scope}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Evaluation Checkpoints */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-5 print:bg-white print:border-gray-300">
            <h3 className="font-bold text-gray-900 text-sm mb-3">OJT Evaluation Checkpoints</h3>
            <div className="grid sm:grid-cols-3 gap-3 text-xs">
              <div className="bg-white rounded p-3 border print:border-gray-300">
                <p className="font-semibold text-gray-900">30-Day Review</p>
                <p className="text-gray-600 mt-1">Sanitation compliance, basic tool handling, shop orientation, attendance record.</p>
                <p className="text-gray-500 mt-1">Evaluator: Shop Supervisor</p>
              </div>
              <div className="bg-white rounded p-3 border print:border-gray-300">
                <p className="font-semibold text-gray-900">Midpoint Review</p>
                <p className="text-gray-600 mt-1">Cutting technique progress, client service quality, speed improvement, professional conduct.</p>
                <p className="text-gray-500 mt-1">Evaluator: Shop Supervisor + Instructor</p>
              </div>
              <div className="bg-white rounded p-3 border print:border-gray-300">
                <p className="font-semibold text-gray-900">Final OJT Sign-Off</p>
                <p className="text-gray-600 mt-1">All competencies verified, state board readiness confirmed, completion documentation filed.</p>
                <p className="text-gray-500 mt-1">Evaluator: All parties</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Rubric Sections */}
      <section className="py-10 bg-slate-50 print:bg-white">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Competency Rubric Sections</h2>
          <div className="space-y-8">
            {BARBER_SECTIONS.map((section) => (
              <SectionBlock key={section.section} section={section} />
            ))}
          </div>
        </div>
      </section>

      {/* Complete Documentation Packet */}
      <section className="py-10 bg-white print:hidden">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-xl font-bold text-gray-900 mb-2">Institutional Documentation Packet</h2>
          <p className="text-gray-600 text-sm mb-4">
            Complete 6-document compliance packet. Use together as one set — not as separate forms.
          </p>

          <div className="grid sm:grid-cols-3 gap-4 mb-8">
            <Link href="/compliance/competency-verification/barber/apprenticeship-agreement" className="bg-slate-50 rounded-lg border p-5 hover:shadow-md transition block">
              <BookOpen className="w-6 h-6 text-brand-blue-600 mb-2" />
              <p className="text-[10px] text-brand-blue-600 font-semibold mb-1">DOC 1</p>
              <h3 className="font-semibold text-gray-900 text-sm">Apprenticeship Agreement</h3>
              <p className="text-xs text-gray-500 mt-1">Master agreement with all parties, roles, hours, and terms. Signed at enrollment.</p>
            </Link>
            <Link href="/compliance/competency-verification/barber/monthly-ojt-evaluation" className="bg-slate-50 rounded-lg border p-5 hover:shadow-md transition block">
              <ClipboardCheck className="w-6 h-6 text-brand-blue-600 mb-2" />
              <p className="text-[10px] text-brand-blue-600 font-semibold mb-1">DOC 2</p>
              <h3 className="font-semibold text-gray-900 text-sm">Monthly OJT Evaluation</h3>
              <p className="text-xs text-gray-500 mt-1">Standardized monthly form for barbershop supervisors. Completed every month.</p>
            </Link>
            <Link href="/compliance/competency-verification/barber/scoring-sheet" className="bg-slate-50 rounded-lg border p-5 hover:shadow-md transition block">
              <FileCheck className="w-6 h-6 text-brand-blue-600 mb-2" />
              <p className="text-[10px] text-brand-blue-600 font-semibold mb-1">DOC 3</p>
              <h3 className="font-semibold text-gray-900 text-sm">Competency Scoring Sheet</h3>
              <p className="text-xs text-gray-500 mt-1">All 30 competencies with 0–5 scoring grid. Used at quarterly reviews.</p>
            </Link>
            <Link href="/compliance/competency-verification/barber/supervisor-verification" className="bg-slate-50 rounded-lg border p-5 hover:shadow-md transition block">
              <UserCheck className="w-6 h-6 text-brand-blue-600 mb-2" />
              <p className="text-[10px] text-brand-blue-600 font-semibold mb-1">DOC 4</p>
              <h3 className="font-semibold text-gray-900 text-sm">Supervisor Verification</h3>
              <p className="text-xs text-gray-500 mt-1">Licensed barber supervisor and shop compliance verification. Completed before placement.</p>
            </Link>
            <Link href="/compliance/competency-verification/barber/ojt-hours-log" className="bg-slate-50 rounded-lg border p-5 hover:shadow-md transition block">
              <Clock className="w-6 h-6 text-brand-blue-600 mb-2" />
              <p className="text-[10px] text-brand-blue-600 font-semibold mb-1">DOC 5</p>
              <h3 className="font-semibold text-gray-900 text-sm">OJT Hours Log</h3>
              <p className="text-xs text-gray-500 mt-1">Daily hours tracking with skills practiced and supervisor initials. One per month.</p>
            </Link>
            <Link href="/compliance/competency-verification/barber/final-signoff" className="bg-slate-50 rounded-lg border p-5 hover:shadow-md transition block">
              <Shield className="w-6 h-6 text-brand-blue-600 mb-2" />
              <p className="text-[10px] text-brand-blue-600 font-semibold mb-1">DOC 6</p>
              <h3 className="font-semibold text-gray-900 text-sm">Final Sign-Off Form</h3>
              <p className="text-xs text-gray-500 mt-1">Tri-party verification + sponsor sign-off. Filed with RAPIDS at completion.</p>
            </Link>
          </div>

          {/* Operational Workflow */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-5">
            <h3 className="font-bold text-gray-900 text-sm mb-3">Operational Workflow</h3>
            <div className="space-y-2 text-sm text-gray-700">
              <div className="flex gap-3 items-start">
                <span className="font-bold text-brand-blue-600 w-24 flex-shrink-0">Enrollment</span>
                <span>Apprenticeship Agreement (Doc 1) + Supervisor Verification (Doc 4)</span>
              </div>
              <div className="flex gap-3 items-start">
                <span className="font-bold text-brand-blue-600 w-24 flex-shrink-0">Monthly</span>
                <span>OJT Evaluation (Doc 2) + OJT Hours Log (Doc 5)</span>
              </div>
              <div className="flex gap-3 items-start">
                <span className="font-bold text-brand-blue-600 w-24 flex-shrink-0">Quarterly</span>
                <span>Competency Scoring Sheet (Doc 3) — RTI + OJT combined review</span>
              </div>
              <div className="flex gap-3 items-start">
                <span className="font-bold text-brand-blue-600 w-24 flex-shrink-0">Completion</span>
                <span>Final Sign-Off (Doc 6) — filed with RAPIDS documentation</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* LMS Integration Note */}
      <section className="py-10 bg-slate-50">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-xl font-bold text-gray-900 mb-4">LMS Integration</h2>
          <div className="bg-slate-50 rounded-lg p-5 border print:bg-white print:border-gray-300">
            <p className="text-sm text-gray-700 mb-3">
              Each competency in this rubric is linked to the institutional LMS for tracking and documentation:
            </p>
            <div className="grid sm:grid-cols-2 gap-2 text-xs text-gray-700">
              {[
                'Each competency linked to an LMS module',
                'RTI hours tracked per competency',
                'OJT hours logged by employer supervisor',
                'Rubric scores recorded in student record',
                'Evaluation checkpoints trigger automated notifications',
                'Completion status visible to all authorized parties',
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-1.5">
                  <ClipboardCheck className="w-3.5 h-3.5 text-green-600 flex-shrink-0" />
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Navigation */}
      <section className="py-10 bg-slate-50 print:hidden">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex flex-wrap gap-3">
            <Link href="/compliance/competency-verification" className="inline-flex items-center gap-2 px-4 py-2 bg-brand-blue-600 text-white rounded-lg text-sm font-medium hover:bg-brand-blue-700 transition">
              All Program Rubrics
            </Link>
            <Link href="/compliance/apprenticeship-structure" className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition">
              Apprenticeship Structure
            </Link>
            <Link href="/compliance/credential-partners" className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition">
              Credential Partners
            </Link>
            <Link href="/programs/barber-apprenticeship" className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition">
              Barber Program Page
            </Link>
            <PrintButton />
          </div>
        </div>
      </section>
    </div>
  );
}
