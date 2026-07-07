import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

export const metadata: Metadata = {
  title: 'Partners Admin Placements',
  description: 'Elevate For Humanity - Career training and workforce development',
};

import { createClient } from '@/lib/supabase/server';
import { requireAdminClient } from '@/lib/supabase/admin';
import { requireRole } from '@/lib/auth/require-role';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export default async function AdminPlacementsPage() {
  await requireRole(['admin', 'super_admin', 'staff']);
  let data: any[] = [];

  try {
    const supabase = await createClient();
    const db = await requireAdminClient();

    if (!supabase) {
      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-slate-900 mb-4">Service Unavailable</h1>
            <p className="text-slate-600">Please try again later.</p>
          </div>
        </div>
      );
    }
    const result = await db
      .from('apprentice_placements')
      .select(
        `
        *,
        shop:partner_shops(name),
        student:profiles(full_name)
      `,
      )
      .order('created_at', { ascending: false });

    data = result.data || [];
  } catch (error) {
    logger.error('Failed to fetch placements:', error);
  }

  return (
    <div className="rounded-2xl border p-5">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: 'Partners', href: '/partners' }, { label: 'Placements' }]} />
      </div>
      <div className="font-semibold">Admin: Placements</div>
      <div className="text-sm text-black mt-1">All students assigned to partner locations.</div>

      <div className="mt-4 overflow-auto">
        <table className="min-w-[900px] w-full text-sm">
          <thead>
            <tr className="text-left border-b">
              <th className="py-2">Shop</th>
              <th className="py-2">Student</th>
              <th className="py-2">Program</th>
              <th className="py-2">Status</th>
              <th className="py-2">Created</th>
            </tr>
          </thead>
          <tbody>
            {data.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-4 text-center text-slate-500">
                  No placements found
                </td>
              </tr>
            ) : (
              data.map((p: any) => (
                <tr key={p.id} className="border-b">
                  <td className="py-2">{p.shop?.name || p.shop_id}</td>
                  <td className="py-2">{p.student?.full_name || p.student_id}</td>
                  <td className="py-2">{p.program_slug}</td>
                  <td className="py-2">{p.status}</td>
                  <td className="py-2">{new Date(p.created_at).toLocaleString()}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
