import { Metadata } from 'next';
import Link from 'next/link';
import { Server, Clock, RefreshCw, Shield, CheckCircle, AlertCircle } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Availability & Uptime | Elevate Security',
  description: 'Service availability, uptime commitments, and disaster recovery information for the Elevate Workforce Platform.',
  keywords: ['availability', 'uptime', 'SLA', 'disaster recovery', 'backup'],
};

const slaCommitments = [
  {
    plan: 'Single User',
    uptime: '99.5%',
    support: 'Email',
    responseTime: '48 hours',
    status: 'beta',
  },
  {
    plan: 'Small Business',
    uptime: '99.9%',
    support: 'Email + Chat',
    responseTime: '24 hours',
    status: 'stable',
  },
  {
    plan: 'Enterprise',
    uptime: '99.99%',
    support: 'Phone + Email + Chat',
    responseTime: '4 hours',
    status: 'stable',
  },
];

const maintenanceTypes = [
  {
    type: 'Planned Maintenance',
    notice: '7 days minimum',
    impact: 'May cause brief interruptions',
    color: 'bg-blue-100 text-blue-800',
    schedule: 'Typically during off-peak hours (2-6 AM EST)',
  },
  {
    type: 'Emergency Maintenance',
    notice: 'As soon as practical',
    impact: 'Service may be unavailable',
    color: 'bg-orange-100 text-orange-800',
    schedule: 'Only when critical security patches required',
  },
];

const disasterRecovery = [
  {
    metric: 'Recovery Time Objective (RTO)',
    value: '4 hours',
    description: 'Maximum acceptable downtime after a disaster',
  },
  {
    metric: 'Recovery Point Objective (RPO)',
    value: '1 hour',
    description: 'Maximum acceptable data loss (1 hour of data)',
  },
  {
    metric: 'Backup Frequency',
    value: 'Daily + Continuous',
    description: 'Daily full backups with continuous incremental',
  },
  {
    metric: 'Backup Retention',
    value: '30 days minimum',
    description: 'Point-in-time recovery available',
  },
];

export default function AvailabilityPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <section className="bg-slate-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center gap-2 text-sm text-slate-400 mb-4">
            <Link href="/security" className="hover:text-white">Security</Link>
            <span>/</span>
            <span className="text-white">Availability</span>
          </div>
          <div className="flex items-start gap-6">
            <div className="w-16 h-16 bg-green-600/20 rounded-2xl flex items-center justify-center flex-shrink-0">
              <Server className="w-8 h-8 text-green-400" />
            </div>
            <div>
              <h1 className="text-4xl font-bold mb-4">Service Availability</h1>
              <p className="text-xl text-slate-300 max-w-2xl">
                Uptime commitments, maintenance windows, and disaster recovery procedures.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* SLA Commitments */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-slate-900 mb-6">SLA Commitments by Plan</h2>
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <table className="w-full">
              <thead className="bg-slate-50">
                <tr>
                  <th className="text-left py-4 px-6 font-bold text-slate-900">Plan</th>
                  <th className="text-center py-4 px-6 font-bold text-slate-900">Uptime Target</th>
                  <th className="text-left py-4 px-6 font-bold text-slate-900">Support</th>
                  <th className="text-left py-4 px-6 font-bold text-slate-900">Response Time</th>
                  <th className="text-left py-4 px-6 font-bold text-slate-900">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {slaCommitments.map((sla) => (
                  <tr key={sla.plan} className="hover:bg-slate-50">
                    <td className="py-4 px-6 font-medium text-slate-900">{sla.plan}</td>
                    <td className="py-4 px-6 text-center">
                      <span className={`text-2xl font-bold ${sla.uptime === '99.99%' ? 'text-green-600' : 'text-slate-900'}`}>
                        {sla.uptime}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-slate-600 text-sm">{sla.support}</td>
                    <td className="py-4 px-6 text-slate-600 text-sm">{sla.responseTime}</td>
                    <td className="py-4 px-6">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${
                        sla.status === 'stable' 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-yellow-100 text-yellow-700'
                      }`}>
                        {sla.status === 'stable' ? (
                          <CheckCircle className="w-3 h-3" />
                        ) : (
                          <AlertCircle className="w-3 h-3" />
                        )}
                        {sla.status === 'stable' ? 'Production' : 'Beta'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Current Status */}
      <section className="py-8 bg-green-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              <span className="font-bold text-green-800">All Systems Operational</span>
            </div>
            <span className="text-slate-400">|</span>
            <span className="text-slate-600">Last updated: Real-time</span>
          </div>
        </div>
      </section>

      {/* Maintenance Windows */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-slate-900 mb-6">Maintenance Windows</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {maintenanceTypes.map((maintenance) => (
              <div key={maintenance.type} className="bg-white rounded-xl border border-slate-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-slate-900">{maintenance.type}</h3>
                  <span className={`px-3 py-1 rounded-full text-sm font-semibold ${maintenance.color}`}>
                    {maintenance.notice} notice
                  </span>
                </div>
                <p className="text-slate-600 mb-2">
                  <strong>Impact:</strong> {maintenance.impact}
                </p>
                <p className="text-slate-600">
                  <strong>Schedule:</strong> {maintenance.schedule}
                </p>
              </div>
            ))}
          </div>
          <div className="mt-6 bg-blue-50 rounded-xl p-4 border border-blue-200">
            <p className="text-blue-800 text-sm">
              <strong>Note:</strong> Scheduled maintenance is communicated via email and the status page at least 7 days in advance. 
              Emergency maintenance is communicated as soon as possible.
            </p>
          </div>
        </div>
      </section>

      {/* Disaster Recovery */}
      <section className="py-16 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-slate-900 mb-6">Disaster Recovery</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {disasterRecovery.map((item) => (
              <div key={item.metric} className="bg-white rounded-xl border border-slate-200 p-6 text-center">
                <div className="text-3xl font-black text-slate-900 mb-2">{item.value}</div>
                <div className="text-sm font-semibold text-slate-900 mb-1">{item.metric}</div>
                <div className="text-xs text-slate-500">{item.description}</div>
              </div>
            ))}
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Shield className="w-5 h-5 text-slate-600" />
              Recovery Procedures
            </h3>
            <ul className="space-y-3 text-slate-600">
              <li className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                Automated failover to secondary data center
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                Regular disaster recovery testing (quarterly)
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                Cross-region data replication
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                Documented runbooks for common failure scenarios
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                24/7 on-call engineering rotation
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* Backup Details */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-slate-900 mb-6">Backup & Data Protection</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <div className="flex items-center gap-3 mb-4">
                <RefreshCw className="w-6 h-6 text-brand-blue-600" />
                <h3 className="font-bold text-slate-900">Backup Frequency</h3>
              </div>
              <ul className="space-y-2 text-slate-600 text-sm">
                <li>• Continuous incremental backup</li>
                <li>• Daily full backup at midnight EST</li>
                <li>• 30-day retention</li>
                <li>• Point-in-time recovery available</li>
              </ul>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <div className="flex items-center gap-3 mb-4">
                <Server className="w-6 h-6 text-brand-blue-600" />
                <h3 className="font-bold text-slate-900">Redundancy</h3>
              </div>
              <ul className="space-y-2 text-slate-600 text-sm">
                <li>• Multi-region replication</li>
                <li>• Geographic separation</li>
                <li>• Off-site backup storage</li>
                <li>• Encrypted backups at rest</li>
              </ul>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <div className="flex items-center gap-3 mb-4">
                <Clock className="w-6 h-6 text-brand-blue-600" />
                <h3 className="font-bold text-slate-900">Restore Testing</h3>
              </div>
              <ul className="space-y-2 text-slate-600 text-sm">
                <li>• Monthly restore tests</li>
                <li>• Quarterly full DR test</li>
                <li>• Annual tabletop exercises</li>
                <li>• Documented test results</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Status Page */}
      <section className="py-12 bg-slate-900 text-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <Server className="w-12 h-12 mx-auto mb-4 text-green-400" />
          <h2 className="text-2xl font-bold mb-4">Real-Time Status</h2>
          <p className="text-slate-300 mb-6">
            View our real-time service status and incident history.
          </p>
          <Link href="/status" className="inline-flex bg-white text-slate-900 font-bold py-3 px-6 rounded-lg hover:bg-slate-100">
            View Status Page
          </Link>
        </div>
      </section>
    </div>
  );
}
