import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import Link from 'next/link';
import { AlertTriangle } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Incident Response Policy | Elevate for Humanity',
  description: 'How we detect, respond to, and resolve platform incidents.',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/policies/incident-response',
  },
};

export default function IncidentResponsePage() {
  return (
    <div className="min-h-screen bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: "Policies", href: "/policies" }, { label: "Incident Response" }]} />
      </div>
<div className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
        <article className="bg-white rounded-xl shadow-sm p-8 md:p-12">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-black mb-4">Incident Response Policy</h1>
            <p className="text-sm text-gray-600">Effective Date: January 24, 2026</p>
          </div>

          <div className="prose prose-lg max-w-none">
            <p className="text-black mb-8">
              This policy outlines how Elevate for Humanity detects, responds to, and resolves 
              incidents affecting platform availability or security.
            </p>

            <h2 className="text-2xl font-bold text-black mt-8 mb-4">Severity Levels</h2>
            
            <div className="space-y-4 mb-8">
              <div className="bg-brand-red-50 border-l-4 border-brand-red-500 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="w-5 h-5 text-brand-red-600" />
                  <h3 className="font-bold text-brand-red-900 m-0">SEV-1: Critical</h3>
                </div>
                <p className="text-brand-red-800 m-0">
                  Full platform outage or data security risk affecting all users.
                </p>
              </div>

              <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="w-5 h-5 text-yellow-600" />
                  <h3 className="font-bold text-yellow-900 m-0">SEV-2: Major</h3>
                </div>
                <p className="text-yellow-800 m-0">
                  Partial outage or significantly degraded performance affecting many users.
                </p>
              </div>

              <div className="bg-brand-blue-50 border-l-4 border-brand-blue-500 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="w-5 h-5 text-brand-blue-600" />
                  <h3 className="font-bold text-brand-blue-900 m-0">SEV-3: Minor</h3>
                </div>
                <p className="text-brand-blue-800 m-0">
                  Non-critical issue with limited impact or workaround available.
                </p>
              </div>
            </div>

            <h2 className="text-2xl font-bold text-black mt-8 mb-4">Response Targets</h2>
            
            <div className="overflow-x-auto mb-8">
              <table className="min-w-full border border-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left font-bold text-black border-b">Severity</th>
                    <th className="px-4 py-3 text-left font-bold text-black border-b">Acknowledgment</th>
                    <th className="px-4 py-3 text-left font-bold text-black border-b">Status Update</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="px-4 py-3 border-b text-black">SEV-1</td>
                    <td className="px-4 py-3 border-b text-black">Within 1 business hour</td>
                    <td className="px-4 py-3 border-b text-black">Every 30 minutes</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 border-b text-black">SEV-2</td>
                    <td className="px-4 py-3 border-b text-black">Same business day</td>
                    <td className="px-4 py-3 border-b text-black">Every 2 hours</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 border-b text-black">SEV-3</td>
                    <td className="px-4 py-3 border-b text-black">Next business day</td>
                    <td className="px-4 py-3 border-b text-black">As needed</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <h2 className="text-2xl font-bold text-black mt-8 mb-4">Response Process</h2>
            
            <div className="space-y-4 mb-8">
              <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
                <div className="w-8 h-8 bg-brand-blue-600 text-white rounded-full flex items-center justify-center font-bold flex-shrink-0">
                  1
                </div>
                <div>
                  <h3 className="font-bold text-black mb-1">Detect</h3>
                  <p className="text-gray-700 m-0">
                    Automated monitoring detects anomalies and alerts the response team.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
                <div className="w-8 h-8 bg-brand-blue-600 text-white rounded-full flex items-center justify-center font-bold flex-shrink-0">
                  2
                </div>
                <div>
                  <h3 className="font-bold text-black mb-1">Contain</h3>
                  <p className="text-gray-700 m-0">
                    Immediate actions to limit impact and prevent escalation.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
                <div className="w-8 h-8 bg-brand-blue-600 text-white rounded-full flex items-center justify-center font-bold flex-shrink-0">
                  3
                </div>
                <div>
                  <h3 className="font-bold text-black mb-1">Communicate</h3>
                  <p className="text-gray-700 m-0">
                    Post status update to <Link href="/status" className="text-brand-blue-600 hover:underline">status page</Link> and notify affected users.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
                <div className="w-8 h-8 bg-brand-blue-600 text-white rounded-full flex items-center justify-center font-bold flex-shrink-0">
                  4
                </div>
                <div>
                  <h3 className="font-bold text-black mb-1">Resolve</h3>
                  <p className="text-gray-700 m-0">
                    Implement fix and verify systems are restored to normal operation.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
                <div className="w-8 h-8 bg-brand-blue-600 text-white rounded-full flex items-center justify-center font-bold flex-shrink-0">
                  5
                </div>
                <div>
                  <h3 className="font-bold text-black mb-1">Document</h3>
                  <p className="text-gray-700 m-0">
                    Record incident details, root cause, and corrective actions taken.
                  </p>
                </div>
              </div>
            </div>

            <h2 className="text-2xl font-bold text-black mt-8 mb-4">Communication Channels</h2>
            <ul className="list-disc pl-6 mb-6 text-black space-y-2">
              <li><Link href="/status" className="text-brand-blue-600 hover:underline">Status Page</Link> - Real-time system status</li>
              <li>Email notifications for affected users (when applicable)</li>
              <li><Link href="/contact" className="text-brand-blue-600 hover:underline">Support Contact</Link> - For questions and assistance</li>
            </ul>

            <h2 className="text-2xl font-bold text-black mt-8 mb-4">Related Policies</h2>
            <ul className="list-disc pl-6 mb-6 text-black space-y-2">
              <li><Link href="/policies/sla" className="text-brand-blue-600 hover:underline">Service Level Agreement</Link></li>
              <li><Link href="/policies/disaster-recovery" className="text-brand-blue-600 hover:underline">Disaster Recovery Plan</Link></li>
              <li><Link href="/governance/security" className="text-brand-blue-600 hover:underline">Security Policy</Link></li>
            </ul>
          </div>
        </article>
      </div>
    </div>
  );
}
