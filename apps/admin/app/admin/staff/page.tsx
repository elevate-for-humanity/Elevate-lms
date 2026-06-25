import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import { requireRole } from '@/lib/auth/require-role';
import { requireAdminClient } from '@/lib/supabase/admin';
import Link from 'next/link';
import { Users, Mail, Shield, Plus } from 'lucide-react';

export const dynamic = 'force-dynamic';
export const revalidate = 60;

export const metadata: Metadata = {
  title: 'Staff | Admin | Elevate For Humanity',
};

const STAFF_ROLES = ['admin', 'staff', 'instructor', 'org_admin'];

export default async function AdminStaffPage() {
  await requireRole(['admin']);
  const db = await requireAdminClient();
  if (!db) notFound();

  const { data: staff } = await db
    .from('profiles')
    .select('id, full_name, email, role, is_active, created_at, last_sign_in_at')
    .in('role', STAFF_ROLES)
    .order('role')
    .order('full_name');

  const rows = staff ?? [];
  const byRole: Record<string, number> = {};
  for (const s of rows) {
    byRole[s.role] = (byRole[s.role] ?? 0) + 1;
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="border-b border-slate-200 px-6 py-5">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Staff</h1>
            <p className="text-slate-500 text-sm mt-0.5">{rows.length} staff members</p>
          </div>
          <Link
            href="/admin/staff"
            className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" /> Invite Staff
          </Link>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-6">
        {/* Role breakdown */}
        <div className="flex flex-wrap gap-3">
          {Object.entries(byRole).map(([role, count]) => (
            <span
              key={role}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 text-slate-700 text-sm font-medium"
            >
              <Shield className="w-3.5 h-3.5" />
              {role} <span className="text-slate-400">({count})</span>
            </span>
          ))}
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          {rows.length === 0 ? (
            <div className="p-12 text-center text-slate-400">No staff found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-slate-500 uppercase text-xs">
                  <tr>
                    <th className="px-6 py-3 text-left">Name</th>
                    <th className="px-6 py-3 text-left">Email</th>
                    <th className="px-6 py-3 text-left">Role</th>
                    <th className="px-6 py-3 text-left">Status</th>
                    <th className="px-6 py-3 text-left">Last Sign In</th>
                    <th className="px-6 py-3 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {rows.map((s) => (
                    <tr key={s.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 font-medium text-slate-900">
                        <Link href={`/admin/staff/${s.id}`} className="hover:text-blue-600">
                          {s.full_name ?? '(no name)'}
                        </Link>
                      </td>
                      <td className="px-6 py-4 text-slate-500">
                        <a
                          href={`mailto:${s.email}`}
                          className="inline-flex items-center gap-1 hover:text-blue-600"
                        >
                          <Mail className="w-3.5 h-3.5" />
                          {s.email}
                        </a>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-700">
                          <Shield className="w-3 h-3" />
                          {s.role}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            s.is_active !== false
                              ? 'bg-green-100 text-green-700'
                              : 'bg-slate-100 text-slate-500'
                          }`}
                        >
                          {s.is_active !== false ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-400 text-xs">
                        {s.last_sign_in_at
                          ? new Date(s.last_sign_in_at).toLocaleDateString()
                          : 'Never'}
                      </td>
                      <td className="px-6 py-4">
                        <Link
                          href={`/admin/staff/${s.id}`}
                          className="text-blue-600 hover:underline text-sm"
                        >
                          Manage
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
