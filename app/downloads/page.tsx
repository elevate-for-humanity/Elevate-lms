import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { Download, FileText, BookOpen, GraduationCap, FileCheck } from 'lucide-react';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

export const metadata: Metadata = {
  title: 'Download Center',
  description: 'Access handbooks, workbooks, forms, and resources for students and staff',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/downloads',
  },
};

export const dynamic = 'force-dynamic';

const defaultResources = {
  handbooks: [
    {
      title: 'Student Handbook 2025-2026',
      file: 'student-handbook-2025.pdf',
      size: '2.5 MB',
      updated: '2025-12-12',
      description: 'Complete guide to policies, procedures, and student rights',
    },
    {
      title: 'Employee Handbook',
      file: 'employee-handbook.pdf',
      size: '1.8 MB',
      updated: '2025-12-12',
      description: 'Staff policies, benefits, and workplace guidelines',
    },
    {
      title: 'Safety Handbook',
      file: 'safety-handbook.pdf',
      size: '1.2 MB',
      updated: '2025-12-12',
      description: 'Safety protocols and emergency procedures',
    },
    {
      title: 'FERPA Rights Guide',
      file: 'ferpa-guide.pdf',
      size: '800 KB',
      updated: '2025-12-12',
      description: 'Student privacy rights and information access',
    },
  ],
  workbooks: [
    {
      title: 'Barbering/Cosmetology Workbook',
      file: 'barbering-workbook.pdf',
      size: '3.5 MB',
      description: 'Practice exercises and skill assessments',
    },
    {
      title: 'CNA Training Workbook',
      file: 'cna-workbook.pdf',
      size: '2.8 MB',
      description: 'Clinical skills and patient care exercises',
    },
    {
      title: 'HVAC Technician Workbook',
      file: 'hvac-workbook.pdf',
      size: '3.2 MB',
      description: 'Technical diagrams and troubleshooting guides',
    },
    {
      title: 'Tax Preparation Workbook',
      file: 'tax-workbook.pdf',
      size: '2.5 MB',
      description: 'Practice returns and case studies',
    },
    {
      title: 'CDL Training Workbook',
      file: 'cdl-workbook.pdf',
      size: '2.0 MB',
      description: 'Pre-trip inspection and driving exercises',
    },
  ],
  forms: [
    {
      title: 'Enrollment Application',
      file: 'enrollment-application.pdf',
      size: '500 KB',
    },
    {
      title: 'Change of Information Form',
      file: 'change-of-information.pdf',
      size: '300 KB',
    },
    { title: 'Withdrawal Form', file: 'withdrawal-form.pdf', size: '250 KB' },
    { title: 'Grievance Form', file: 'grievance-form.pdf', size: '400 KB' },
    {
      title: 'Transcript Request Form',
      file: 'transcript-request.pdf',
      size: '350 KB',
    },
    {
      title: 'Leave of Absence Request',
      file: 'leave-of-absence.pdf',
      size: '300 KB',
    },
    {
      title: 'Re-entry Application',
      file: 're-entry-application.pdf',
      size: '400 KB',
    },
  ],
  guides: [
    {
      title: 'Student Quick Start Guide',
      file: 'student-quick-start.pdf',
      size: '1.5 MB',
      description: 'First-day orientation and getting started',
    },
    {
      title: 'LMS User Guide',
      file: 'lms-user-guide.pdf',
      size: '2.0 MB',
      description: 'Navigate the learning management system',
    },
    {
      title: 'Financial Aid Guide',
      file: 'financial-aid-guide.pdf',
      size: '1.8 MB',
      description: 'Apply for grants, loans, and scholarships',
    },
    {
      title: 'Career Services Guide',
      file: 'career-services-guide.pdf',
      size: '1.2 MB',
      description: 'Resume writing, interviews, and job search',
    },
    {
      title: 'Accommodation Request Guide',
      file: 'accommodation-guide.pdf',
      size: '900 KB',
      description: 'Request disability accommodations',
    },
  ],
};

export default async function DownloadsPage() {
  const supabase = await createClient();

  // Get documents from database
  const { data: documents } = await supabase
    .from('documents')
    .select('*')
    .eq('is_public', true)
    .order('category', { ascending: true })
    .order('title', { ascending: true });

  // Group documents by category
  const handbooks = documents?.filter((d: any) => d.category === 'handbook') || [];
  const workbooks = documents?.filter((d: any) => d.category === 'workbook') || [];
  const forms = documents?.filter((d: any) => d.category === 'form') || [];
  const guides = documents?.filter((d: any) => d.category === 'guide') || [];

  // Use database data if available, otherwise use defaults
  const displayHandbooks = handbooks.length > 0 ? handbooks : defaultResources.handbooks;
  const displayWorkbooks = workbooks.length > 0 ? workbooks : defaultResources.workbooks;
  const displayForms = forms.length > 0 ? forms : defaultResources.forms;
  const displayGuides = guides.length > 0 ? guides : defaultResources.guides;

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: 'Downloads & Resources' }]} />
      </div>
      {/* Header */}
      <section className="bg-slate-800 text-white py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <Download className="w-16 h-16 mx-auto mb-6" />
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Download Center</h1>
            <p className="text-base md:text-lg text-slate-200">
              Access handbooks, workbooks, forms, and resources for students and staff
            </p>
          </div>
        </div>
      </section>

      {/* Notice */}
      <section className="py-4 bg-amber-50 border-b border-amber-200">
        <div className="container mx-auto px-4">
          <p className="text-center text-amber-800">
            <strong>Note:</strong> Documents are available upon request. Click "Call to Request" or
            call{' '}
            <a href={`tel:${PLATFORM_DEFAULTS.supportPhone.replace(/[^0-9]/g, "")}`} className="font-bold underline">
              {PLATFORM_DEFAULTS.supportPhone}
            </a>{' '}
            to receive any document.
          </p>
        </div>
      </section>

      {/* Quick Links */}
      <section className="py-8 bg-white border-b">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap justify-center gap-4">
            <a
              href="#handbooks"
              className="flex items-center gap-2 px-6 py-3 bg-blue-50 text-blue-700 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <BookOpen className="w-5 h-5" />
              <span className="font-semibold">Handbooks</span>
            </a>
            <a
              href="#workbooks"
              className="flex items-center gap-2 px-6 py-3 bg-brand-green-50 text-brand-green-700 rounded-lg hover:bg-brand-green-100 transition-colors"
            >
              <GraduationCap aria-label="graduationcap" className="w-5 h-5" />
              <span className="font-semibold">Workbooks</span>
            </a>
            <a
              href="#forms"
              className="flex items-center gap-2 px-6 py-3 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 transition-colors"
            >
              <FileCheck className="w-5 h-5" />
              <span className="font-semibold">Forms</span>
            </a>
            <a
              href="#guides"
              className="flex items-center gap-2 px-6 py-3 bg-orange-50 text-orange-700 rounded-lg hover:bg-orange-100 transition-colors"
            >
              <FileText className="w-5 h-5" />
              <span className="font-semibold">Guides</span>
            </a>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto space-y-16">
            {/* Handbooks */}
            <div id="handbooks">
              <div className="flex items-center gap-3 mb-8">
                <BookOpen className="w-8 h-8 text-blue-600" />
                <h2 className="text-2xl md:text-3xl font-bold">Handbooks</h2>
              </div>
              <div className="grid md:grid-cols-2 gap-6">
                {displayHandbooks.map((item: any, index: number) => (
                  <div
                    key={item.id || index}
                    className="bg-white rounded-lg shadow-sm border p-6 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold mb-2">{item.title}</h3>
                        <p className="text-sm text-slate-600 mb-3">{item.description}</p>
                        <div className="flex items-center gap-4 text-sm text-slate-500">
                          <span>{item.size || item.file_size}</span>
                          {item.updated && (
                            <>
                              <span>•</span>
                              <span>Updated {item.updated}</span>
                            </>
                          )}
                        </div>
                      </div>
                      <FileText className="w-8 h-8 text-blue-600 flex-shrink-0" />
                    </div>
                    {item.url ? (
                      <a
                        href={item.url}
                        className="w-full mt-4 flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                        download
                      >
                        <Download className="w-4 h-4" />
                        <span>Download PDF</span>
                      </a>
                    ) : (
                      <a
                        href={`tel:${PLATFORM_DEFAULTS.supportPhone.replace(/[^0-9]/g, "")}`}
                        className="w-full mt-4 flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        <Download className="w-4 h-4" />
                        <span>Call to Request</span>
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Workbooks */}
            <div id="workbooks">
              <div className="flex items-center gap-3 mb-8">
                <GraduationCap aria-label="graduationcap" className="w-8 h-8 text-brand-green-600" />
                <h2 className="text-2xl md:text-3xl font-bold">Program Workbooks</h2>
              </div>
              <div className="grid md:grid-cols-2 gap-6">
                {displayWorkbooks.map((item: any, index: number) => (
                  <div
                    key={item.id || index}
                    className="bg-white rounded-lg shadow-sm border p-6 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold mb-2">{item.title}</h3>
                        <p className="text-sm text-slate-600 mb-3">{item.description}</p>
                        <div className="text-sm text-slate-500">
                          <span>{item.size || item.file_size}</span>
                        </div>
                      </div>
                      <BookOpen className="w-8 h-8 text-brand-green-600 flex-shrink-0" />
                    </div>
                    {item.url ? (
                      <a
                        href={item.url}
                        className="w-full mt-4 flex items-center justify-center gap-2 bg-brand-green-600 text-white px-4 py-2 rounded-lg hover:bg-brand-green-700 transition-colors"
                        download
                      >
                        <Download className="w-4 h-4" />
                        <span>Download PDF</span>
                      </a>
                    ) : (
                      <a
                        href={`tel:${PLATFORM_DEFAULTS.supportPhone.replace(/[^0-9]/g, "")}`}
                        className="w-full mt-4 flex items-center justify-center gap-2 bg-brand-green-600 text-white px-4 py-2 rounded-lg hover:bg-brand-green-700 transition-colors"
                      >
                        <Download className="w-4 h-4" />
                        <span>Call to Request</span>
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Forms */}
            <div id="forms">
              <div className="flex items-center gap-3 mb-8">
                <FileCheck className="w-8 h-8 text-purple-600" />
                <h2 className="text-2xl md:text-3xl font-bold">Forms & Applications</h2>
              </div>
              <div className="grid md:grid-cols-3 gap-6">
                {displayForms.map((item: any, index: number) => (
                  <div
                    key={item.id || index}
                    className="bg-white rounded-lg shadow-sm border p-6 hover:shadow-md transition-shadow"
                  >
                    <FileText className="w-8 h-8 text-purple-600 mb-3" />
                    <h3 className="text-lg font-semibold mb-2">{item.title}</h3>
                    <div className="text-sm text-slate-500 mb-4">
                      <span>{item.size || item.file_size}</span>
                    </div>
                    {item.url ? (
                      <a
                        href={item.url}
                        className="w-full flex items-center justify-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors text-sm"
                        download
                      >
                        <Download className="w-4 h-4" />
                        <span>Download</span>
                      </a>
                    ) : (
                      <a
                        href={`tel:${PLATFORM_DEFAULTS.supportPhone.replace(/[^0-9]/g, "")}`}
                        className="w-full flex items-center justify-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors text-sm"
                      >
                        <Download className="w-4 h-4" />
                        <span>Call to Request</span>
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Guides */}
            <div id="guides">
              <div className="flex items-center gap-3 mb-8">
                <FileText className="w-8 h-8 text-orange-600" />
                <h2 className="text-2xl md:text-3xl font-bold">Student Guides</h2>
              </div>
              <div className="grid md:grid-cols-2 gap-6">
                {displayGuides.map((item: any, index: number) => (
                  <div
                    key={item.id || index}
                    className="bg-white rounded-lg shadow-sm border p-6 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold mb-2">{item.title}</h3>
                        <p className="text-sm text-slate-600 mb-3">{item.description}</p>
                        <div className="text-sm text-slate-500">
                          <span>{item.size || item.file_size}</span>
                        </div>
                      </div>
                      <FileText className="w-8 h-8 text-orange-600 flex-shrink-0" />
                    </div>
                    {item.url ? (
                      <a
                        href={item.url}
                        className="w-full mt-4 flex items-center justify-center gap-2 bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors"
                        download
                      >
                        <Download className="w-4 h-4" />
                        <span>Download PDF</span>
                      </a>
                    ) : (
                      <a
                        href={`tel:${PLATFORM_DEFAULTS.supportPhone.replace(/[^0-9]/g, "")}`}
                        className="w-full mt-4 flex items-center justify-center gap-2 bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors"
                      >
                        <Download className="w-4 h-4" />
                        <span>Call to Request</span>
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Help Section */}
      <section className="py-16 bg-white border-t">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="bg-blue-50 rounded-lg p-8 text-center">
              <h2 className="text-2xl font-bold mb-4">Need Help?</h2>
              <p className="text-slate-600 mb-6">
                Can't find what you're looking for? Our student services team is here to help.
              </p>
              <div className="flex flex-wrap gap-4 justify-center">
                <Link
                  href="/contact"
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-semibold"
                >
                  Contact Support
                </Link>
                <Link
                  href="/legal/student-handbook"
                  className="bg-white text-blue-600 px-6 py-3 rounded-lg hover:bg-slate-50 transition-colors font-semibold border-2 border-blue-600"
                >
                  View Student Handbook
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Accessibility Notice */}
      <section className="py-8 bg-slate-100">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center text-sm text-slate-600">
            <p>
              All documents are provided in PDF format. If you need documents in an alternative
              format for accessibility purposes, please contact{' '}
              <a
                href="mailto:accessibility@www.elevateforhumanity.org"
                className="text-blue-600 hover:underline"
              >
                accessibility@www.elevateforhumanity.org
              </a>
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
