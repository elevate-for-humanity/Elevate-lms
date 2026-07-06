export const revalidate = 3600;

import { requireRole } from '@/lib/auth/require-role';
import { Metadata } from 'next';
import Link from 'next/link';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';
import { Shield, Clock, Trash2, Lock, Database, Eye, AlertTriangle } from 'lucide-react';

export const metadata: Metadata = {
  title: `Data Governance | ${PLATFORM_DEFAULTS.orgName}`,
  description: 'Data retention, deletion policies, and governance framework for the Elevate Workforce Operating System.',
  robots: {
    index: false,
    follow: false,
  },
};

function PolicySection({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: typeof Shield;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-slate-200 overflow-hidden">
      <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex items-center gap-3">
        <Icon className="w-5 h-5 text-slate-600" />
        <h2 className="font-semibold text-slate-900">{title}</h2>
      </div>
      <div className="p-6">{children}</div>
    </section>
  );
}

export default async function DataGovernancePage() {
  await requireRole(['admin', 'super_admin', 'staff']);

  return (
    <div className="min-h-screen bg-white">
      <section className="bg-slate-900 text-white py-12">
        <div className="max-w-4xl mx-auto px-4">
          <Breadcrumbs
            items={[
              { label: 'Governance', href: '/admin/governance' },
              { label: 'Data Governance' },
            ]}
          />
          <h1 className="text-3xl md:text-4xl font-bold mt-4 mb-4">Data Governance</h1>
          <p className="text-slate-300 text-lg">
            How we handle, retain, and protect participant data in the Workforce Operating System.
          </p>
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-4 py-12 space-y-8">
        <div className="bg-brand-blue-50 border border-brand-blue-200 rounded-xl p-6">
          <h2 className="font-semibold text-brand-blue-900 mb-2">Governance Principle</h2>
          <p className="text-brand-blue-800">
            The platform automates operations. Authority over data decisions remains with workforce administrators
            and designated data stewards. All data handling follows federal and state workforce program requirements.
          </p>
        </div>

        <PolicySection title="Data Retention Policy" icon={Clock}>
          <p className="text-slate-600 mb-6">
            Data is retained according to federal workforce program requirements and state regulations. Retention
            periods are measured from the date of program exit or last activity.
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
              </tbody>
            </table>
          </div>
        </PolicySection>

        <PolicySection title="Data Deletion Policy" icon={Trash2}>
          <p className="text-slate-600 mb-6">
            Participants may request deletion of personal data subject to legal retention requirements.
          </p>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5" />
              <div>
                <div className="font-medium text-slate-900">Subject to Retention Requirements</div>
                <div className="text-slate-600 text-sm">
                  Program enrollment records, funding documentation, compliance records, and audit trails may need to
                  be retained under workforce program rules.
                </div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Lock className="w-5 h-5 text-slate-600 mt-0.5" />
              <div>
                <div className="font-medium text-slate-900">Anonymization Alternative</div>
                <div className="text-slate-600 text-sm">
                  Where deletion is not permitted, personal identifiers are removed while retaining aggregate reporting
                  data.
                </div>
              </div>
            </div>
          </div>
          <div className="mt-6 p-4 bg-slate-50 rounded-lg">
            <div className="font-medium text-slate-900 mb-2">To Request Data Deletion</div>
            <p className="text-slate-600 text-sm mb-3">
              Submit a written request to our Data Protection Officer. Requests are processed within 30 days.
            </p>
            <Link href="/contact?topic=data-deletion" className="text-brand-blue-600 text-sm font-medium hover:underline">
              Submit Deletion Request
            </Link>
          </div>
        </PolicySection>

        <PolicySection title="Access Control" icon={Eye}>
          <p className="text-slate-600 mb-6">
            Data access is role-based and logged. Only authorized personnel can access participant records.
          </p>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="p-4 bg-slate-50 rounded-lg">
              <div className="font-medium text-slate-900 mb-2">Role-Based Access</div>
              <ul className="text-slate-600 text-sm space-y-1">
                <li>Participants: own records only</li>
                <li>Advisors: assigned caseload</li>
                <li>Program staff: program participants</li>
                <li>Administrators: full access with audit</li>
              </ul>
            </div>
            <div className="p-4 bg-slate-50 rounded-lg">
              <div className="font-medium text-slate-900 mb-2">Access Logging</div>
              <ul className="text-slate-600 text-sm space-y-1">
                <li>All access attempts logged</li>
                <li>Exports tracked and attributed</li>
                <li>Anomaly detection enabled</li>
                <li>Quarterly access reviews</li>
              </ul>
            </div>
          </div>
        </PolicySection>

        <PolicySection title="Data Export & Portability" icon={Database}>
          <p className="text-slate-600 mb-6">
            Authorized users can export data in standard formats for reporting and integration purposes.
          </p>
          <div className="space-y-3">
            {['CSV Export', 'JSON Export', 'PIRL-Compatible Export'].map((label) => (
              <div key={label} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <div className="font-medium text-slate-900">{label}</div>
                <span className="bg-brand-green-100 text-brand-green-700 px-2 py-0.5 rounded text-xs">Available</span>
              </div>
            ))}
          </div>
        </PolicySection>

        <PolicySection title="Compliance Framework" icon={Shield}>
          <p className="text-slate-600 mb-6">
            The platform operates within federal and state compliance requirements.
          </p>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="p-4 border border-slate-200 rounded-lg">
              <div className="font-medium text-slate-900 mb-2">Federal Requirements</div>
              <ul className="text-slate-600 text-sm space-y-1">
                <li>WIOA (Workforce Innovation and Opportunity Act)</li>
                <li>2 CFR 200 (Uniform Guidance)</li>
                <li>FERPA where applicable</li>
                <li>Section 508 Accessibility</li>
              </ul>
            </div>
            <div className="p-4 border border-slate-200 rounded-lg">
              <div className="font-medium text-slate-900 mb-2">State Requirements</div>
              <ul className="text-slate-600 text-sm space-y-1">
                <li>Indiana DWD Reporting Standards</li>
                <li>State Apprenticeship Regulations</li>
                <li>Indiana Data Privacy Laws</li>
              </ul>
            </div>
          </div>
        </PolicySection>
      </div>
    </div>
  );
}
