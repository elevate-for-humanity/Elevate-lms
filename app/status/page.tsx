import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import Link from 'next/link';
import { Activity, Clock, AlertTriangle } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Platform Status | Elevate for Humanity',
  description: 'Current operational status of Elevate for Humanity platform services.',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/status',
  },
};

const services = [
  { name: 'Core Application', status: 'operational' },
  { name: 'Authentication & Access', status: 'operational' },
  { name: 'Partner Dashboards', status: 'operational' },
  { name: 'Student Portal', status: 'operational' },
  { name: 'File Storage & Documents', status: 'operational' },
  { name: 'Payments & Billing', status: 'operational' },
  { name: 'API Services', status: 'operational' },
];

function StatusIcon({ status }: { status: string }) {
  if (status === 'operational') {
    return <span className="text-slate-400 flex-shrink-0">•</span>;
  }
  if (status === 'degraded') {
    return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
  }
  return <AlertTriangle className="w-5 h-5 text-red-500" />;
}

function StatusBadge({ status }: { status: string }) {
  if (status === 'operational') {
    return (
      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
        Operational
      </span>
    );
  }
  if (status === 'degraded') {
    return (
      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
        Degraded
      </span>
    );
  }
  return (
    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
      Outage
    </span>
  );
}

export default function StatusPage() {
  const allOperational = services.every(s => s.status === 'operational');
  const lastUpdated = new Date().toLocaleString('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  return (
    <div className="min-h-screen bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: "Status" }]} />
      </div>
{/* Header */}
      <div className={`${allOperational ? 'bg-green-600' : 'bg-yellow-600'} text-white py-12`}>
        <div className="max-w-4xl mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            {allOperational ? (
              <span className="text-slate-400 flex-shrink-0">•</span>
            ) : (
              <AlertTriangle className="w-10 h-10" />
            )}
          </div>
          <h1 className="text-3xl font-bold mb-2">
            {allOperational ? 'All Systems Operational' : 'Some Systems Experiencing Issues'}
          </h1>
          <p className="text-green-100">
            Last updated: {lastUpdated}
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Current Status */}
        <section className="bg-white rounded-xl shadow-sm p-6 mb-8">
          <h2 className="text-xl font-bold text-black mb-6 flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Current Status
          </h2>
          <div className="space-y-4">
            {services.map((service) => (
              <div
                key={service.name}
                className="flex items-center justify-between py-3 border-b last:border-0"
              >
                <div className="flex items-center gap-3">
                  <StatusIcon status={service.status} />
                  <span className="font-medium text-gray-900">{service.name}</span>
                </div>
                <StatusBadge status={service.status} />
              </div>
            ))}
          </div>
        </section>

        {/* Monitoring Notice */}
        <section className="bg-brand-blue-50 border border-brand-blue-200 rounded-xl p-6 mb-8">
          <div className="flex items-start gap-4">
            <Activity className="w-6 h-6 text-brand-blue-600 flex-shrink-0 mt-1" />
            <div>
              <h3 className="font-bold text-brand-blue-900 mb-2">Active Monitoring</h3>
              <p className="text-brand-blue-800">
                Our systems are continuously monitored for performance and availability. 
                Automated alerts notify our team immediately when issues are detected.
              </p>
            </div>
          </div>
        </section>

        {/* Incident History */}
        <section className="bg-white rounded-xl shadow-sm p-6 mb-8">
          <h2 className="text-xl font-bold text-black mb-6 flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Incident History
          </h2>
          <div className="text-center py-8 text-gray-500">
            <p>No incidents reported in the last 90 days.</p>
          </div>
        </section>

        {/* Links */}
        <section className="text-center">
          <p className="text-gray-600 mb-4">
            For support inquiries, please visit our{' '}
            <Link href="/contact" className="text-brand-blue-600 hover:underline">contact page</Link>.
          </p>
          <p className="text-sm text-gray-500">
            View our{' '}
            <Link href="/policies/sla" className="text-brand-blue-600 hover:underline">Service Level Agreement</Link>
            {' '}and{' '}
            <Link href="/policies/incident-response" className="text-brand-blue-600 hover:underline">Incident Response Policy</Link>.
          </p>
        </section>
      </div>
    </div>
  );
}
