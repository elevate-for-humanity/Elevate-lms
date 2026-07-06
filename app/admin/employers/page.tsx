import { Metadata } from 'next';
import { requireRole } from '@/lib/auth/require-role';
import { requireAdminClient } from '@/lib/supabase/admin';
import Link from 'next/link';
import { Building2, ChevronRight, ArrowRight, Plus, MapPin, Phone, Mail } from 'lucide-react';

export const dynamic = 'force-dynamic';
export const revalidate = 60;
export const metadata: Metadata = {
  title: 'Employers | Admin',
};

export default async function AdminEmployersPage() {
  await requireRole(['admin', 'super_admin', 'staff']);
  const db = await requireAdminClient();

  const [employersRes] = await Promise.all([
    db
      .from('employers')
      .select('id, name, industry, city, state, phone, email, status, created_at', {
        count: 'exact',
      })
      .order('created_at', { ascending: false })
      .limit(100),
  ]);

  const employers = employersRes.data ?? [];
  const totalCount = employersRes.count ?? 0;

  return (
    <div className="min-h-screen bg-white">
      <div className="bg-white border-b border-slate-200 px-6 py-5">
        <nav className="flex items-center gap-1.5 text-xs text-slate-500 mb-3">
          <Link href="/admin/dashboard" className="hover:text-slate-700">
            Admin
          </Link>
          <ChevronRight className="w-3 h-3" />
          <span className="text-slate-900 font-medium">Employers</span>
        </nav>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Employers</h1>
            <p className="text-sm text-slate-500 mt-1">
              {totalCount} employer{totalCount !== 1 ? 's' : ''} on record
            </p>
          </div>
          <Link
            href="/admin/employers/new"
            className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors"
          >
            <Plus className="w-4 h-4" /> Add Employer
          </Link>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {employers.length === 0 ? (
          <div className="py-24 text-center">
            <Building2 className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-sm font-semibold text-slate-600">No employers yet</p>
            <p className="text-xs text-slate-400 mt-1">
              Add employer partners to track apprenticeships and job placements
            </p>
            <Link
              href="/admin/employers/new"
              className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-brand-blue-600 hover:underline"
            >
              Add first employer <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {employers.map((e: any) => (
              <Link
                key={e.id}
                href={`/admin/employers/${e.id}`}
                className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 hover:border-brand-blue-300 hover:shadow-md transition-all group"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center flex-shrink-0">
                    <Building2 className="w-5 h-5 text-slate-500" />
                  </div>
                  {e.status && (
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${e.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}
                    >
                      {e.status}
                    </span>
                  )}
                </div>
                <h3 className="font-semibold text-slate-900 group-hover:text-brand-blue-700 transition-colors">
                  {e.name ?? '—'}
                </h3>
                {e.industry && <p className="text-xs text-slate-400 mt-0.5">{e.industry}</p>}
                <div className="mt-3 space-y-1">
                  {(e.city || e.state) && (
                    <p className="flex items-center gap-1.5 text-xs text-slate-500">
                      <MapPin className="w-3 h-3 flex-shrink-0" />
                      {[e.city, e.state].filter(Boolean).join(', ')}
                    </p>
                  )}
                  {e.phone && (
                    <p className="flex items-center gap-1.5 text-xs text-slate-500">
                      <Phone className="w-3 h-3 flex-shrink-0" />
                      {e.phone}
                    </p>
                  )}
                  {e.email && (
                    <p className="flex items-center gap-1.5 text-xs text-slate-500">
                      <Mail className="w-3 h-3 flex-shrink-0" />
                      {e.email}
                    </p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
