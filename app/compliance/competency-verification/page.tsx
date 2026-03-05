
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
  CheckCircle,
  ClipboardCheck,
  Users,
} from 'lucide-react';
import { PrintButton } from './PrintButton';
import { ALL_RUBRICS } from './rubric-data';
import type { ProgramRubric, Competency } from './rubric-data';

export const metadata: Metadata = {
  title: 'Competency Verification Matrix | Compliance | Elevate for Humanity',
  description:
    'Audit-grade competency assessment rubrics for Barber Apprenticeship, HVAC Technician, and Building Technician programs. Per-competency RTI/OJT hours, assessment methods, evaluator roles, and pass criteria.',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/compliance/competency-verification',
  },
};

function RubricCard({ competency, index }: { competency: Competency; index: number }) {
  return (
    <div className="bg-white rounded-lg border overflow-hidden print:break-inside-avoid">
      <div className="bg-slate-50 px-4 py-2 border-b flex items-center justify-between print:bg-gray-100">
        <span className="font-semibold text-gray-900 text-sm">{index + 1}. {competency.name}</span>
        <span className="text-xs text-gray-500">RTI: {competency.rtiHours}h | OJT: {competency.ojtHours}h</span>
      </div>
      <div className="p-4 space-y-3">
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div>
            <p className="font-semibold text-gray-500 uppercase tracking-wider mb-0.5">Assessment</p>
            <p className="text-gray-700">{competency.assessmentType}</p>
          </div>
          <div>
            <p className="font-semibold text-gray-500 uppercase tracking-wider mb-0.5">Evaluator</p>
            <p className="text-gray-700">{competency.evaluator}</p>
          </div>
        </div>
        <div>
          <p className="font-semibold text-gray-500 uppercase tracking-wider text-xs mb-1">Pass Criteria</p>
          <ul className="space-y-0.5">
            {competency.passCriteria.map((c, i) => (
              <li key={i} className="text-xs text-gray-700 flex items-start gap-1.5">
                <CheckCircle className="w-3 h-3 text-brand-green-600 flex-shrink-0 mt-0.5" />
                {c}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

function ProgramRubricSection({ rubric }: { rubric: ProgramRubric }) {
  const totalRTI = rubric.competencies.reduce((sum, c) => sum + c.rtiHours, 0);
  const totalOJT = rubric.competencies.reduce((sum, c) => sum + c.ojtHours, 0);

  return (
    <div className="print:break-before-page">
      <div className="bg-brand-blue-600 rounded-t-xl px-6 py-4 print:bg-gray-900">
        <h3 className="text-xl font-bold text-white">{rubric.program}</h3>
        <p className="text-brand-blue-100 text-sm">{rubric.occupation}</p>
      </div>
      <div className="bg-white border-x border-b rounded-b-xl p-6 mb-2">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          <div className="text-center">
            <p className="text-2xl font-bold text-brand-blue-600 print:text-gray-900">{rubric.totalCompetencies}</p>
            <p className="text-xs text-gray-500">Competencies</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-brand-blue-600 print:text-gray-900">{totalRTI}</p>
            <p className="text-xs text-gray-500">RTI Hours</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-brand-blue-600 print:text-gray-900">{totalOJT}</p>
            <p className="text-xs text-gray-500">OJT Hours</p>
          </div>
          <div className="text-center">
            <p className="text-sm font-semibold text-gray-700 mt-1">{rubric.scoringScale}</p>
            <p className="text-xs text-gray-500">Scoring Scale</p>
          </div>
        </div>

        <div className="space-y-3">
          {rubric.competencies.map((comp, i) => (
            <RubricCard key={i} competency={comp} index={i} />
          ))}
        </div>
      </div>
    </div>
  );
}

export default function CompetencyVerificationPage() {

  return (
    <div className="bg-white min-h-screen print:bg-white">
      {/* Breadcrumbs */}
      <div className="bg-slate-50 border-b print:hidden">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[
            { label: 'Compliance', href: '/compliance' },
            { label: 'Competency Verification' },
          ]} />
        </div>
      </div>

      {/* Hero */}
      <section className="relative h-[240px] sm:h-[300px] print:hidden">
        <Image
          src="/images/pages/compliance-page-2.jpg"
          alt="Competency assessment in progress"
          fill
          sizes="100vw"
          className="object-cover"
          priority
        />
        <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-10">
          <div className="max-w-6xl mx-auto">
            <p className="text-white/80 text-sm font-medium uppercase tracking-wider mb-2">
              Audit-Grade Assessment Documentation
            </p>
            <h1 className="text-3xl sm:text-4xl font-bold text-white">
              Competency Verification Matrix
            </h1>
          </div>
        </div>
      </section>

      {/* Print header */}
      <div className="hidden print:block px-8 pt-8 pb-4 border-b-2 border-gray-900">
        <h1 className="text-2xl font-bold text-gray-900">Competency Verification Matrix</h1>
        <p className="text-sm text-gray-600">Elevate for Humanity — Assessment Rubric Documentation</p>
      </div>

      {/* Purpose & Verification Authority */}
      <section className="py-10 bg-white">
        <div className="max-w-4xl mx-auto px-4">
          <div className="border-l-4 border-brand-blue-600 pl-6 mb-8 print:border-gray-900">
            <h2 className="text-lg font-bold text-gray-900 mb-2">Document Purpose</h2>
            <p className="text-gray-700 text-sm leading-relaxed">
              This document defines the competency assessment rubrics for each program. Every
              competency is mapped to specific RTI hours, OJT hours, assessment methods,
              evaluator roles, and objective pass criteria. These rubrics standardize assessment
              across all credential partners, program holders, and employer sites — ensuring
              consistent, verifiable competency validation regardless of delivery location.
            </p>
          </div>

          {/* Verification Authority Hierarchy */}
          <h2 className="text-xl font-bold text-gray-900 mb-4">Assessment Authority Hierarchy</h2>
          <div className="space-y-3 mb-8">
            {[
              { icon: GraduationCap, role: 'RTI Competencies', authority: 'Credential Partner / Licensed Instructor', desc: 'Classroom, lab, and module-based competency assessments. Instructor sign-off required.' },
              { icon: Building2, role: 'OJT Competencies', authority: 'Employer Supervisor', desc: 'Workplace skill verification using structured checklists. Supervisor sign-off required.' },
              { icon: FileCheck, role: 'Progress Oversight', authority: 'Program Holder', desc: 'Rubric completion tracking, evaluation checkpoint enforcement, LMS documentation.' },
              { icon: Shield, role: 'Final Completion', authority: 'Elevate (Sponsor)', desc: 'Final competency validation, credential readiness determination, completion documentation.' },
            ].map((item, i) => {
              const Icon = item.icon;
              return (
                <div key={i} className="flex gap-3 items-start bg-slate-50 rounded-lg p-4 print:bg-white print:border">
                  <Icon className="w-5 h-5 text-brand-blue-600 flex-shrink-0 mt-0.5 print:text-gray-700" />
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">{item.role} — <span className="text-brand-blue-700 print:text-gray-700">{item.authority}</span></p>
                    <p className="text-gray-600 text-xs">{item.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Evaluation Checkpoints */}
          <h2 className="text-xl font-bold text-gray-900 mb-4">Standardized Evaluation Checkpoints</h2>
          <div className="grid sm:grid-cols-2 gap-3 mb-8">
            {[
              { checkpoint: '30-Day Evaluation', desc: 'Initial progress review. RTI attendance, early module completion, OJT orientation verified.', evaluator: 'Program Holder + Instructor' },
              { checkpoint: 'Midpoint Evaluation', desc: 'Competency milestone check. Core skills assessed, OJT skill verification in progress.', evaluator: 'Instructor + Employer Supervisor' },
              { checkpoint: 'Final Competency Review', desc: 'All rubric competencies verified. Certification readiness determination.', evaluator: 'Credential Partner + Program Holder' },
              { checkpoint: 'Completion Documentation', desc: 'Credential issuance confirmed, placement support initiated, file closed.', evaluator: 'Elevate (Sponsor)' },
            ].map((item, i) => (
              <div key={i} className="bg-slate-50 rounded-lg p-4 print:bg-white print:border">
                <p className="font-semibold text-gray-900 text-sm">{item.checkpoint}</p>
                <p className="text-gray-600 text-xs mt-1">{item.desc}</p>
                <p className="text-gray-500 text-xs mt-1">Evaluator: {item.evaluator}</p>
              </div>
            ))}
          </div>

          {/* OJT Skill Verification Checklist Categories */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-5 print:bg-white print:border-gray-300">
            <h3 className="font-bold text-gray-900 mb-2 text-sm">OJT Skill Verification Checklist Categories</h3>
            <p className="text-xs text-gray-700 mb-3">
              Employers verify OJT competencies using structured checklists (not open-ended comments).
              Each OJT evaluation covers these standardized categories:
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
              {['Equipment Operation', 'Safety Compliance', 'Task Execution Accuracy', 'Time Efficiency', 'Professional Conduct', 'Documentation Quality'].map((cat, i) => (
                <div key={i} className="flex items-center gap-1.5">
                  <ClipboardCheck className="w-3.5 h-3.5 text-amber-600" />
                  <span className="text-gray-700">{cat}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Program Rubrics */}
      <section className="py-10 bg-slate-50 print:bg-white">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Program Competency Rubrics</h2>
          <p className="text-gray-600 text-sm mb-6">
            Summary rubrics for each program. Programs with dedicated deep-dive rubric pages are linked below.
          </p>

          <div className="bg-brand-blue-50 border border-brand-blue-200 rounded-lg p-4 mb-8 print:bg-white print:border-gray-300">
            <p className="text-sm text-gray-900 font-semibold mb-1">Dedicated Rubric Pages</p>
            <Link href="/compliance/competency-verification/barber" className="text-sm text-brand-blue-600 underline hover:text-brand-blue-700">
              Barber Apprenticeship — Full 6-Section Competency Rubric (30 competencies, RAPIDS-aligned)
            </Link>
          </div>

          <div className="space-y-10">
            {ALL_RUBRICS.map((rubric, i) => (
              <ProgramRubricSection key={i} rubric={rubric} />
            ))}
          </div>
        </div>
      </section>

      {/* Rubric Format Standard */}
      <section className="py-10 bg-white">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Rubric Format Standard</h2>
          <p className="text-gray-600 text-sm mb-4">
            All program rubrics follow this standardized format. New programs must use the same
            structure before being added to the institutional catalog.
          </p>
          <div className="bg-slate-50 rounded-lg p-5 border print:bg-white print:border-gray-300">
            <div className="grid sm:grid-cols-2 gap-3 text-xs text-gray-700">
              {[
                'Competency Name',
                'Skill Standard (industry-aligned)',
                'RTI Hours (mapped)',
                'OJT Hours (mapped)',
                'Assessment Type (Written / Practical / Observation)',
                'Evaluator Role (Instructor / Employer / Both)',
                'Scoring Scale (program-specific)',
                'Pass Criteria (objective, measurable)',
                'Final Sign-Off Section',
                'LMS Documentation Reference',
              ].map((field, i) => (
                <div key={i} className="flex items-center gap-2">
                  <CheckCircle className="w-3.5 h-3.5 text-brand-green-600 flex-shrink-0" />
                  {field}
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
            <Link href="/compliance/apprenticeship-structure" className="inline-flex items-center gap-2 px-4 py-2 bg-brand-blue-600 text-white rounded-lg text-sm font-medium hover:bg-brand-blue-700 transition">
              Apprenticeship & RTI Structure
            </Link>
            <Link href="/compliance/credential-partners" className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition">
              Credential Partner Registry
            </Link>
            <Link href="/instructional-framework" className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition">
              Instructional Framework
            </Link>
            <PrintButton />
          </div>
        </div>
      </section>
    </div>
  );
}
