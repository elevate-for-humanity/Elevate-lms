export const dynamic = 'force-dynamic';

import Image from 'next/image';
import { DemoPageShell } from '@/components/demo/DemoPageShell';
import { Award, Download, Lock } from 'lucide-react';

// Demo page — uses static data to avoid coupling to live certificate schema.
const DEMO_CERTS = [
  { id: '1', name: 'HVAC Technician Fundamentals', issuer: 'Elevate for Humanity', status: 'Earned', earned: 'Jan 2024', credentialId: 'EFH-2024-001' },
  { id: '2', name: 'EPA Section 608 Universal', issuer: 'ESCO Institute', status: 'In Progress', earned: null, credentialId: null },
  { id: '3', name: 'OSHA 10-Hour General Industry', issuer: 'CareerSafe', status: 'Locked', earned: null, credentialId: null },
];

export default async function DemoCertificatesPage() {
  const certs = DEMO_CERTS;

  return (
    <DemoPageShell title="Certificates & Credentials" description="Credentials you've earned and those in progress." portal="learner">
      <div className="space-y-4">

      {/* Hero Image */}
      <section className="relative h-[60vh] min-h-[400px] max-h-[720px] overflow-hidden">
        <Image src="/images/pages/demo-page-15.jpg" alt="Platform demo" fill sizes="100vw" className="object-cover" priority />
      </section>
        {certs.map((c, i) => (
          <div key={i} className={`bg-white rounded-xl border p-5 ${c.status === 'Locked' ? 'opacity-60' : ''}`}>
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                {c.status === 'Earned' && <Award className="w-6 h-6 text-amber-500 mt-0.5" />}
                {c.status === 'In Progress' && <Award className="w-6 h-6 text-brand-blue-400 mt-0.5" />}
                {c.status === 'Locked' && <Lock className="w-6 h-6 text-gray-400 mt-0.5" />}
                <div>
                  <div className="font-semibold text-gray-900">{c.name}</div>
                  <div className="text-sm text-gray-500">{c.issuer}</div>
                  {c.status === 'Earned' && (
                    <div className="text-xs text-gray-400 mt-1">Earned {c.earned} · ID: {c.credentialId}</div>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                  c.status === 'Earned' ? 'bg-brand-green-100 text-brand-green-800' :
                  c.status === 'In Progress' ? 'bg-brand-blue-100 text-brand-blue-800' :
                  'bg-gray-100 text-gray-500'
                }`}>{c.status}</span>
                {c.status === 'Earned' && (
                  <button className="p-2 text-gray-400 hover:text-gray-600"><Download className="w-4 h-4" /></button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </DemoPageShell>
  );
}
