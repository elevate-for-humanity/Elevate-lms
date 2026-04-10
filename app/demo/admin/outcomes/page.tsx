import type { Metadata } from 'next';
import Image from 'next/image';
import { DemoPageShell } from '@/components/demo/DemoPageShell';
import { DEMO_PROGRAMS } from '@/lib/demo/sandbox-data';

export const metadata: Metadata = {
  title: 'Outcomes | Admin Demo | Elevate for Humanity',
  robots: { index: false, follow: false },
};

export default function DemoOutcomesPage() {

  return (
    <DemoPageShell title="Outcomes" description="Program completion rates, credential attainment, and employment outcomes." portal="admin">
      <section className="relative h-[60vh] min-h-[400px] max-h-[720px] mb-6">
        <Image src="/images/pages/demo-page-6.jpg" alt="Platform demo" fill sizes="100vw" className="object-cover" priority />
      </section>
      <div className="grid sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl border p-4 text-center">
          <div className="text-3xl font-bold text-gray-900">78%</div>
          <div className="text-xs text-gray-500 mt-1">Completion Rate</div>
        </div>
        <div className="bg-white rounded-xl border p-4 text-center">
          <div className="text-3xl font-bold text-gray-900">84%</div>
          <div className="text-xs text-gray-500 mt-1">Credential Attainment</div>
        </div>
        <div className="bg-white rounded-xl border p-4 text-center">
          <div className="text-3xl font-bold text-gray-900">71%</div>
          <div className="text-xs text-gray-500 mt-1">Employed Within 90 Days</div>
        </div>
      </div>
      <div className="bg-white rounded-xl border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-gray-500 border-b bg-gray-50">
              <th className="px-5 py-3 font-medium">Program</th>
              <th className="px-5 py-3 font-medium">Enrolled</th>
              <th className="px-5 py-3 font-medium">Completed</th>
              <th className="px-5 py-3 font-medium">Rate</th>
            </tr>
          </thead>
          <tbody>
            {DEMO_PROGRAMS.map((p: any, i: number) => {
              const enrolled = p.enrolled ?? p.students ?? 30;
              const rate = p.completionRate ?? 75;
              return (
                <tr key={i} className="border-b last:border-0 hover:bg-gray-50">
                  <td className="px-5 py-3 font-medium text-gray-900">{p.name}</td>
                  <td className="px-5 py-3 text-gray-600">{enrolled}</td>
                  <td className="px-5 py-3 text-gray-600">{Math.round(enrolled * rate / 100)}</td>
                  <td className="px-5 py-3"><span className="text-xs font-semibold text-green-700">{rate}%</span></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </DemoPageShell>
  );
}
