import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { Shield, Circle, FileText, Lock, Download, ExternalLink } from 'lucide-react';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Compliance Documentation | Elevate for Humanity Store',
  description: 'Complete compliance documentation for WIOA, FERPA, WCAG, and grant reporting. Enterprise-grade workforce training platform.',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/store/compliance',
  },
};

export default async function CompliancePage() {
  const supabase = await createClient();

  if (!supabase) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Service Unavailable</h1>
          <p className="text-gray-600">Please try again later.</p>
        </div>
      </div>
    );
  }
  
  // Fetch compliance documents
  const { data: documents } = await supabase
    .from('compliance_documents')
    .select('*')
    .order('category');
  return (
    <div className="min-h-screen bg-white">
            <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: "Store", href: "/store" }, { label: "Compliance" }]} />
      </div>
<section className="bg-slate-100 text-slate-900 py-20">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <Shield className="w-16 h-16 mx-auto mb-6" />
          <h1 className="text-5xl font-black mb-6">
            Enterprise-Grade Compliance
          </h1>
          <p className="text-xl text-brand-green-100 max-w-3xl mx-auto">
            Built for workforce development with WIOA, FERPA, WCAG AA, and grant reporting compliance out of the box.
          </p>
        </div>
      </section>

      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Compliance Standards</h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-white rounded-xl p-8 shadow-lg">
              <div className="w-16 h-16 bg-brand-green-100 rounded-xl flex items-center justify-center mb-4">
                <Circle className="w-8 h-8 text-brand-green-600" />
              </div>
              <h3 className="text-2xl font-bold mb-4">WIOA Compliance</h3>
              <p className="text-gray-700 mb-4">
                Workforce Innovation and Opportunity Act (WIOA) compliant data collection, reporting, and performance tracking.
              </p>
              <ul className="space-y-2 mb-6">
                <li className="flex items-start gap-2">
                  <Circle className="w-5 h-5 text-brand-green-600 flex-shrink-0 mt-0.5" />
                  <span>Participant intake and eligibility tracking</span>
                </li>
                <li className="flex items-start gap-2">
                  <Circle className="w-5 h-5 text-brand-green-600 flex-shrink-0 mt-0.5" />
                  <span>Performance metrics (employment, wages, credentials)</span>
                </li>
                <li className="flex items-start gap-2">
                  <Circle className="w-5 h-5 text-brand-green-600 flex-shrink-0 mt-0.5" />
                  <span>Quarterly and annual reporting</span>
                </li>
                <li className="flex items-start gap-2">
                  <Circle className="w-5 h-5 text-brand-green-600 flex-shrink-0 mt-0.5" />
                  <span>PIRL (Participant Individual Record Layout) export</span>
                </li>
              </ul>
              <Link
                href="/store/compliance/wioa"
                className="inline-flex items-center gap-2 text-brand-green-600 font-semibold hover:text-brand-green-700"
              >
                View WIOA Documentation
                <ExternalLink className="w-4 h-4" />
              </Link>
            </div>

            <div className="bg-white rounded-xl p-8 shadow-lg">
              <div className="w-16 h-16 bg-brand-blue-100 rounded-xl flex items-center justify-center mb-4">
                <Lock className="w-8 h-8 text-brand-blue-600" />
              </div>
              <h3 className="text-2xl font-bold mb-4">FERPA Protection</h3>
              <p className="text-gray-700 mb-4">
                Family Educational Rights and Privacy Act (FERPA) compliant student data protection and access controls.
              </p>
              <ul className="space-y-2 mb-6">
                <li className="flex items-start gap-2">
                  <Circle className="w-5 h-5 text-brand-blue-600 flex-shrink-0 mt-0.5" />
                  <span>Encrypted data storage (AES-256)</span>
                </li>
                <li className="flex items-start gap-2">
                  <Circle className="w-5 h-5 text-brand-blue-600 flex-shrink-0 mt-0.5" />
                  <span>Role-based access control (RBAC)</span>
                </li>
                <li className="flex items-start gap-2">
                  <Circle className="w-5 h-5 text-brand-blue-600 flex-shrink-0 mt-0.5" />
                  <span>Audit logging and access tracking</span>
                </li>
                <li className="flex items-start gap-2">
                  <Circle className="w-5 h-5 text-brand-blue-600 flex-shrink-0 mt-0.5" />
                  <span>Student consent management</span>
                </li>
              </ul>
              <Link
                href="/store/compliance/ferpa"
                className="inline-flex items-center gap-2 text-brand-blue-600 font-semibold hover:text-brand-blue-700"
              >
                View FERPA Documentation
                <ExternalLink className="w-4 h-4" />
              </Link>
            </div>

            <div className="bg-white rounded-xl p-8 shadow-lg">
              <div className="w-16 h-16 bg-brand-blue-100 rounded-xl flex items-center justify-center mb-4">
                <FileText className="w-8 h-8 text-brand-blue-600" />
              </div>
              <h3 className="text-2xl font-bold mb-4">WCAG AA Accessibility</h3>
              <p className="text-gray-700 mb-4">
                Web Content Accessibility Guidelines (WCAG) 2.1 Level AA compliant for inclusive learning.
              </p>
              <ul className="space-y-2 mb-6">
                <li className="flex items-start gap-2">
                  <Circle className="w-5 h-5 text-brand-blue-600 flex-shrink-0 mt-0.5" />
                  <span>Screen reader compatible</span>
                </li>
                <li className="flex items-start gap-2">
                  <Circle className="w-5 h-5 text-brand-blue-600 flex-shrink-0 mt-0.5" />
                  <span>Keyboard navigation support</span>
                </li>
                <li className="flex items-start gap-2">
                  <Circle className="w-5 h-5 text-brand-blue-600 flex-shrink-0 mt-0.5" />
                  <span>Color contrast compliance</span>
                </li>
                <li className="flex items-start gap-2">
                  <Circle className="w-5 h-5 text-brand-blue-600 flex-shrink-0 mt-0.5" />
                  <span>Closed captions and transcripts</span>
                </li>
              </ul>
              <Link
                href="/store/compliance/wcag"
                className="inline-flex items-center gap-2 text-brand-blue-600 font-semibold hover:text-brand-blue-700"
              >
                View WCAG Documentation
                <ExternalLink className="w-4 h-4" />
              </Link>
            </div>

            <div className="bg-white rounded-xl p-8 shadow-lg">
              <div className="w-16 h-16 bg-brand-orange-100 rounded-xl flex items-center justify-center mb-4">
                <FileText className="w-8 h-8 text-brand-orange-600" />
              </div>
              <h3 className="text-2xl font-bold mb-4">Grant Reporting</h3>
              <p className="text-gray-700 mb-4">
                Automated reporting for federal and state workforce grants with customizable templates.
              </p>
              <ul className="space-y-2 mb-6">
                <li className="flex items-start gap-2">
                  <Circle className="w-5 h-5 text-brand-orange-600 flex-shrink-0 mt-0.5" />
                  <span>Automated data collection</span>
                </li>
                <li className="flex items-start gap-2">
                  <Circle className="w-5 h-5 text-brand-orange-600 flex-shrink-0 mt-0.5" />
                  <span>Custom report templates</span>
                </li>
                <li className="flex items-start gap-2">
                  <Circle className="w-5 h-5 text-brand-orange-600 flex-shrink-0 mt-0.5" />
                  <span>Outcome tracking and metrics</span>
                </li>
                <li className="flex items-start gap-2">
                  <Circle className="w-5 h-5 text-brand-orange-600 flex-shrink-0 mt-0.5" />
                  <span>Export to Excel, PDF, CSV</span>
                </li>
              </ul>
              <Link
                href="/store/compliance/grant-reporting"
                className="inline-flex items-center gap-2 text-brand-orange-600 font-semibold hover:text-brand-orange-700"
              >
                View Grant Documentation
                <ExternalLink className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Additional Compliance</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { title: 'SOC 2 Type II', description: 'Security and availability controls', status: 'In Progress' },
              { title: 'GDPR Ready', description: 'EU data protection compliance', status: 'Compliant' },
              { title: 'Section 508', description: 'Federal accessibility standards', status: 'Compliant' },
              { title: 'COPPA', description: 'Children\'s online privacy protection', status: 'Compliant' },
              { title: 'PCI DSS', description: 'Payment card data security', status: 'Compliant' },
              { title: 'HIPAA Ready', description: 'Healthcare data protection', status: 'Available' },
            ].map((item, idx) => (
              <div key={idx} className="bg-gray-50 rounded-lg p-6">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-bold">{item.title}</h3>
                  <span className={`px-3 py-2 rounded-full text-xs font-bold ${
                    item.status === 'Compliant' ? 'bg-brand-green-100 text-brand-green-800' :
                    item.status === 'In Progress' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-brand-blue-100 text-brand-blue-800'
                  }`}>
                    {item.status}
                  </span>
                </div>
                <p className="text-sm text-gray-600">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="bg-slate-100 rounded-2xl p-12 text-center">
            <Download className="w-16 h-16 text-brand-blue-600 mx-auto mb-6" />
            <h2 className="text-3xl font-bold mb-4">Download Complete Documentation</h2>
            <p className="text-xl text-gray-700 mb-8 max-w-2xl mx-auto">
              Get the full compliance documentation package including technical specifications, audit reports, and implementation guides.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="inline-flex items-center justify-center gap-2 bg-brand-blue-600 text-white px-8 py-4 rounded-lg font-bold hover:bg-brand-blue-700 transition">
                <Download className="w-5 h-5" />
                Download Documentation (PDF)
              </button>
              <Link
                href="/contact"
                className="inline-flex items-center justify-center gap-2 bg-white text-brand-blue-600 px-8 py-4 rounded-lg font-bold hover:bg-gray-50 transition border-2 border-brand-blue-600"
              >
                Request Compliance Audit
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
