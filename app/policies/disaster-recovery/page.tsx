import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import Link from 'next/link';
import { Shield, Database, Clock } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Disaster Recovery Policy | Elevate for Humanity',
  description: 'Disaster recovery procedures and business continuity practices for the Elevate platform.',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/policies/disaster-recovery',
  },
};

export default function DisasterRecoveryPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Breadcrumbs items={[{ label: 'Policies', href: '/policies' }, { label: 'Disaster Recovery' }]} />
        <article className="bg-white rounded-xl shadow-sm p-8 md:p-12 mt-6">
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <Shield className="w-8 h-8 text-orange-600" />
              <h1 className="text-4xl font-bold text-black">Disaster Recovery Policy</h1>
        </div>
        <p className="text-sm text-gray-600">Last Updated: January 24, 2026</p>
      </div>

      <div className="prose prose-lg max-w-none">
        <h2 className="text-2xl font-bold text-black mt-8 mb-4">Purpose</h2>
        <p className="text-black mb-6">
          This policy describes the disaster recovery procedures and business continuity 
          practices for the Elevate for Humanity platform. It outlines how we protect data, 
          maintain service availability, and recover from potential disruptions.
        </p>

        <h2 className="text-2xl font-bold text-black mt-8 mb-4">Scope</h2>
        <p className="text-black mb-6">
          This policy applies to all platform infrastructure, databases, application services, 
          and associated data managed by Elevate for Humanity.
        </p>

        <h2 className="text-2xl font-bold text-black mt-8 mb-4">Recovery Objectives</h2>
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <div className="bg-brand-blue-50 rounded-lg p-6 border-2 border-brand-blue-200">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-5 h-5 text-brand-blue-600" />
              <h3 className="text-lg font-bold text-black m-0">Recovery Time Objective (RTO)</h3>
            </div>
            <p className="text-3xl font-black text-brand-blue-600 mb-1">&lt; 4 hours</p>
            <p className="text-sm text-gray-600 m-0">Maximum acceptable downtime</p>
          </div>

          <div className="bg-brand-blue-50 rounded-lg p-6 border-2 border-brand-blue-200">
            <div className="flex items-center gap-2 mb-2">
              <Database className="w-5 h-5 text-brand-blue-600" />
              <h3 className="text-lg font-bold text-black m-0">Recovery Point Objective (RPO)</h3>
            </div>
            <p className="text-3xl font-black text-brand-blue-600 mb-1">24 hours</p>
            <p className="text-sm text-gray-600 m-0">Maximum acceptable data loss</p>
          </div>
        </div>

        <h2 className="text-2xl font-bold text-black mt-8 mb-4">Backup Strategy</h2>
        
        <h3 className="text-xl font-bold text-black mt-6 mb-3">Database Backups</h3>
        <div className="bg-gray-50 rounded-lg p-6 mb-6">
          <ul className="space-y-3 text-black m-0 list-none p-0">
            <li className="flex items-start gap-3">
              <span className="text-slate-400 flex-shrink-0">•</span>
              <span><strong>Automated daily backups</strong> via Supabase infrastructure</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-slate-400 flex-shrink-0">•</span>
              <span><strong>Point-in-time recovery (PITR)</strong> capability</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-slate-400 flex-shrink-0">•</span>
              <span><strong>7-day retention</strong> for backup snapshots</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-slate-400 flex-shrink-0">•</span>
              <span><strong>Encrypted at rest</strong> using AES-256</span>
            </li>
          </ul>
        </div>

        <h3 className="text-xl font-bold text-black mt-6 mb-3">Application Code</h3>
        <div className="bg-gray-50 rounded-lg p-6 mb-6">
          <ul className="space-y-3 text-black m-0 list-none p-0">
            <li className="flex items-start gap-3">
              <span className="text-slate-400 flex-shrink-0">•</span>
              <span><strong>Version controlled</strong> in GitHub with full history</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-slate-400 flex-shrink-0">•</span>
              <span><strong>Immutable deployments</strong> via Netlify</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-slate-400 flex-shrink-0">•</span>
              <span><strong>Instant rollback</strong> to previous deployments</span>
            </li>
          </ul>
        </div>

        <h3 className="text-xl font-bold text-black mt-6 mb-3">File Storage</h3>
        <div className="bg-gray-50 rounded-lg p-6 mb-6">
          <ul className="space-y-3 text-black m-0 list-none p-0">
            <li className="flex items-start gap-3">
              <span className="text-slate-400 flex-shrink-0">•</span>
              <span><strong>Redundant storage</strong> via Supabase Storage (S3-compatible)</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-slate-400 flex-shrink-0">•</span>
              <span><strong>Multi-region replication</strong> for uploaded files</span>
            </li>
          </ul>
        </div>

        <h2 className="text-2xl font-bold text-black mt-8 mb-4">Disaster Scenarios</h2>
        
        <div className="space-y-4 mb-6">
          <div className="bg-white rounded-lg p-6 border border-gray-200">
            <h3 className="text-lg font-bold text-black mb-2">Database Failure</h3>
            <p className="text-black mb-2"><strong>Response:</strong> Restore from most recent backup to new database instance</p>
            <p className="text-black m-0"><strong>Expected Recovery:</strong> 15-30 minutes</p>
          </div>

          <div className="bg-white rounded-lg p-6 border border-gray-200">
            <h3 className="text-lg font-bold text-black mb-2">Application Deployment Failure</h3>
            <p className="text-black mb-2"><strong>Response:</strong> Instant rollback to previous stable deployment</p>
            <p className="text-black m-0"><strong>Expected Recovery:</strong> &lt; 5 minutes</p>
          </div>

          <div className="bg-white rounded-lg p-6 border border-gray-200">
            <h3 className="text-lg font-bold text-black mb-2">Infrastructure Provider Outage</h3>
            <p className="text-black mb-2"><strong>Response:</strong> Monitor provider status, communicate with users, restore when available</p>
            <p className="text-black m-0"><strong>Expected Recovery:</strong> Dependent on provider</p>
          </div>

          <div className="bg-white rounded-lg p-6 border border-gray-200">
            <h3 className="text-lg font-bold text-black mb-2">Data Corruption</h3>
            <p className="text-black mb-2"><strong>Response:</strong> Point-in-time recovery to state before corruption</p>
            <p className="text-black m-0"><strong>Expected Recovery:</strong> 30-60 minutes</p>
          </div>
        </div>

        <h2 className="text-2xl font-bold text-black mt-8 mb-4">Recovery Procedures</h2>
        <ol className="list-decimal pl-6 mb-6 text-black space-y-3">
          <li><strong>Detection:</strong> Automated monitoring alerts team to incident</li>
          <li><strong>Assessment:</strong> Determine scope and impact of the incident</li>
          <li><strong>Communication:</strong> Notify affected users via status page and email</li>
          <li><strong>Recovery:</strong> Execute appropriate recovery procedure</li>
          <li><strong>Validation:</strong> Verify system functionality and data integrity</li>
          <li><strong>Documentation:</strong> Record incident details and lessons learned</li>
        </ol>

        <h2 className="text-2xl font-bold text-black mt-8 mb-4">Testing</h2>
        <p className="text-black mb-4">
          Disaster recovery procedures are tested quarterly to ensure effectiveness and 
          identify areas for improvement. Tests are conducted in isolated environments 
          without impacting production systems.
        </p>

        <div className="bg-green-50 border-2 border-green-200 rounded-lg p-6 mb-6">
          <div className="flex items-center gap-3 mb-3">
            <span className="text-slate-400 flex-shrink-0">•</span>
            <h3 className="text-lg font-bold text-green-800 m-0">Latest DR Test: Passed</h3>
          </div>
          <p className="text-black mb-3">
            Our most recent disaster recovery drill was completed successfully on January 24, 2026.
          </p>
          <Link 
            href="/policies/disaster-recovery-test" 
            className="inline-flex items-center gap-2 text-green-700 font-semibold hover:underline"
          >
            View Full Test Report →
          </Link>
        </div>

        <h2 className="text-2xl font-bold text-black mt-8 mb-4">Responsibilities</h2>
        <div className="bg-gray-50 rounded-lg p-6 mb-6">
          <ul className="space-y-2 text-black m-0">
            <li><strong>Platform Team:</strong> Maintain backup systems, execute recovery procedures</li>
            <li><strong>Operations:</strong> Monitor systems, coordinate incident response</li>
            <li><strong>Communications:</strong> Notify users and stakeholders during incidents</li>
          </ul>
        </div>

        <h2 className="text-2xl font-bold text-black mt-8 mb-4">Contact</h2>
        <p className="text-black mb-6">
          For questions about disaster recovery procedures or to report an incident:
        </p>
        <ul className="list-none mb-6 text-black space-y-2 p-0">
          <li><strong>Email:</strong> elevate4humanityedu@gmail.com</li>
          <li><strong>Phone:</strong> (317) 314-3757</li>
        </ul>

        <div className="bg-brand-blue-50 border-l-4 border-brand-blue-400 p-6 mt-8">
          <p className="text-black mb-2">
            <strong>Related Policies:</strong>
          </p>
          <ul className="list-disc pl-6 text-black space-y-1 m-0">
            <li>
              <Link href="/policies/disaster-recovery-test" className="text-brand-blue-600 hover:underline">
                Disaster Recovery Test Report
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
            <li>
              <Link href="/policies/data-retention" className="text-brand-blue-600 hover:underline">
                Data Retention Policy
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
