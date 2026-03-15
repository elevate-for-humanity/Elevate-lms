import { Metadata } from 'next';
import Link from 'next/link';
import { BookOpen, Download, FileText, GraduationCap } from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

export const metadata: Metadata = {
  title: 'Program Workbooks | Elevate for Humanity',
  description:
    'Access workbooks, study guides, and course materials for all programs',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/workbooks',
  },
};

const workbooks = [
  {
    program: 'Barbering/Cosmetology',
    slug: 'barbering',
    materials: [
      { title: 'Theory Workbook', file: 'barbering-theory.pdf', pages: 120 },
      { title: 'Practice Guide', file: 'barbering-practice.pdf', pages: 80 },
      { title: 'State Board Prep', file: 'barbering-exam-prep.pdf', pages: 60 },
      { title: 'Safety Procedures', file: 'barbering-safety.pdf', pages: 40 },
    ],
  },
  {
    program: 'Certified Nursing Assistant (CNA)',
    slug: 'cna',
    materials: [
      {
        title: 'Patient Care Workbook',
        file: 'cna-patient-care.pdf',
        pages: 100,
      },
      { title: 'Skills Checklist', file: 'cna-skills.pdf', pages: 50 },
      { title: 'State Exam Prep', file: 'cna-exam-prep.pdf', pages: 70 },
      { title: 'Medical Terminology', file: 'cna-terminology.pdf', pages: 60 },
    ],
  },
  {
    program: 'HVAC Technician',
    slug: 'hvac',
    materials: [
      {
        title: 'Fundamentals Workbook',
        file: 'hvac-fundamentals.pdf',
        pages: 150,
      },
      { title: 'EPA 608 Prep Guide', file: 'hvac-epa-608.pdf', pages: 90 },
      {
        title: 'Troubleshooting Guide',
        file: 'hvac-troubleshooting.pdf',
        pages: 80,
      },
      { title: 'Safety Procedures', file: 'hvac-safety.pdf', pages: 40 },
    ],
  },
  {
    program: 'Tax Preparation',
    slug: 'tax-prep',
    materials: [
      { title: 'Tax Law Workbook', file: 'tax-law-workbook.pdf', pages: 200 },
      {
        title: 'Practice Returns',
        file: 'tax-practice-returns.pdf',
        pages: 100,
      },
      { title: 'Software Guide', file: 'tax-software-guide.pdf', pages: 60 },
      { title: 'Ethics & Regulations', file: 'tax-ethics.pdf', pages: 50 },
    ],
  },
  {
    program: "Commercial Driver's License (CDL)",
    slug: 'cdl',
    materials: [
      { title: 'Driver Manual', file: 'cdl-driver-manual.pdf', pages: 180 },
      {
        title: 'Pre-Trip Inspection Guide',
        file: 'cdl-inspection.pdf',
        pages: 70,
      },
      { title: 'Safety Handbook', file: 'cdl-safety.pdf', pages: 60 },
      { title: 'DOT Regulations', file: 'cdl-dot-regulations.pdf', pages: 90 },
    ],
  },
];

export default function WorkbooksPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Breadcrumbs */}
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'Workbooks' }]} />
        </div>
      </div>

      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-center gap-3 mb-2">
            <BookOpen className="w-10 h-10 text-brand-blue-600" />
            <h1 className="text-4xl font-bold text-black text-2xl md:text-3xl lg:text-4xl">
              Program Workbooks
            </h1>
          </div>
          <p className="text-lg text-black">
            Download workbooks, study guides, and course materials for your
            program
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Info Banner */}
        <div className="bg-brand-blue-50 border border-brand-blue-200 rounded-xl p-6 mb-8">
          <div className="flex items-start gap-4">
            <FileText className="w-6 h-6 text-brand-blue-600 flex-shrink-0 mt-1" />
            <div>
              <h2 className="text-lg font-bold text-black mb-2">
                About These Materials
              </h2>
              <p className="text-black">
                All workbooks are provided free of charge to enrolled students.
                Materials are updated regularly to reflect current industry
                standards and certification requirements. For best results,
                download and print workbooks before class begins.
              </p>
            </div>
          </div>
        </div>

        {/* Workbooks by Program */}
        <div className="space-y-8">
          {workbooks.map((program: any) => (
            <div
              key={program.slug}
              className="bg-white rounded-xl shadow-sm p-8"
            >
              <div className="flex items-center gap-3 mb-6">
                <GraduationCap className="w-8 h-8 text-brand-blue-600" />
                <h2 className="text-2xl font-bold text-black">
                  {program.program}
                </h2>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                {program.materials.map((material) => (
                  <div
                    key={material.file}
                    className="border border-slate-200 rounded-lg p-4 hover:border-brand-blue-300 hover:shadow-md transition"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <h3 className="font-bold text-black mb-1">
                          {material.title}
                        </h3>
                        <p className="text-sm text-black">
                          {material.pages} pages • PDF Format
                        </p>
                      </div>
                      <a
                        href={`/downloads/workbooks/${material.file}`}
                        className="flex items-center gap-2 px-4 py-2 bg-brand-blue-600 text-white rounded-lg hover:bg-brand-blue-700 transition text-sm font-medium whitespace-nowrap"
                        download
                        aria-label={`Download ${material.title}`}
                      >
                        <Download className="w-4 h-4" />
                        Download
                      </a>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-4 pt-4 border-t border-slate-200">
                <Link
                  href={`/programs/${program.slug}`}
                  className="text-brand-blue-600 hover:text-brand-blue-700 font-medium"
                >
                  View Program Details →
                </Link>
              </div>
            </div>
          ))}
        </div>

        {/* Additional Resources */}
        <div className="mt-12 bg-white rounded-xl p-8">
          <h2 className="text-2xl font-bold text-black mb-4">
            Additional Resources
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            <Link
              href="/student-handbook"
              className="block p-6 bg-white rounded-lg hover:shadow-md transition"
            >
              <FileText className="w-8 h-8 text-brand-blue-600 mb-3" />
              <h3 className="font-bold text-black mb-2">
                Student Handbook
              </h3>
              <p className="text-sm text-black">
                Policies, procedures, and student rights
              </p>
            </Link>
            <Link
              href="/learner/resources"
              className="block p-6 bg-white rounded-lg hover:shadow-md transition"
            >
              <BookOpen className="w-8 h-8 text-brand-green-600 mb-3" />
              <h3 className="font-bold text-black mb-2">
                Course Materials
              </h3>
              <p className="text-sm text-black">
                Access your enrolled course materials
              </p>
            </Link>
            <Link
              href="/resources"
              className="block p-6 bg-white rounded-lg hover:shadow-md transition"
            >
              <Download className="w-8 h-8 text-brand-blue-600 mb-3" />
              <h3 className="font-bold text-black mb-2">Download Center</h3>
              <p className="text-sm text-black">
                Forms, guides, and documents
              </p>
            </Link>
          </div>
        </div>

        {/* Help Section */}
        <div className="mt-8 bg-white rounded-xl shadow-sm p-8">
          <h2 className="text-xl font-bold text-black mb-4">Need Help?</h2>
          <p className="text-black mb-4">
            If you have trouble downloading materials or need additional
            resources, contact student support:
          </p>
          <div className="flex flex-wrap gap-4">
            <a
              href="/contact"
              className="text-brand-blue-600 hover:text-brand-blue-700 font-medium"
            >
              our contact form
            </a>
            <span className="text-slate-500">|</span>
            <a
              href="/support"
              className="text-brand-blue-600 hover:text-brand-blue-700 font-medium"
            >
              support center
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
