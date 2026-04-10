import type { Metadata } from 'next';
import Image from 'next/image';
import { Award, Download, Lock } from 'lucide-react';
import { DemoPageShell } from '@/components/demo/DemoPageShell';
import { DEMO_LEARNER_CERTS } from '@/lib/demo/sandbox-data';

export const metadata: Metadata = {
  title: 'Certificates | Learner Demo | Elevate for Humanity',
  robots: { index: false, follow: false },
};

export default function DemoCertificatesPage() {

  return (
    <DemoPageShell title="Certificates & Credentials" description="Credentials you've earned and those in progress." portal="learner">
      <section className="relative h-[60vh] min-h-[400px] max-h-[720px] mb-6">
        <Image src="/images/pages/demo-page-15.jpg" alt="Platform demo" fill sizes="100vw" className="object-cover" priority />
      </section>
      <div className="space-y-4">
        {(DEMO_LEARNER_CERTS as any[]).map((c, i) => (
          <div key={i} className={`bg-white rounded-xl border p-5 ${c.status === 'Locked' ? 'opacity-60' : ''}`}>
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                {c.status === 'Earned'      && <Award className="w-6 h-6 text-amber-500 mt-0.5" />}
                {c.status === 'In Progress' && <Award className="w-6 h-6 text-blue-400 mt-0.5" />}
                {c.status === 'Locked'      && <Lock className="w-6 h-6 text-gray-400 mt-0.5" />}
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
                  c.status === 'Earned'      ? 'bg-green-100 text-green-800' :
                  c.status === 'In Progress' ? 'bg-blue-100 text-blue-800' :
                                               'bg-gray-100 text-gray-500'
                }`}>{c.status}</span>
                {c.status === 'Earned' && (
                  <button className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-50" aria-label="Download"><Download className="w-4 h-4" /></button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </DemoPageShell>
  );
}
