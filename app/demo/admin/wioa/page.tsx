import type { Metadata } from 'next';
import Image from 'next/image';
import { Clock, AlertTriangle } from 'lucide-react';
import { DemoPageShell } from '@/components/demo/DemoPageShell';

export const metadata: Metadata = {
  title: 'WIOA | Admin Demo | Elevate for Humanity',
  robots: { index: false, follow: false },
};

const DEMO_PARTICIPANTS = [
  { name: 'Marcus Johnson', title: 'Title I Adult', barriers: ['Low Income', 'Basic Skills Deficient'], ita: '$4,800', status: 'Active' },
  { name: 'Destiny Williams', title: 'Title I Dislocated', barriers: ['Displaced Homemaker'], ita: '$6,200', status: 'Active' },
  { name: 'Jamal Carter', title: 'Title I Adult', barriers: ['Ex-Offender', 'Low Income'], ita: '$4,800', status: 'Active' },
  { name: 'Aaliyah Brooks', title: 'Title I Youth', barriers: ['In Foster Care'], ita: '$3,500', status: 'Pending Docs' },
  { name: 'Devon Harris', title: 'Title I Adult', barriers: ['Homeless'], ita: '$4,800', status: 'Active' },
  { name: 'Tanya Simmons', title: 'Title I Dislocated', barriers: ['Plant Closure'], ita: '$6,200', status: 'Active' },
  { name: 'Robert King', title: 'Title I Adult', barriers: [], ita: '$4,800', status: 'Ineligible' },
];

export default function DemoWioaPage() {

  return (
    <DemoPageShell title="WIOA" description="WIOA eligibility, Individual Training Accounts, and participant tracking." portal="admin">
      <section className="relative h-[60vh] min-h-[400px] max-h-[720px] mb-6">
        <Image src="/images/pages/demo-page-10.jpg" alt="Platform demo" fill sizes="100vw" className="object-cover" priority />
      </section>
      <div className="grid sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl border p-4">
          <div className="text-2xl font-bold text-gray-900">182</div>
          <div className="text-xs text-gray-500">WIOA Participants</div>
        </div>
        <div className="bg-white rounded-xl border p-4">
          <div className="text-2xl font-bold text-gray-900">$847K</div>
          <div className="text-xs text-gray-500">ITA Funds Obligated</div>
        </div>
        <div className="bg-white rounded-xl border p-4">
          <div className="text-2xl font-bold text-gray-900">94%</div>
          <div className="text-xs text-gray-500">Eligibility Verified</div>
        </div>
      </div>
      <div className="bg-white rounded-xl border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-gray-500 border-b bg-gray-50">
              <th className="px-5 py-3 font-medium">Participant</th>
              <th className="px-5 py-3 font-medium">Title</th>
              <th className="px-5 py-3 font-medium">Barriers</th>
              <th className="px-5 py-3 font-medium">ITA</th>
              <th className="px-5 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {DEMO_PARTICIPANTS.map((p, i) => (
              <tr key={i} className="border-b last:border-0 hover:bg-gray-50">
                <td className="px-5 py-3 font-medium text-gray-900">{p.name}</td>
                <td className="px-5 py-3 text-gray-600 text-xs">{p.title}</td>
                <td className="px-5 py-3">
                  <div className="flex flex-wrap gap-1">
                    {p.barriers.map((b) => (
                      <span key={b} className="px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded text-[10px]">{b}</span>
                    ))}
                    {p.barriers.length === 0 && <span className="text-xs text-gray-400">—</span>}
                  </div>
                </td>
                <td className="px-5 py-3 text-gray-600">{p.ita}</td>
                <td className="px-5 py-3">
                  <span className="flex items-center gap-1.5 text-xs">
                    {p.status === 'Active'       && <span className="w-2 h-2 rounded-full bg-green-500 inline-block" />}
                    {p.status === 'Pending Docs' && <Clock className="w-3.5 h-3.5 text-amber-500" />}
                    {p.status === 'Ineligible'   && <AlertTriangle className="w-3.5 h-3.5 text-red-500" />}
                    {p.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </DemoPageShell>
  );
}
