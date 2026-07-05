import { Metadata } from 'next';
import Link from 'next/link';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';
import { FileText, Download, ExternalLink } from 'lucide-react';

export const metadata: Metadata = {
  title: `Resources | ${PLATFORM_DEFAULTS.orgName}`,
  description: 'Downloadable resources including program guides, funding applications, and workforce development materials.',
};

const resources = {
  students: [
    { title: 'Program Catalog', description: 'Complete guide to all training programs and apprenticeships.', format: 'PDF' },
    { title: 'Enrollment Application', description: 'Print and complete before your advising appointment.', format: 'PDF' },
    { title: 'Student Handbook', description: 'Policies, procedures, and expectations for enrolled students.', format: 'PDF' },
    { title: 'Funding Guide', description: 'Step-by-step guide to WIOA, Workforce Ready Grant, and other funding.', format: 'PDF' },
  ],
  employers: [
    { title: 'Employer Partnership Packet', description: 'How to partner with Elevate for workforce development.', format: 'PDF' },
    { title: 'Apprenticeship Sponsorship Info', description: 'Requirements for becoming a registered apprenticeship sponsor.', format: 'PDF' },
    { title: 'Hire Our Graduates', description: 'Post jobs and connect with our trained workforce.', format: 'PDF' },
  ],
  partners: [
    { title: 'Referral Partner Guide', description: 'How to refer clients and track their progress.', format: 'PDF' },
    { title: 'MOU Template', description: 'Standard Memorandum of Understanding for partnerships.', format: 'PDF' },
    { title: 'WorkOne Collaboration Guide', description: 'WIOA partnership resources and reporting.', format: 'PDF' },
  ],
};

export default function ResourcesPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <section className="bg-slate-900 py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">Resources</h1>
          <p className="text-xl text-slate-300 max-w-2xl mx-auto">
            Downloadable guides, applications, and materials for students, employers, and partners
          </p>
        </div>
      </section>

      {/* Students */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-slate-900 mb-8">For Students</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {resources.students.map((resource, i) => (
              <div key={i} className="p-6 bg-slate-50 rounded-xl border border-slate-200 hover:border-brand-red-300 transition-colors">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-brand-red-100 rounded-xl flex items-center justify-center shrink-0">
                    <FileText className="w-6 h-6 text-brand-red-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-slate-900 mb-1">{resource.title}</h3>
                    <p className="text-slate-600 text-sm mb-3">{resource.description}</p>
                    <span className="inline-flex items-center gap-1 text-xs text-slate-500 bg-white px-2 py-1 rounded">
                      {resource.format}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Employers */}
      <section className="py-16 bg-slate-50 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-slate-900 mb-8">For Employers</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {resources.employers.map((resource, i) => (
              <div key={i} className="p-6 bg-white rounded-xl border border-slate-200 hover:border-brand-red-300 transition-colors">
                <h3 className="font-bold text-slate-900 mb-2">{resource.title}</h3>
                <p className="text-slate-600 text-sm mb-4">{resource.description}</p>
                <a href="#" className="inline-flex items-center gap-1 text-brand-red-600 text-sm font-semibold">
                  <Download className="w-4 h-4" /> Download
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Partners */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-slate-900 mb-8">For Partners</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {resources.partners.map((resource, i) => (
              <div key={i} className="p-6 bg-slate-50 rounded-xl border border-slate-200 hover:border-brand-red-300 transition-colors">
                <h3 className="font-bold text-slate-900 mb-2">{resource.title}</h3>
                <p className="text-slate-600 text-sm mb-4">{resource.description}</p>
                <a href="#" className="inline-flex items-center gap-1 text-brand-red-600 text-sm font-semibold">
                  <Download className="w-4 h-4" /> Download
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-brand-red-600 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-2xl font-bold text-white mb-4">Need Help Finding Resources?</h2>
          <p className="text-white/90 mb-8">Our team can help you find the right materials for your needs.</p>
          <Link
            href="/contact"
            className="inline-flex items-center gap-2 px-8 py-4 bg-white text-brand-red-600 font-bold rounded-xl hover:bg-slate-100 transition-colors"
          >
            Contact Us <ExternalLink className="w-4 h-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}
