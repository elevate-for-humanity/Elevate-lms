import { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, Shield } from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

export const metadata: Metadata = {
  title: 'Security & Data Protection Statement | Elevate for Humanity',
  description: 'How Supersonic Fast Cash LLC and its associated platform components protect personal, financial, and operational data.',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/governance/security',
  },
};

export default function SecurityDocumentPage() {
  const currentDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="min-h-screen bg-white">
      {/* Breadcrumbs */}
      <div className="bg-slate-50 border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'Governance', href: '/governance' }, { label: 'Security' }]} />
        </div>
      </div>

      {/* Header */}
      <div className="bg-slate-900 text-white py-12">
        <div className="max-w-4xl mx-auto px-4">
          <Link 
            href="/governance" 
            className="inline-flex items-center text-slate-400 hover:text-white mb-6 text-sm"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Documentation Index
          </Link>
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-slate-400 text-sm">Document 2 of 7</p>
              <h1 className="text-2xl md:text-3xl font-bold">
                Security & Data Protection Statement
              </h1>
            </div>
          </div>
          <p className="text-slate-300">
            Supersonic Fast Cash LLC & Platform Ecosystem
          </p>
          <div className="mt-4 flex flex-wrap gap-4 text-sm text-slate-400">
            <span>Version: 1.0</span>
            <span>•</span>
            <span>Last Reviewed: {currentDate}</span>
            <span>•</span>
            <span>Owner: Platform Security & Compliance</span>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-12">
        <article className="prose prose-slate max-w-none">
          {/* Section 1 */}
          <section className="mb-10">
            <h2 className="text-xl font-bold text-slate-900 border-b border-slate-200 pb-2 mb-4">
              1. Purpose
            </h2>
            <p className="text-slate-700 leading-relaxed">
              This document defines how Supersonic Fast Cash LLC and its associated platform components 
              protect personal, financial, and operational data. It exists to provide clear, accurate, 
              and reviewable information to users, partners, regulators, and payment processors regarding 
              security practices and data handling.
            </p>
            <p className="text-slate-700 leading-relaxed mt-4">
              This document governs all systems unless a more specific authoritative document explicitly 
              overrides a section.
            </p>
          </section>

          {/* Section 2 */}
          <section className="mb-10">
            <h2 className="text-xl font-bold text-slate-900 border-b border-slate-200 pb-2 mb-4">
              2. Scope
            </h2>
            <p className="text-slate-700 leading-relaxed mb-4">
              This statement applies to all platform components, including:
            </p>
            <ul className="list-disc list-inside text-slate-700 space-y-2 ml-4">
              <li>Public website and marketing pages</li>
              <li>Learning Management System (LMS)</li>
              <li>Store, checkout, and payment flows</li>
              <li>Supersonic Fast Cash tax preparation services</li>
              <li>Refund-based cash advance workflows</li>
              <li>Administrative and partner portals</li>
            </ul>
            <p className="text-slate-700 leading-relaxed mt-4">
              It applies to all users, including students, tax filers, instructors, administrators, 
              partners, and internal staff.
            </p>
          </section>

          {/* Section 3 */}
          <section className="mb-10">
            <h2 className="text-xl font-bold text-slate-900 border-b border-slate-200 pb-2 mb-4">
              3. Data Collected
            </h2>
            <p className="text-slate-700 leading-relaxed mb-4">
              Depending on the service used, the platform may collect:
            </p>
            <ul className="list-disc list-inside text-slate-700 space-y-2 ml-4">
              <li>Account information (name, email, login credentials)</li>
              <li>Tax preparation information provided by users</li>
              <li>Payment and transaction metadata</li>
              <li>Course participation and progress data</li>
              <li>Support communications</li>
              <li>System usage and diagnostic data</li>
            </ul>
            <p className="text-slate-700 leading-relaxed mt-4 font-medium">
              Only data required to deliver the service is collected.
            </p>
          </section>

          {/* Section 4 */}
          <section className="mb-10">
            <h2 className="text-xl font-bold text-slate-900 border-b border-slate-200 pb-2 mb-4">
              4. Data Storage and Protection
            </h2>
            <p className="text-slate-700 leading-relaxed mb-4">
              Data is protected using industry-standard safeguards designed to reduce unauthorized 
              access and misuse, including:
            </p>
            <ul className="list-disc list-inside text-slate-700 space-y-2 ml-4">
              <li>Encrypted data transmission</li>
              <li>Secure storage practices</li>
              <li>Environment-based access controls</li>
              <li>Separation of production and non-production environments</li>
            </ul>
            <p className="text-slate-700 leading-relaxed mt-4 italic">
              No system is represented as infallible. Security controls are designed to reduce risk, 
              not eliminate it entirely.
            </p>
          </section>

          {/* Section 5 */}
          <section className="mb-10">
            <h2 className="text-xl font-bold text-slate-900 border-b border-slate-200 pb-2 mb-4">
              5. Access Controls
            </h2>
            <p className="text-slate-700 leading-relaxed mb-4">
              Access to systems and data is limited based on role and operational need.
            </p>
            <p className="text-slate-700 leading-relaxed mb-4">Controls include:</p>
            <ul className="list-disc list-inside text-slate-700 space-y-2 ml-4">
              <li>Role-based permissions</li>
              <li>Restricted administrative access</li>
              <li>Auditability of sensitive actions</li>
              <li>Separation of duties where feasible</li>
            </ul>
            <p className="text-slate-700 leading-relaxed mt-4">
              Users are responsible for maintaining the confidentiality of their credentials.
            </p>
          </section>

          {/* Section 6 */}
          <section className="mb-10">
            <h2 className="text-xl font-bold text-slate-900 border-b border-slate-200 pb-2 mb-4">
              6. Data Retention and Deletion
            </h2>
            <p className="text-slate-700 leading-relaxed mb-4">
              Data is retained only as long as necessary to:
            </p>
            <ul className="list-disc list-inside text-slate-700 space-y-2 ml-4">
              <li>Deliver services</li>
              <li>Meet operational requirements</li>
              <li>Comply with legal and regulatory obligations</li>
            </ul>
            <p className="text-slate-700 leading-relaxed mt-4">
              Users may request account closure or data deletion where applicable, subject to 
              retention obligations.
            </p>
          </section>

          {/* Section 7 */}
          <section className="mb-10">
            <h2 className="text-xl font-bold text-slate-900 border-b border-slate-200 pb-2 mb-4">
              7. Incident Response
            </h2>
            <p className="text-slate-700 leading-relaxed mb-4">
              If a security incident affecting data is identified:
            </p>
            <ul className="list-disc list-inside text-slate-700 space-y-2 ml-4">
              <li>Access is restricted as appropriate</li>
              <li>Impact is assessed</li>
              <li>Corrective actions are taken</li>
              <li>Notifications are made when required by law or contract</li>
            </ul>
            <p className="text-slate-700 leading-relaxed mt-4">
              Incident handling is proportional to the nature and severity of the issue.
            </p>
          </section>

          {/* Section 8 */}
          <section className="mb-10">
            <h2 className="text-xl font-bold text-slate-900 border-b border-slate-200 pb-2 mb-4">
              8. User Responsibilities
            </h2>
            <p className="text-slate-700 leading-relaxed mb-4">
              Users are expected to:
            </p>
            <ul className="list-disc list-inside text-slate-700 space-y-2 ml-4">
              <li>Provide accurate information</li>
              <li>Protect login credentials</li>
              <li>Use the platform in accordance with published terms</li>
              <li>Report suspected security issues promptly</li>
            </ul>
          </section>

          {/* Section 9 */}
          <section className="mb-10">
            <h2 className="text-xl font-bold text-slate-900 border-b border-slate-200 pb-2 mb-4">
              9. Contact and Reporting
            </h2>
            <p className="text-slate-700 leading-relaxed">
              Security-related questions or concerns may be submitted through official support channels. 
              Reports are reviewed and addressed according to internal procedures.
            </p>
          </section>

          {/* Section 10 */}
          <section className="mb-10">
            <h2 className="text-xl font-bold text-slate-900 border-b border-slate-200 pb-2 mb-4">
              10. Versioning and Review
            </h2>
            <p className="text-slate-700 leading-relaxed">
              This document is reviewed periodically and updated as platform features, regulations, 
              or operational practices change.
            </p>
            <p className="text-slate-700 leading-relaxed mt-4">
              Superseded versions are archived for reference.
            </p>
          </section>
        </article>

        {/* Footer */}
        <div className="mt-12 pt-8 border-t border-slate-200">
          <p className="text-center text-slate-500 text-sm mb-6">End of Document</p>
          <div className="flex justify-center gap-4">
            <Link 
              href="/governance"
              className="px-6 py-3 bg-slate-100 text-slate-700 rounded-lg font-medium hover:bg-slate-200 transition-colors"
            >
              Back to Index
            </Link>
            <Link 
              href="/contact"
              className="px-6 py-3 bg-slate-900 text-white rounded-lg font-medium hover:bg-slate-800 transition-colors"
            >
              Contact Support
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
