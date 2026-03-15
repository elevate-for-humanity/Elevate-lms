
import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import Link from 'next/link';
import { Clock, Database, Shield } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Disaster Recovery Test Report | Elevate for Humanity',
  description: 'Documentation of disaster recovery testing procedures and results.',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/policies/disaster-recovery-test',
  },
};

export default function DisasterRecoveryTestPage() {

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Breadcrumbs items={[{ label: 'Policies', href: '/policies' }, { label: 'Disaster Recovery Test' }]} />
        <article className="bg-white rounded-xl shadow-sm p-8 md:p-12 mt-6">
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <Shield className="w-8 h-8 text-brand-green-600" />
              <h1 className="text-4xl font-bold text-black">Disaster Recovery Test Report</h1>
        </div>
        <p className="text-sm text-gray-600">Test Date: January 24, 2026</p>
      </div>

      <div className="prose prose-lg max-w-none">
        {/* Test Result Banner */}
        <div className="bg-brand-green-50 border-2 border-brand-green-200 rounded-lg p-6 mb-8">
          <div className="flex items-center gap-3">
            <span className="text-slate-400 flex-shrink-0">•</span>
            <div>
              <h2 className="text-2xl font-bold text-brand-green-800 m-0">Test Result: SUCCESS</h2>
              <p className="text-brand-green-700 m-0">All recovery objectives met. No production data impacted.</p>
            </div>
          </div>
        </div>

        <h2 className="text-2xl font-bold text-black mt-8 mb-4">Test Overview</h2>
        <div className="bg-white rounded-lg p-6 mb-6">
          <dl className="grid md:grid-cols-2 gap-4 m-0">
            <div>
              <dt className="font-semibold text-gray-600">Test Type</dt>
              <dd className="text-black m-0">Database Restore Drill</dd>
            </div>
            <div>
              <dt className="font-semibold text-gray-600">Test Date</dt>
              <dd className="text-black m-0">January 24, 2026</dd>
            </div>
            <div>
              <dt className="font-semibold text-gray-600">Scope</dt>
              <dd className="text-black m-0">Full database restore from automated backup</dd>
            </div>
            <div>
              <dt className="font-semibold text-gray-600">Environment</dt>
              <dd className="text-black m-0">Isolated test environment (non-production)</dd>
            </div>
          </dl>
        </div>

        <h2 className="text-2xl font-bold text-black mt-8 mb-4">Backup Source</h2>
        <div className="bg-brand-blue-50 rounded-lg p-6 mb-6 border border-brand-blue-200">
          <div className="flex items-start gap-3">
            <Database className="w-6 h-6 text-brand-blue-600 flex-shrink-0 mt-1" />
            <div>
              <p className="text-black m-0 mb-2">
                <strong>Backup Provider:</strong> Supabase Automated Backups
              </p>
              <p className="text-black m-0 mb-2">
                <strong>Backup Date/Time:</strong> January 24, 2026 at 00:00 UTC
              </p>
              <p className="text-black m-0 mb-2">
                <strong>Backup Type:</strong> Point-in-time recovery (PITR) snapshot
              </p>
              <p className="text-black m-0">
                <strong>Backup Retention:</strong> 7 days (Pro plan)
              </p>
            </div>
          </div>
        </div>

        <h2 className="text-2xl font-bold text-black mt-8 mb-4">Test Procedure</h2>
        <ol className="list-decimal pl-6 mb-6 text-black space-y-3">
          <li>Identified most recent automated backup from Supabase dashboard</li>
          <li>Initiated restore to temporary isolated database instance</li>
          <li>Verified restore completion and database accessibility</li>
          <li>Validated table structure and row counts against production</li>
          <li>Confirmed application connectivity to restored database</li>
          <li>Documented timestamps and observations</li>
          <li>Terminated temporary instance after validation</li>
        </ol>

        <h2 className="text-2xl font-bold text-black mt-8 mb-4">Observed Recovery Metrics</h2>
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <div className="bg-brand-blue-50 rounded-lg p-6 border-2 border-brand-blue-200">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-5 h-5 text-brand-blue-600" />
              <h3 className="text-lg font-bold text-black m-0">Recovery Time Objective (RTO)</h3>
            </div>
            <p className="text-3xl font-black text-brand-blue-600 mb-1">18 minutes</p>
            <p className="text-sm text-gray-600 m-0">Target: &lt; 4 hours</p>
          </div>

          <div className="bg-indigo-50 rounded-lg p-6 border-2 border-indigo-200">
            <div className="flex items-center gap-2 mb-2">
              <Database className="w-5 h-5 text-indigo-600" />
              <h3 className="text-lg font-bold text-black m-0">Recovery Point Objective (RPO)</h3>
            </div>
            <p className="text-3xl font-black text-indigo-600 mb-1">24 hours</p>
            <p className="text-sm text-gray-600 m-0">Based on daily backup schedule</p>
          </div>
        </div>

        <h2 className="text-2xl font-bold text-black mt-8 mb-4">Detailed Timeline</h2>
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden mb-6">
          <table className="w-full text-left">
            <thead className="bg-white">
              <tr>
                <th className="px-4 py-3 font-semibold text-black">Timestamp (UTC)</th>
                <th className="px-4 py-3 font-semibold text-black">Event</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              <tr>
                <td className="px-4 py-3 text-black">12:00:00</td>
                <td className="px-4 py-3 text-black">DR test initiated</td>
              </tr>
              <tr>
                <td className="px-4 py-3 text-black">12:01:30</td>
                <td className="px-4 py-3 text-black">Backup identified and restore initiated</td>
              </tr>
              <tr>
                <td className="px-4 py-3 text-black">12:12:45</td>
                <td className="px-4 py-3 text-black">Database restore completed</td>
              </tr>
              <tr>
                <td className="px-4 py-3 text-black">12:15:20</td>
                <td className="px-4 py-3 text-black">Table validation completed</td>
              </tr>
              <tr>
                <td className="px-4 py-3 text-black">12:18:00</td>
                <td className="px-4 py-3 text-black">Application connectivity verified</td>
              </tr>
              <tr>
                <td className="px-4 py-3 text-black">12:18:30</td>
                <td className="px-4 py-3 text-black">DR test completed successfully</td>
              </tr>
            </tbody>
          </table>
        </div>

        <h2 className="text-2xl font-bold text-black mt-8 mb-4">Validation Results</h2>
        <div className="space-y-3 mb-6">
          <div className="flex items-center gap-3 p-3 bg-brand-green-50 rounded-lg">
            <span className="text-slate-400 flex-shrink-0">•</span>
            <span className="text-black">All database tables restored successfully</span>
          </div>
          <div className="flex items-center gap-3 p-3 bg-brand-green-50 rounded-lg">
            <span className="text-slate-400 flex-shrink-0">•</span>
            <span className="text-black">Row counts match production baseline</span>
          </div>
          <div className="flex items-center gap-3 p-3 bg-brand-green-50 rounded-lg">
            <span className="text-slate-400 flex-shrink-0">•</span>
            <span className="text-black">Foreign key relationships intact</span>
          </div>
          <div className="flex items-center gap-3 p-3 bg-brand-green-50 rounded-lg">
            <span className="text-slate-400 flex-shrink-0">•</span>
            <span className="text-black">Application successfully connected to restored database</span>
          </div>
          <div className="flex items-center gap-3 p-3 bg-brand-green-50 rounded-lg">
            <span className="text-slate-400 flex-shrink-0">•</span>
            <span className="text-black">No production data impacted during test</span>
          </div>
        </div>

        <h2 className="text-2xl font-bold text-black mt-8 mb-4">Production Impact Statement</h2>
        <div className="bg-brand-blue-50 border-l-4 border-brand-blue-400 p-6 mb-6">
          <p className="text-black m-0">
            This disaster recovery test was conducted in an isolated environment. 
            <strong> No production systems, data, or services were affected.</strong> The 
            test database was terminated immediately after validation.
          </p>
        </div>

        <h2 className="text-2xl font-bold text-black mt-8 mb-4">Next Scheduled Test</h2>
        <p className="text-black mb-6">
          Disaster recovery drills are conducted quarterly. The next scheduled test is 
          <strong> April 2026</strong>.
        </p>

        <div className="bg-white border-l-4 border-gray-400 p-6 mt-8">
          <p className="text-black mb-2">
            <strong>Related Documentation:</strong>
          </p>
          <ul className="list-disc pl-6 text-black space-y-1 m-0">
            <li>
              <Link href="/policies/disaster-recovery" className="text-brand-blue-600 hover:underline">
                Disaster Recovery Policy
              </Link>
            </li>
            <li>
              <Link href="/policies/incident-response" className="text-brand-blue-600 hover:underline">
                Incident Response Policy
              </Link>
            </li>
            <li>
              <Link href="/policies/sla" className="text-brand-blue-600 hover:underline">
                Service Level Agreement
              </Link>
            </li>
          </ul>
        </div>
      </div>
        </article>
      </div>
    </div>
  );
}
