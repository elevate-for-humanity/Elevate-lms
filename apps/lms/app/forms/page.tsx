import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import Link from 'next/link';
import { FileText, Download, Edit, Clock } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Forms & Documents | Elevate for Humanity',
  description: 'Access and download required forms and documents.',
};

const forms = [
  { title: 'Student Enrollment Agreement', category: 'Enrollment', updated: 'Jan 15, 2026', required: true },
  { title: 'WIOA Participant Agreement', category: 'Funding', updated: 'Jan 20, 2026', required: true },
  { title: 'Background Check Authorization', category: 'Compliance', updated: 'Feb 1, 2026', required: true },
  { title: 'Drug Testing Consent Form', category: 'Compliance', updated: 'Jan 10, 2026', required: true },
  { title: 'Photo Release Form', category: 'Marketing', updated: 'Dec 15, 2025', required: false },
  { title: 'Emergency Contact Form', category: 'Personal', updated: 'Jan 5, 2026', required: true },
  { title: 'Work Permit Application (Under 18)', category: 'Compliance', updated: 'Feb 5, 2026', required: false },
  { title: 'Tuition Payment Plan Agreement', category: 'Financial', updated: 'Jan 25, 2026', required: false },
];

const categories = ['All', 'Enrollment', 'Funding', 'Compliance', 'Marketing', 'Personal', 'Financial'];

export default function FormsPage() {
  return (
    <div className="min-h-screen bg-white">
      <Breadcrumbs items={[{ label: 'Resources', href: '/resources' }, { label: 'Forms' }]} />
      
      {/* Header */}
      <section className="bg-gradient-to-br from-brand-blue-700 to-brand-blue-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4">
          <h1 className="text-3xl font-bold mb-4">Forms & Documents</h1>
          <p className="text-blue-100 max-w-2xl">
            Download and complete required forms for your program enrollment and funding applications.
          </p>
        </div>
      </section>

      {/* Forms List */}
      <section className="py-12">
        <div className="max-w-4xl mx-auto px-4">
          <div className="space-y-4">
            {forms.map((form) => (
              <div key={form.title} className="bg-white border border-slate-200 rounded-xl p-6 hover:shadow-md transition-all">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-brand-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <FileText className="w-6 h-6 text-brand-blue-600" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-bold text-black">{form.title}</h3>
                        {form.required && (
                          <span className="px-2 py-0.5 bg-brand-red-100 text-brand-red-700 text-xs font-medium rounded">
                            Required
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-4 mt-2 text-sm text-slate-500">
                        <span className="px-2 py-0.5 bg-slate-100 rounded">{form.category}</span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          Updated {form.updated}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button className="flex items-center gap-2 bg-slate-100 text-slate-700 font-medium py-2 px-4 rounded-lg hover:bg-slate-200 transition-colors">
                      <Download className="w-4 h-4" />
                      Download
                    </button>
                    <button className="flex items-center gap-2 bg-brand-blue-600 text-white font-medium py-2 px-4 rounded-lg hover:bg-brand-blue-700 transition-colors">
                      <Edit className="w-4 h-4" />
                      Fill Out
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Help */}
      <section className="py-12 bg-slate-50">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-xl font-bold text-black mb-4">Need Help with Forms?</h2>
          <p className="text-slate-600 mb-6">
            Our admissions team can help you complete required forms during your enrollment appointment.
          </p>
          <Link href="/contact" className="inline-block bg-brand-blue-600 text-white font-semibold py-3 px-6 rounded-lg hover:bg-brand-blue-700">
            Contact Admissions
          </Link>
        </div>
      </section>
    </div>
  );
}
