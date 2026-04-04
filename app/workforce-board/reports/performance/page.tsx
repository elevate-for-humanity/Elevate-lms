import Image from 'next/image';
import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import PerformanceChart from './PerformanceChart';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  alternates: { canonical: 'https://www.elevateforhumanity.org/workforce-board/reports/performance' },
  title: 'Performance Report | Elevate For Humanity',
  description: 'View program performance metrics and outcomes.',
};

export default async function PerformanceReportPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  return (
    <div className="min-h-screen bg-white">

      {/* Hero Image */}
      <section className="relative h-[160px] sm:h-[220px] md:h-[280px]">
        <Image src="/images/pages/workforce-board-page-5.jpg" alt="Workforce board" fill sizes="100vw" className="object-cover" priority />
      </section>

      
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <nav className="text-sm mb-4"><ol className="flex items-center space-x-2 text-black"><li><Link href="/workforce-board" className="hover:text-primary">Workforce Board</Link></li><li>/</li><li><Link href="/workforce-board/reports" className="hover:text-primary">Reports</Link></li><li>/</li><li className="text-gray-900 font-medium">Performance</li></ol></nav>
          <div className="flex justify-between items-center">
            <div><h1 className="text-3xl font-bold text-gray-900">Performance Report</h1><p className="text-black mt-2">Program performance metrics</p></div>
            <button className="bg-brand-blue-600 text-white px-4 py-2 rounded-lg hover:bg-brand-blue-700">Export PDF</button>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm border p-6"><h3 className="text-sm font-medium text-black">Employment Rate</h3><p className="text-3xl font-bold text-brand-green-600 mt-2">78%</p><p className="text-sm text-black">Target: 75%</p></div>
          <div className="bg-white rounded-lg shadow-sm border p-6"><h3 className="text-sm font-medium text-black">Credential Rate</h3><p className="text-3xl font-bold text-brand-blue-600 mt-2">85%</p><p className="text-sm text-black">Target: 80%</p></div>
          <div className="bg-white rounded-lg shadow-sm border p-6"><h3 className="text-sm font-medium text-black">Median Earnings</h3><p className="text-3xl font-bold text-brand-blue-600 mt-2">$32K</p><p className="text-sm text-black">Target: $30K</p></div>
          <div className="bg-white rounded-lg shadow-sm border p-6"><h3 className="text-sm font-medium text-black">Measurable Skill Gains</h3><p className="text-3xl font-bold text-brand-orange-600 mt-2">72%</p><p className="text-sm text-black">Target: 70%</p></div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border p-6"><h2 className="text-lg font-semibold mb-4">Performance Trends</h2><PerformanceChart /></div>
      </div>
    </div>
  );
}
