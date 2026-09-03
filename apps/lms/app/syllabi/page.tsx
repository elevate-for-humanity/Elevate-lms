import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import Link from 'next/link';
import { FileText, Download, Clock, BookOpen } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Course Syllabi | Elevate for Humanity',
  description: 'View and download course syllabi and outlines.',
};

const syllabi = [
  { title: 'CNA Training Program', version: '2026.1', updated: 'Jan 15, 2026', modules: 12, hours: 120 },
  { title: 'HVAC Technician Fundamentals', version: '2026.1', updated: 'Feb 1, 2026', modules: 10, hours: 160 },
  { title: 'Barber Apprenticeship Curriculum', version: '2026.1', updated: 'Jan 20, 2026', modules: 15, hours: 1000 },
  { title: 'CDL Class A Training', version: '2026.1', updated: 'Feb 10, 2026', modules: 8, hours: 160 },
  { title: 'IT Support Fundamentals', version: '2026.1', updated: 'Jan 25, 2026', modules: 14, hours: 200 },
];

export default function SyllabiPage() {
  return (
    <div className="min-h-screen bg-white">
      <Breadcrumbs items={[{ label: 'Resources', href: '/resources' }, { label: 'Syllabi' }]} />
      
      {/* Header */}
      <section className="bg-gradient-to-br from-brand-blue-700 to-brand-blue-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center gap-4 mb-4">
            <FileText className="w-10 h-10" />
            <h1 className="text-3xl font-bold">Course Syllabi</h1>
          </div>
          <p className="text-blue-100 max-w-2xl">
            Download detailed course outlines, learning objectives, and curriculum information for all Elevate programs.
          </p>
        </div>
      </section>

      {/* Syllabi List */}
      <section className="py-12">
        <div className="max-w-4xl mx-auto px-4">
          <div className="space-y-4">
            {syllabi.map((syllabus) => (
              <div key={syllabus.title} className="bg-white border border-slate-200 rounded-xl p-6 hover:shadow-md transition-all">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-brand-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <BookOpen className="w-6 h-6 text-brand-blue-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-black">{syllabus.title}</h3>
                      <div className="flex items-center gap-4 mt-2 text-sm text-slate-500">
                        <span>Version {syllabus.version}</span>
                        <span>Updated {syllabus.updated}</span>
                      </div>
                      <div className="flex items-center gap-4 mt-3">
                        <span className="flex items-center gap-1 text-sm text-slate-600">
                          <BookOpen className="w-4 h-4" />
                          {syllabus.modules} modules
                        </span>
                        <span className="flex items-center gap-1 text-sm text-slate-600">
                          <Clock className="w-4 h-4" />
                          {syllabus.hours} hours
                        </span>
                      </div>
                    </div>
                  </div>
                  <button className="flex items-center gap-2 bg-slate-100 text-slate-700 font-medium py-2 px-4 rounded-lg hover:bg-slate-200 transition-colors">
                    <Download className="w-4 h-4" />
                    Download PDF
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-12 bg-slate-50">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-xl font-bold text-black mb-4">Need More Information?</h2>
          <p className="text-slate-600 mb-6">
            Contact our admissions team for detailed curriculum information or to schedule a program preview.
          </p>
          <Link href="/contact" className="inline-block bg-brand-blue-600 text-white font-semibold py-3 px-6 rounded-lg hover:bg-brand-blue-700">
            Contact Admissions
          </Link>
        </div>
      </section>
    </div>
  );
}
