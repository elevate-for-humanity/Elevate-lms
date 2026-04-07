import { Metadata } from 'next';
import { requireRole } from '@/lib/auth/require-role';
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  alternates: { canonical: 'https://www.elevateforhumanity.org/admin/hr/time' },
  title: 'Time Tracking | Elevate For Humanity',
  description: 'Track employee hours and attendance.',
};

export default async function TimePage() {
  await requireRole(['admin', 'super_admin']);
  const supabase = await createClient();

  return (
    <div className="min-h-screen bg-white">

      {/* Hero Image */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <nav className="text-sm mb-4"><ol className="flex items-center space-x-2 text-gray-500"><li><Link href="/admin" className="hover:text-primary">Admin</Link></li><li>/</li><li><Link href="/admin/hr" className="hover:text-primary">HR</Link></li><li>/</li><li className="text-gray-900 font-medium">Time</li></ol></nav>
          <h1 className="text-3xl font-bold text-gray-900">Time Tracking</h1>
          <p className="text-gray-600 mt-2">Monitor employee hours and attendance</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm border p-6"><h3 className="text-sm font-medium text-gray-500">Hours This Week</h3><p className="text-3xl font-bold text-brand-blue-600 mt-2">156h</p></div>
          <div className="bg-white rounded-lg shadow-sm border p-6"><h3 className="text-sm font-medium text-gray-500">Clocked In</h3><p className="text-3xl font-bold text-brand-green-600 mt-2">18</p></div>
          <div className="bg-white rounded-lg shadow-sm border p-6"><h3 className="text-sm font-medium text-gray-500">Overtime</h3><p className="text-3xl font-bold text-brand-orange-600 mt-2">12h</p></div>
          <div className="bg-white rounded-lg shadow-sm border p-6"><h3 className="text-sm font-medium text-gray-500">Absent Today</h3><p className="text-3xl font-bold text-brand-red-600 mt-2">2</p></div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border p-6"><h2 className="text-lg font-semibold mb-4">Time Entries</h2><p className="text-gray-500 text-center py-4">Time tracking data will appear here</p></div>
      </div>
    </div>
  );
}
