import { Metadata } from 'next';
import Link from 'next/link';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { 
  Shield, Clock, Trash2, Lock, FileText, 
  Database, Eye, AlertTriangle 
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Data Governance | Elevate for Humanity',
  description: 'Data retention, deletion policies, and governance framework for the Elevate Workforce Operating System.',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/governance/data',
  },
};

function PolicySection({ 
  title, 
  icon: Icon, 
  children 
}: { 
  title: string; 
  icon: typeof Shield; 
  children: React.ReactNode 
}) {
  return (
    <section className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex items-center gap-3">
        <Icon className="w-5 h-5 text-slate-600" />
        <h2 className="font-semibold text-slate-900">{title}</h2>
      </div>
      <div className="p-6">{children}</div>
    </section>
  );
}

export default function DataGovernancePage() {
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <section className="bg-slate-900 text-white py-12">
        <div className="max-w-4xl mx-auto px-4">
          <Breadcrumbs 
            items={[
              { label: 'Governance', href: '/governance' },
              { label: 'Data Governance' }
            ]} 
          />
          <h1 className="text-3xl md:text-4xl font-bold mt-4 mb-4">Data Governance</h1>
          <p className="text-slate-300 text-lg">
            How we handle, retain, and protect participant data in the Workforce Operating System.
          </p>
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-4 py-12 space-y-8">

        {/* Overview */}
        <div className="bg-brand-blue-50 border border-brand-blue-200 rounded-xl p-6">
          <h2 className="font-semibold text-brand-blue-900 mb-2">Governance Principle</h2>
          <p className="text-brand-blue-800">
            The platform automates operations. Authority over data decisions remains with workforce administrators 
            and designated data stewards. All data handling follows federal and state workforce program requirements.
          </p>
        </div>

        {/* Data Retention */}
        <PolicySection title="Data Retention Policy" icon={Clock}>
          <p className="text-slate-600 mb-6">
            Data is retained according to federal workforce program requirements and state regulations. 
            Retention periods are measured from the date of program exit or last activity.
          </p>
          
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-3 px-4 font-semibold text-slate-900">Data Category</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-900">Retention Period</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-900">Authority</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr>
                  <td className="py-3 px-4 text-slate-700">Participant Records (WIOA)</td>
                  <td className="py-3 px-4 text-slate-700">3 years after program exit</td>
                  <td className="py-3 px-4 text-slate-500">20 CFR 683.410</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 text-slate-700">Financial Records</td>
                  <td className="py-3 px-4 text-slate-700">3 years after final expenditure report</td>
                  <td className="py-3 px-4 text-slate-500">2 CFR 200.334</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 text-slate-700">Audit Logs</td>
                  <td className="py-3 px-4 text-slate-700">7 years</td>
                  <td className="py-3 px-4 text-slate-500">Internal Policy</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 text-slate-700">Training Completion Records</td>
                  <td className="py-3 px-4 text-slate-700">Permanent (anonymized after 7 years)</td>
                  <td className="py-3 px-4 text-slate-500">Credential Verification</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 text-slate-700">Employment Outcome Data</td>
                  <td className="py-3 px-4 text-slate-700">3 years after last follow-up</td>
                  <td className="py-3 px-4 text-slate-500">WIOA Performance Reporting</td>
                </tr>
              </tbody>
            </table>
          </div>
        </PolicySection>

        {/* Data Deletion */}
        <PolicySection title="Data Deletion Policy" icon={Trash2}>
          <p className="text-slate-600 mb-6">
            Participants may request deletion of their personal data subject to legal retention requirements.
          </p>

          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <span className="text-slate-400 flex-shrink-0">•</span>
              <div>
                <div className="font-medium text-slate-900">Eligible for Deletion</div>
                <div className="text-slate-600 text-sm">
                  Marketing preferences, optional profile fields, non-program communications
                </div>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5" />
              <div>
                <div className="font-medium text-slate-900">Subject to Retention Requirements</div>
                <div className="text-slate-600 text-sm">
                  Program enrollment records, funding documentation, compliance records, audit trails
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Lock className="w-5 h-5 text-slate-600 mt-0.5" />
              <div>
                <div className="font-medium text-slate-900">Anonymization Alternative</div>
                <div className="text-slate-600 text-sm">
                  Where deletion is not permitted, personal identifiers are removed while retaining 
                  aggregate program data for reporting purposes.
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 p-4 bg-slate-50 rounded-lg">
            <div className="font-medium text-slate-900 mb-2">To Request Data Deletion</div>
            <p className="text-slate-600 text-sm mb-3">
              Submit a written request to our Data Protection Officer. Requests are processed within 30 days.
            </p>
            <Link 
              href="/contact?topic=data-deletion" 
              className="text-brand-blue-600 text-sm font-medium hover:underline"
            >
              Submit Deletion Request →
            </Link>
          </div>
        </PolicySection>

        {/* Access Control */}
        <PolicySection title="Access Control" icon={Eye}>
          <p className="text-slate-600 mb-6">
            Data access is role-based and logged. Only authorized personnel can access participant records.
          </p>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="p-4 bg-slate-50 rounded-lg">
              <div className="font-medium text-slate-900 mb-2">Role-Based Access</div>
              <ul className="text-slate-600 text-sm space-y-1">
                <li>• Participants: Own records only</li>
                <li>• Advisors: Assigned caseload</li>
                <li>• Program Staff: Program participants</li>
                <li>• Administrators: Full access with audit</li>
              </ul>
            </div>
            <div className="p-4 bg-slate-50 rounded-lg">
              <div className="font-medium text-slate-900 mb-2">Access Logging</div>
              <ul className="text-slate-600 text-sm space-y-1">
                <li>• All access attempts logged</li>
                <li>• Exports tracked and attributed</li>
                <li>• Anomaly detection enabled</li>
                <li>• Quarterly access reviews</li>
              </ul>
            </div>
          </div>
        </PolicySection>

        {/* Data Export */}
        <PolicySection title="Data Export & Portability" icon={Database}>
          <p className="text-slate-600 mb-6">
            Authorized users can export data in standard formats for reporting and integration purposes.
          </p>

          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
              <div>
                <div className="font-medium text-slate-900">CSV Export</div>
                <div className="text-slate-500 text-sm">Standard tabular format</div>
              </div>
              <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded text-xs">Available</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
              <div>
                <div className="font-medium text-slate-900">JSON Export</div>
                <div className="text-slate-500 text-sm">Structured data format</div>
              </div>
              <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded text-xs">Available</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
              <div>
                <div className="font-medium text-slate-900">PIRL-Compatible Export</div>
                <div className="text-slate-500 text-sm">WIOA performance reporting format</div>
              </div>
              <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded text-xs">Available</span>
            </div>
          </div>
        </PolicySection>

        {/* Compliance */}
        <PolicySection title="Compliance Framework" icon={Shield}>
          <p className="text-slate-600 mb-6">
            The platform operates within federal and state compliance requirements.
          </p>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="p-4 border border-slate-200 rounded-lg">
              <div className="font-medium text-slate-900 mb-2">Federal Requirements</div>
              <ul className="text-slate-600 text-sm space-y-1">
                <li>• WIOA (Workforce Innovation and Opportunity Act)</li>
                <li>• 2 CFR 200 (Uniform Guidance)</li>
                <li>• FERPA (where applicable)</li>
                <li>• Section 508 Accessibility</li>
              </ul>
            </div>
            <div className="p-4 border border-slate-200 rounded-lg">
              <div className="font-medium text-slate-900 mb-2">State Requirements</div>
              <ul className="text-slate-600 text-sm space-y-1">
                <li>• Indiana DWD Reporting Standards</li>
                <li>• State Apprenticeship Regulations</li>
                <li>• Indiana Data Privacy Laws</li>
              </ul>
            </div>
          </div>
        </PolicySection>

        {/* Contact */}
        <div className="bg-slate-100 rounded-xl p-6 text-center">
          <h3 className="font-semibold text-slate-900 mb-2">Data Governance Questions</h3>
          <p className="text-slate-600 text-sm mb-4">
            For questions about data handling, retention, or deletion requests, contact our Data Protection Officer.
          </p>
          <Link 
            href="/governance/contact" 
            className="inline-flex items-center gap-2 bg-slate-900 text-white px-6 py-2 rounded-lg font-medium hover:bg-slate-800 transition"
          >
            Contact Governance Team
          </Link>
        </div>

      </div>

      {/* Footer */}
      <footer className="bg-slate-100 border-t border-slate-200 py-6">
        <div className="max-w-4xl mx-auto px-4 text-center text-sm text-slate-500">
          Last updated: February 2026. This policy is reviewed quarterly.
        </div>
      </footer>
    </div>
  );
}
