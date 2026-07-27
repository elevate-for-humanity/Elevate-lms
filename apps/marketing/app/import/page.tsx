import { Metadata } from 'next';
import Link from 'next/link';
import { Upload, FileSpreadsheet, Users, BookOpen, CheckCircle, AlertCircle } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Data Import Tools | Elevate for Humanity',
  description: 'Import student data, enrollments, and course materials into the Elevate platform.',
};

const importTypes = [
  {
    icon: Users,
    title: 'Student Import',
    description: 'Bulk import student records with contact information and enrollment status.',
    formats: ['CSV', 'XLSX'],
    template: '/templates/student-import-template.csv',
  },
  {
    icon: BookOpen,
    title: 'Enrollment Import',
    description: 'Import program enrollments and track student progress across courses.',
    formats: ['CSV', 'XLSX'],
    template: '/templates/enrollment-import-template.csv',
  },
  {
    icon: FileSpreadsheet,
    title: 'Credential Import',
    description: 'Bulk upload earned credentials and certifications for students.',
    formats: ['CSV', 'XLSX', 'PDF'],
    template: '/templates/credential-import-template.csv',
  },
];

export default function Page() {
  return (
    <div className="min-h-screen bg-slate-50">
      <section className="bg-gradient-to-br from-brand-blue-700 to-brand-blue-900 text-white py-20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center gap-4 mb-4">
            <span className="bg-white/20 text-white px-4 py-1 rounded-full text-sm font-medium">Admin Tools</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Data Import Tools</h1>
          <p className="text-xl text-blue-100 max-w-2xl">Bulk import student records, enrollments, and credentials into the Elevate platform.</p>
        </div>
      </section>
      
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8 mb-12">
            {importTypes.map((item, i) => {
              const Icon = item.icon;
              return (
                <div key={i} className="bg-white rounded-2xl p-8 shadow-sm">
                  <div className="w-14 h-14 bg-brand-blue-100 rounded-xl flex items-center justify-center mb-6">
                    <Icon className="w-7 h-7 text-brand-blue-600" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-3">{item.title}</h3>
                  <p className="text-slate-600 mb-6">{item.description}</p>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm text-slate-500">
                      <span className="font-medium">Supported formats:</span>
                      <div className="flex gap-2">
                        {item.formats.map((format) => (
                          <span key={format} className="bg-slate-100 px-2 py-0.5 rounded text-xs font-medium">{format}</span>
                        ))}
                      </div>
                    </div>
                    <a href={item.template} className="inline-flex items-center gap-2 text-brand-blue-600 text-sm font-medium hover:underline">
                      <Upload className="w-4 h-4" />
                      Download Template
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
          
          <div className="bg-white rounded-2xl p-8 shadow-sm mb-12">
            <h2 className="text-xl font-bold text-slate-900 mb-6">Import Guidelines</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-slate-900">Required Fields</h4>
                    <p className="text-slate-600 text-sm">Each import type requires specific fields. Download the template for the exact column structure.</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-slate-900">Data Validation</h4>
                    <p className="text-slate-600 text-sm">All imports are validated before processing. Invalid rows will be flagged for correction.</p>
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex gap-3">
                  <AlertCircle className="w-5 h-5 text-brand-orange-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-slate-900">Character Limits</h4>
                    <p className="text-slate-600 text-sm">Some fields have character limits. Long text will be truncated to prevent errors.</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <AlertCircle className="w-5 h-5 text-brand-orange-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-slate-900">Duplicates</h4>
                    <p className="text-slate-600 text-sm">Duplicate records will be skipped or updated based on the import configuration.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-brand-blue-700 rounded-2xl p-8 text-white text-center">
            <h2 className="text-2xl font-bold mb-4">Need Help with Imports?</h2>
            <p className="text-blue-100 mb-6 max-w-xl mx-auto">Our support team can help you set up bulk imports or troubleshoot data issues.</p>
            <Link href="/contact" className="inline-block bg-white text-brand-blue-700 font-bold py-3 px-8 rounded-lg hover:bg-blue-50 transition-colors">
              Contact Support
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

