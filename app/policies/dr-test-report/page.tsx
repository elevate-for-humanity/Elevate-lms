import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import Link from 'next/link';
import { Calendar, Database, Clock, Shield } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Disaster Recovery Test Report | Elevate for Humanity',
  description: 'Documentation of disaster recovery drill execution and results.',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/policies/dr-test-report',
  },
};

export default function DRTestReportPage() {
  return (
    <div className="min-h-screen bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: "Policies", href: "/policies" }, { label: "Dr Test Report" }]} />
      </div>
<div className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
        <article className="bg-white rounded-xl shadow-sm p-8 md:p-12">
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <span className="text-slate-400 flex-shrink-0">•</span>
              </div>
              <div>
                <h1 className="text-3xl font-bold text-black">Disaster Recovery Test Report</h1>
                <p className="text-green-600 font-medium">Test Completed Successfully</p>
              </div>
            </div>
          </div>

          {/* Test Summary */}
          <div className="bg-green-50 border border-green-200 rounded-xl p-6 mb-8">
            <h2 className="text-xl font-bold text-green-900 mb-4">Test Summary</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-green-600" />
                <div>
                  <p className="text-sm text-green-700">Test Date</p>
                  <p className="font-semibold text-green-900">January 24, 2026</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Database className="w-5 h-5 text-green-600" />
                <div>
                  <p className="text-sm text-green-700">Backup Source</p>
                  <p className="font-semibold text-green-900">Supabase Automated Daily Backup</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-green-600" />
                <div>
                  <p className="text-sm text-green-700">Recovery Time</p>
                  <p className="font-semibold text-green-900">&lt; 4 hours (within RTO)</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Shield className="w-5 h-5 text-green-600" />
                <div>
                  <p className="text-sm text-green-700">Result</p>
                  <p className="font-semibold text-green-900">PASSED</p>
                </div>
              </div>
            </div>
          </div>

          <div className="prose prose-lg max-w-none">
            <h2 className="text-2xl font-bold text-black mt-8 mb-4">Test Scope</h2>
            <p className="text-black mb-4">
              This disaster recovery drill verified our ability to restore platform operations 
              from automated backups in the event of a catastrophic failure.
            </p>
            <ul className="list-disc pl-6 mb-6 text-black space-y-2">
              <li>Database restore from point-in-time backup</li>
              <li>Verification of data integrity post-restore</li>
              <li>Confirmation of application functionality</li>
              <li>Validation of RTO/RPO targets</li>
            </ul>

            <h2 className="text-2xl font-bold text-black mt-8 mb-4">Test Procedure</h2>
            <ol className="list-decimal pl-6 mb-6 text-black space-y-3">
              <li>
                <strong>Backup Identification:</strong> Located most recent automated backup 
                from Supabase dashboard (daily backup, &lt;24 hours old)
              </li>
              <li>
                <strong>Restore Initiation:</strong> Initiated point-in-time recovery to 
                isolated test environment
              </li>
              <li>
                <strong>Data Verification:</strong> Confirmed critical tables restored with 
                expected row counts and data integrity
              </li>
              <li>
                <strong>Application Testing:</strong> Verified core application functions 
                against restored database
              </li>
              <li>
                <strong>Documentation:</strong> Recorded results and confirmed RTO/RPO compliance
              </li>
            </ol>

            <h2 className="text-2xl font-bold text-black mt-8 mb-4">Results</h2>
            
            <div className="overflow-x-auto mb-8">
              <table className="min-w-full border border-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left font-bold text-black border-b">Metric</th>
                    <th className="px-4 py-3 text-left font-bold text-black border-b">Target</th>
                    <th className="px-4 py-3 text-left font-bold text-black border-b">Actual</th>
                    <th className="px-4 py-3 text-left font-bold text-black border-b">Status</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="px-4 py-3 border-b text-black">Recovery Time (RTO)</td>
                    <td className="px-4 py-3 border-b text-black">24 hours</td>
                    <td className="px-4 py-3 border-b text-black">&lt; 4 hours</td>
                    <td className="px-4 py-3 border-b text-green-600 font-semibold">• PASS</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 border-b text-black">Recovery Point (RPO)</td>
                    <td className="px-4 py-3 border-b text-black">24 hours</td>
                    <td className="px-4 py-3 border-b text-black">&lt; 24 hours</td>
                    <td className="px-4 py-3 border-b text-green-600 font-semibold">• PASS</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 border-b text-black">Data Integrity</td>
                    <td className="px-4 py-3 border-b text-black">100%</td>
                    <td className="px-4 py-3 border-b text-black">100%</td>
                    <td className="px-4 py-3 border-b text-green-600 font-semibold">• PASS</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 border-b text-black">Application Function</td>
                    <td className="px-4 py-3 border-b text-black">Operational</td>
                    <td className="px-4 py-3 border-b text-black">Operational</td>
                    <td className="px-4 py-3 border-b text-green-600 font-semibold">• PASS</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <h2 className="text-2xl font-bold text-black mt-8 mb-4">Conclusions</h2>
            <p className="text-black mb-4">
              The disaster recovery drill was completed successfully. All recovery objectives 
              were met within target thresholds. The platform can be restored from backup 
              within the documented RTO/RPO targets.
            </p>

            <div className="bg-brand-blue-50 border border-brand-blue-200 rounded-lg p-6 mb-8">
              <h3 className="font-bold text-brand-blue-900 mb-2">Next Scheduled Test</h3>
              <p className="text-brand-blue-800 m-0">
                Disaster recovery drills are conducted periodically to ensure continued 
                recoverability. The next scheduled test will be documented here upon completion.
              </p>
            </div>

            <h2 className="text-2xl font-bold text-black mt-8 mb-4">Related Documentation</h2>
            <ul className="list-disc pl-6 mb-6 text-black space-y-2">
              <li><Link href="/policies/disaster-recovery" className="text-brand-blue-600 hover:underline">Disaster Recovery Plan</Link></li>
              <li><Link href="/policies/sla" className="text-brand-blue-600 hover:underline">Service Level Agreement</Link></li>
              <li><Link href="/policies/incident-response" className="text-brand-blue-600 hover:underline">Incident Response Policy</Link></li>
            </ul>
          </div>

          {/* Footer */}
          <div className="mt-8 pt-8 border-t border-gray-200">
            <p className="text-sm text-gray-600">
              <strong>Report ID:</strong> DR-2026-001<br />
              <strong>Prepared by:</strong> Platform Operations<br />
              <strong>Classification:</strong> Internal / Partner Shareable
            </p>
          </div>
        </article>
      </div>
    </div>
  );
}
