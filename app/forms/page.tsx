import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import Link from 'next/link';
import { FileText, Download, ClipboardList, UserPlus, Shield, Building2 } from 'lucide-react';

export const metadata: Metadata = {
  alternates: { canonical: 'https://www.elevateforhumanity.org/forms' },
  title: 'Forms & Documents | Elevate For Humanity',
  description: 'Download enrollment forms, funding applications, compliance documents, and program-specific forms.',
};

const FORM_CATEGORIES = [
  {
    title: 'Enrollment',
    icon: UserPlus,
    forms: [
      { name: 'Student Enrollment Application', desc: 'Required for all new students.' },
      { name: 'Program Change Request', desc: 'Request to switch to a different training program.' },
      { name: 'Withdrawal Form', desc: 'Formal withdrawal from a training program.' },
    ],
  },
  {
    title: 'Financial Aid & Funding',
    icon: ClipboardList,
    forms: [
      { name: 'WIOA Eligibility Checklist', desc: 'Documents needed for WIOA funding determination.' },
      { name: 'Supportive Services Request', desc: 'Request transportation, childcare, or other support.' },
      { name: 'Third-Party Payment Authorization', desc: 'For employer or agency-sponsored students.' },
    ],
  },
  {
    title: 'Compliance & Policy',
    icon: Shield,
    forms: [
      { name: 'Grievance Form', desc: 'File a formal grievance or complaint.' },
      { name: 'Accommodation Request', desc: 'Request disability accommodations under ADA.' },
      { name: 'FERPA Release Authorization', desc: 'Authorize release of educational records.' },
    ],
  },
  {
    title: 'Employer & Partner',
    icon: Building2,
    forms: [
      { name: 'Employer Partnership Application', desc: 'Apply to become a hiring partner.' },
      { name: 'Memorandum of Understanding (MOU)', desc: 'Partnership agreement template.' },
      { name: 'Student Referral Form', desc: 'Refer a client or employee to training.' },
    ],
  },
];

export default function FormsPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: 'Forms & Documents' }]} />
      </div>

      {/* Header */}
      <section className="bg-brand-blue-700 text-white py-12">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <FileText className="w-10 h-10 mx-auto mb-4 text-gray-300" />
          <h1 className="text-3xl md:text-4xl font-bold mb-3">Forms & Documents</h1>
          <p className="text-slate-600 text-lg">Download the forms you need for enrollment, funding, compliance, and partnerships.</p>
        </div>
      </section>

      {/* Form Categories */}
      <section className="py-16">
        <div className="max-w-5xl mx-auto px-4 space-y-12">
          {FORM_CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            return (
              <div key={cat.title}>
                <div className="flex items-center gap-3 mb-6">
                  <Icon className="w-6 h-6 text-brand-blue-600" />
                  <h2 className="text-xl font-bold text-gray-900">{cat.title}</h2>
                </div>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {cat.forms.map((form) => (
                    <div key={form.name} className="bg-white border border-gray-200 rounded-lg p-5 hover:shadow-sm transition-all">
                      <h3 className="font-semibold text-gray-900 mb-1 text-sm">{form.name}</h3>
                      <p className="text-gray-500 text-xs mb-3">{form.desc}</p>
                      <span className="text-brand-blue-600 text-xs font-medium inline-flex items-center gap-1">
                        <Download className="w-3 h-3" />
                        Available upon request
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Contact */}
      <section className="py-12 bg-white">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <p className="text-gray-600 mb-4">Need a form not listed here? Contact our enrollment team.</p>
          <Link href="/contact" className="bg-brand-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-brand-blue-700 transition">Contact Us</Link>
        </div>
      </section>
    </div>
  );
}
