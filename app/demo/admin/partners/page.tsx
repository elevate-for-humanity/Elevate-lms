import type { Metadata } from 'next';
import Image from 'next/image';
import { DemoPageShell } from '@/components/demo/DemoPageShell';

export const metadata: Metadata = {
  title: 'Partners | Admin Demo | Elevate for Humanity',
  robots: { index: false, follow: false },
};

const DEMO_PARTNERS = [
  { name: 'Downtown Barber Shop', type: 'Employer', students: 4, status: 'Active', since: 'Jan 2026' },
  { name: 'Center of Destiny', type: 'Community Partner', students: 6, status: 'Active', since: 'Mar 2025' },
  { name: 'Indiana Workforce Development', type: 'Workforce Board', students: 12, status: 'Active', since: 'Sep 2024' },
  { name: 'Ivy Tech Community College', type: 'Training Provider', students: 8, status: 'Active', since: 'Jan 2025' },
  { name: 'Mesmerized by Beauty', type: 'Employer', students: 2, status: 'Pending MOU', since: 'Apr 2026' },
  { name: 'Indianapolis Urban League', type: 'Community Partner', students: 5, status: 'Active', since: 'Jun 2025' },
];

export default function DemoPartnersPage() {

  return (
    <DemoPageShell title="Partners" description="Employer partners, workforce boards, and training providers in your network." portal="admin">
      <section className="relative h-[60vh] min-h-[400px] max-h-[720px] mb-6">
        <Image src="/images/pages/demo-page-8.jpg" alt="Platform demo" fill sizes="100vw" className="object-cover" priority />
      </section>
      <div className="bg-white rounded-xl border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-gray-500 border-b bg-gray-50">
              <th className="px-5 py-3 font-medium">Organization</th>
              <th className="px-5 py-3 font-medium">Type</th>
              <th className="px-5 py-3 font-medium">Students</th>
              <th className="px-5 py-3 font-medium">Status</th>
              <th className="px-5 py-3 font-medium">Since</th>
            </tr>
          </thead>
          <tbody>
            {DEMO_PARTNERS.map((p, i) => (
              <tr key={i} className="border-b last:border-0 hover:bg-gray-50">
                <td className="px-5 py-3 font-medium text-gray-900">{p.name}</td>
                <td className="px-5 py-3 text-gray-600">{p.type}</td>
                <td className="px-5 py-3 text-gray-600">{p.students}</td>
                <td className="px-5 py-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                    p.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'
                  }`}>{p.status}</span>
                </td>
                <td className="px-5 py-3 text-xs text-gray-500">{p.since}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </DemoPageShell>
  );
}
