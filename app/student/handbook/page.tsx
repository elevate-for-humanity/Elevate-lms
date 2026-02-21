import type { Metadata } from 'next';
import Link from 'next/link';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { BookOpen, Clock, Shield, Users, AlertTriangle, Award } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Student Handbook | Elevate for Humanity',
  description: 'Student handbook covering attendance policies, code of conduct, grading, grievance procedures, and program expectations.',
  alternates: { canonical: 'https://www.elevateforhumanity.org/student/handbook' },
};

const sections = [
  {
    icon: BookOpen,
    title: 'Attendance Policy',
    content: 'Students must maintain a minimum 80% attendance rate. Absences must be reported before class start time. Three unexcused absences may result in program review. Tardiness of 15+ minutes counts as a half absence. Attendance is tracked digitally and reported to workforce partners.',
  },
  {
    icon: Shield,
    title: 'Code of Conduct',
    content: 'Students are expected to maintain professional behavior at all times. This includes respectful communication with instructors, staff, and peers; appropriate dress for training environments; no use of drugs or alcohol on premises; and compliance with all facility safety rules. Violations may result in suspension or dismissal.',
  },
  {
    icon: Clock,
    title: 'Program Schedule',
    content: 'Program schedules vary by training track. Most programs run Monday through Friday with morning or evening sessions available. Specific schedules are provided during orientation. Schedule changes require 48-hour advance notice. Clinical and OJT hours may include weekends depending on the training site.',
  },
  {
    icon: Users,
    title: 'Grading & Assessment',
    content: 'Students are assessed through written exams, practical demonstrations, and competency evaluations. A minimum score of 70% is required on all assessments. Students who do not meet minimum scores may retake assessments once. Final certification exams are administered by third-party testing organizations (PSI, Certiport, etc.).',
  },
  {
    icon: AlertTriangle,
    title: 'Grievance Procedure',
    content: 'Students with complaints should first attempt to resolve the issue with their instructor. If unresolved, submit a written grievance to the Program Director within 10 business days. The Director will respond within 5 business days. Appeals may be submitted to the Executive Director. Full grievance policy available at /grievance.',
  },
  {
    icon: Award,
    title: 'Completion Requirements',
    content: 'To complete a program, students must: meet minimum attendance requirements, pass all required assessments, complete all OJT/clinical hours where applicable, fulfill any financial obligations, and return all borrowed materials. Certificates and credentials are issued within 10 business days of completion.',
  },
];

export default function StudentHandbookPage() {
  return (
    <main className="min-h-screen bg-white">
      <div className="bg-slate-50 border-b">
        <div className="max-w-4xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'Student', href: '/lms/dashboard' }, { label: 'Handbook' }]} />
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Student Handbook</h1>
        <p className="text-slate-600 mb-10">Policies, expectations, and procedures for all Elevate training programs.</p>

        <div className="space-y-8">
          {sections.map((section) => (
            <div key={section.title} className="bg-slate-50 rounded-xl p-6 border border-slate-200">
              <div className="flex items-start gap-4">
                <section.icon className="w-6 h-6 text-brand-red-600 flex-shrink-0 mt-1" />
                <div>
                  <h2 className="text-xl font-bold text-slate-900 mb-2">{section.title}</h2>
                  <p className="text-slate-700 leading-relaxed">{section.content}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-10 bg-brand-red-50 border border-brand-red-200 rounded-xl p-6">
          <p className="text-brand-red-800 text-sm">
            This handbook is a summary. Full policies are available in the student portal after enrollment. For questions, contact <Link href="/support" className="font-bold underline">student support</Link>.
          </p>
        </div>
      </div>
    </main>
  );
}
