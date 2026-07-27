import { Metadata } from 'next';
import Link from 'next/link';
import { Database, Clock, Trash2, Download, Shield, MapPin } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Data Processing | Elevate Security',
  description: 'Data processing agreement, retention policies, and deletion procedures for the Elevate Workforce Platform.',
  keywords: ['data processing', 'data retention', 'GDPR', 'data deletion', 'privacy'],
};

const dataCategories = [
  {
    category: 'Student Records',
    description: 'Enrollment, progress, grades, credentials',
    retention: '7 years after last activity',
    legalBasis: 'Education records (FERPA)',
  },
  {
    category: 'Employment Data',
    description: 'Apprenticeship records, OJT hours, employer data',
    retention: '7 years post-program',
    legalBasis: 'DOL recordkeeping requirements',
  },
  {
    category: 'Financial Data',
    description: 'Payments, invoices, refunds',
    retention: '7 years (IRS requirement)',
    legalBasis: 'Tax and financial regulations',
  },
  {
    category: 'Communications',
    description: 'Support tickets, messages, emails',
    retention: '3 years after closure',
    legalBasis: 'Business records',
  },
  {
    category: 'Audit Logs',
    description: 'System access, changes, exports',
    retention: '7 years',
    legalBasis: 'Compliance requirements',
  },
];

const subprocessors = [
  { name: 'Supabase', service: 'Database & Authentication', data: 'User accounts, program data', location: 'US' },
  { name: 'Vercel', service: 'Hosting', data: 'Application code and assets', location: 'US/EU' },
  { name: 'Stripe', service: 'Payment Processing', data: 'Payment information', location: 'US' },
  { name: 'SendGrid', service: 'Email Delivery', data: 'Email addresses', location: 'US' },
];

export default function DataProcessingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <section className="bg-slate-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center gap-2 text-sm text-slate-400 mb-4">
            <Link href="/security" className="hover:text-white">Security</Link>
            <span>/</span>
            <span className="text-white">Data Processing</span>
          </div>
          <div className="flex items-start gap-6">
            <div className="w-16 h-16 bg-blue-600/20 rounded-2xl flex items-center justify-center flex-shrink-0">
              <Database className="w-8 h-8 text-blue-400" />
            </div>
            <div>
              <h1 className="text-4xl font-bold mb-4">Data Processing Agreement</h1>
              <p className="text-xl text-slate-300 max-w-2xl">
                How we collect, process, store, and protect participant and organizational data.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Data Categories & Retention */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-slate-900 mb-6">Data Categories & Retention</h2>
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <table className="w-full">
              <thead className="bg-slate-50">
                <tr>
                  <th className="text-left py-4 px-6 font-bold text-slate-900">Category</th>
                  <th className="text-left py-4 px-6 font-bold text-slate-900">Description</th>
                  <th className="text-left py-4 px-6 font-bold text-slate-900">Retention</th>
                  <th className="text-left py-4 px-6 font-bold text-slate-900">Legal Basis</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {dataCategories.map((item) => (
                  <tr key={item.category} className="hover:bg-slate-50">
                    <td className="py-4 px-6 font-medium text-slate-900">{item.category}</td>
                    <td className="py-4 px-6 text-slate-600 text-sm">{item.description}</td>
                    <td className="py-4 px-6 text-slate-600 text-sm">{item.retention}</td>
                    <td className="py-4 px-6 text-slate-600 text-sm">{item.legalBasis}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Data Location */}
      <section className="py-16 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-slate-900 mb-6">Data Residency</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <div className="flex items-center gap-3 mb-4">
                <MapPin className="w-6 h-6 text-slate-600" />
                <h3 className="font-bold text-slate-900">Primary Storage</h3>
              </div>
              <p className="text-slate-600 mb-4">
                All participant data is stored in data centers located within the United States.
              </p>
              <ul className="space-y-2 text-sm text-slate-600">
                <li>• Supabase: US-East-1</li>
                <li>• Vercel Edge: US regions</li>
                <li>• Backups: US multi-region</li>
              </ul>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <div className="flex items-center gap-3 mb-4">
                <Shield className="w-6 h-6 text-slate-600" />
                <h3 className="font-bold text-slate-900">Data Classification</h3>
              </div>
              <p className="text-slate-600 mb-4">
                Data is classified and handled according to sensitivity levels.
              </p>
              <ul className="space-y-2 text-sm text-slate-600">
                <li>• <strong>High:</strong> SSN, financial, credentials</li>
                <li>• <strong>Medium:</strong> Student records, progress</li>
                <li>• <strong>Low:</strong> Public content, analytics</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Subprocessors */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-slate-900 mb-6">Subprocessors</h2>
          <p className="text-slate-600 mb-6">
            We use the following third-party services to process data. All subprocessors are contractually 
            bound to data protection requirements.
          </p>
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <table className="w-full">
              <thead className="bg-slate-50">
                <tr>
                  <th className="text-left py-4 px-6 font-bold text-slate-900">Provider</th>
                  <th className="text-left py-4 px-6 font-bold text-slate-900">Service</th>
                  <th className="text-left py-4 px-6 font-bold text-slate-900">Data Processed</th>
                  <th className="text-left py-4 px-6 font-bold text-slate-900">Location</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {subprocessors.map((sp) => (
                  <tr key={sp.name} className="hover:bg-slate-50">
                    <td className="py-4 px-6 font-medium text-slate-900">{sp.name}</td>
                    <td className="py-4 px-6 text-slate-600 text-sm">{sp.service}</td>
                    <td className="py-4 px-6 text-slate-600 text-sm">{sp.data}</td>
                    <td className="py-4 px-6 text-slate-600 text-sm">{sp.location}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Data Rights */}
      <section className="py-16 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-slate-900 mb-6">Participant Data Rights</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <Download className="w-8 h-8 text-brand-blue-600 mb-4" />
              <h3 className="font-bold text-slate-900 mb-2">Data Export</h3>
              <p className="text-slate-600 text-sm">
                Participants can export their data in machine-readable format (JSON, CSV) at any time.
              </p>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <Trash2 className="w-8 h-8 text-brand-blue-600 mb-4" />
              <h3 className="font-bold text-slate-900 mb-2">Data Deletion</h3>
              <p className="text-slate-600 text-sm">
                Participants can request deletion of their account and personal data, subject to legal retention requirements.
              </p>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <Clock className="w-8 h-8 text-brand-blue-600 mb-4" />
              <h3 className="font-bold text-slate-900 mb-2">Retention</h3>
              <p className="text-slate-600 text-sm">
                Data is retained only as long as necessary for the stated purposes, with defined retention periods.
              </p>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <Shield className="w-8 h-8 text-brand-blue-600 mb-4" />
              <h3 className="font-bold text-slate-900 mb-2">Security</h3>
              <p className="text-slate-600 text-sm">
                All data is protected with encryption, access controls, and regular security assessments.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Contact */}
      <section className="py-12 bg-slate-900 text-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-2xl font-bold mb-4">Request Data Processing Agreement</h2>
          <p className="text-slate-300 mb-6">
            For government procurement, we provide Data Processing Agreements (DPA) and additional documentation.
          </p>
          <Link href="/contact?subject=data-processing-agreement" className="inline-flex bg-white text-slate-900 font-bold py-3 px-6 rounded-lg hover:bg-slate-100">
            Contact Us
          </Link>
        </div>
      </section>
    </div>
  );
}
