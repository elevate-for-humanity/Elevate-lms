import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import Link from 'next/link';
import { BookOpen, Download, CheckCircle, FileText } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Student Workbooks | Elevate for Humanity',
  description: 'Access your course workbooks and learning materials.',
};

const workbooks = [
  { title: 'CNA Fundamentals Workbook', course: 'CNA Training', pages: 85, completed: true },
  { title: 'Patient Care Skills Lab Guide', course: 'CNA Training', pages: 42, completed: true },
  { title: 'HVAC Safety Procedures Manual', course: 'HVAC Technician', pages: 120, completed: false },
  { title: 'Electrical Theory Workbook', course: 'Electrical', pages: 65, completed: false },
  { title: 'Barbering Fundamentals', course: 'Barber Apprenticeship', pages: 95, completed: true },
];

export default function WorkbooksPage() {
  const completedCount = workbooks.filter(w => w.completed).length;
  
  return (
    <div className="min-h-screen bg-white">
      <Breadcrumbs items={[{ label: 'Resources', href: '/resources' }, { label: 'Workbooks' }]} />
      
      {/* Header */}
      <section className="bg-white border-b border-slate-200 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <h1 className="text-2xl font-bold text-black">My Workbooks</h1>
          <p className="text-slate-600 mt-1">Access your course materials and workbooks.</p>
        </div>
      </section>

      {/* Progress */}
      <section className="py-6 bg-slate-50 border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-slate-600">Completion Progress</span>
            <span className="text-sm font-bold text-brand-blue-600">{completedCount} of {workbooks.length} completed</span>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-2">
            <div 
              className="bg-brand-blue-600 h-2 rounded-full transition-all" 
              style={{ width: `${(completedCount / workbooks.length) * 100}%` }} 
            />
          </div>
        </div>
      </section>

      {/* Workbooks List */}
      <section className="py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="space-y-4">
            {workbooks.map((workbook) => (
              <div key={workbook.title} className="bg-white border border-slate-200 rounded-xl p-6 hover:shadow-md transition-all">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 ${workbook.completed ? 'bg-brand-green-100' : 'bg-slate-100'}`}>
                      {workbook.completed ? (
                        <CheckCircle className="w-6 h-6 text-brand-green-600" />
                      ) : (
                        <BookOpen className="w-6 h-6 text-slate-400" />
                      )}
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-black">{workbook.title}</h3>
                      <p className="text-sm text-slate-600 mt-1">{workbook.course}</p>
                      <div className="flex items-center gap-4 mt-2 text-sm text-slate-500">
                        <span className="flex items-center gap-1">
                          <FileText className="w-3 h-3" />
                          {workbook.pages} pages
                        </span>
                        {workbook.completed && (
                          <span className="text-brand-green-600 font-medium">Completed</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button className="flex items-center gap-2 bg-slate-100 text-slate-700 font-medium py-2 px-4 rounded-lg hover:bg-slate-200 transition-colors">
                      <Download className="w-4 h-4" />
                      PDF
                    </button>
                    <button className="flex items-center gap-2 bg-brand-blue-600 text-white font-medium py-2 px-4 rounded-lg hover:bg-brand-blue-700 transition-colors">
                      <BookOpen className="w-4 h-4" />
                      Open
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Help */}
      <section className="py-8 bg-slate-50">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <p className="text-slate-600 mb-4">
            Having trouble accessing your workbooks? Contact our support team.
          </p>
          <Link href="/lms/support" className="inline-block bg-brand-blue-600 text-white font-semibold py-2 px-6 rounded-lg hover:bg-brand-blue-700">
            Get Help
          </Link>
        </div>
      </section>
    </div>
  );
}
