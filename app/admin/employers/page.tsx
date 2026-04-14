import { Metadata } from 'next';
import { getAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Building2, CheckCircle, Briefcase, Plus, ChevronRight, ArrowRight, MapPin, Mail } from 'lucide-react';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { robots: { index: false, follow: false }, title: 'Employers | Admin' };

const STATUS_STYLES: Record<string, string> = {
  active:   'bg-emerald-100 text-emerald-800',
  inactive: 'bg-slate-100 text-slate-600',
  pending:  'bg-amber-100 text-amber-800',
};

export default async function EmployersPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  const db = await getAdminClient();
  const { data: profile } = await db.from('profiles').select('role').eq('id', user.id).maybeSingle();
  if (!['admin', 'super_admin', 'staff'].includes(profile?.role ?? '')) redirect('/unauthorized');

  const [
    { data: employers, count: total },
    { count: active },
    { count: openJobs },
  ] = await Promise.all([
    db.from('employers')
      .select('id, name, industry, city, state, status, contact_email, created_at', { count: 'exact' })
      .order('created_at', { ascending: false })
      .limit(50),
    db.from('employers').select('*', { count: 'exact', head: true }).eq('status', 'active'),
    db.from('job_postings').select('*', { count: 'exact', head: true }).eq('status', 'open'),
  ]);

  return (
    <div className="min-h-screen bg-white">
      <div className="bg-white border-b border-slate-200 px-6 py-5">
        <nav className="flex items-center gap-1.5 text-xs text-slate-500 mb-3">
          <Link href="/admin/dashboard" className="hover:text-slate-700">Admin</Link>
          <ChevronRight className="w-3 h-3" />
          <span className="text-slate-900 font-medium">Employers</span>
        </nav>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Employer Management</h1>
            <p className="text-sm text-slate-500 mt-1">Partner employers, job postings, and OJT placements</p>
          </div>
          <Link href="/admin/employers/new"
            className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors">
            <Plus className="w-4 h-4" /> Add Employer
          </Link>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6">

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Total Employers',  value: total ?? 0,   icon: Building2,   color: 'text-brand-blue-600', bg: 'bg-brand-blue-50' },
            { label: 'Active Partners',  value: active ?? 0,  icon: CheckCircle, color: 'text-green-600',      bg: 'bg-green-50' },
            { label: 'Open Jobs',        value: openJobs ?? 0,icon: Briefcase,   color: 'text-amber-600',      bg: 'bg-amber-50' },
          ].map((s) => {
            const Icon = s.icon;
            return (
              <div key={s.label} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
                <div className={`w-9 h-9 rounded-xl ${s.bg} flex items-center justify-center mb-3`}>
                  <Icon className={`w-4 h-4 ${s.color}`} />
                </div>
                <p className="text-2xl font-bold text-slate-900 tabular-nums">{s.value}</p>
                <p className="text-xs text-slate-500 mt-1 font-medium">{s.label}</p>
              </div>
            );
          })}
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="font-semibold text-slate-900 text-sm">All Employers</h2>
            <span className="text-xs text-slate-400">{total ?? 0} total</span>
          </div>
          {!employers?.length ? (
            <div className="py-16 text-center">
              <Building2 className="w-8 h-8 text-slate-300 mx-auto mb-3" />
              <p className="text-sm text-slate-500 font-medium">No employers yet</p>
              <p className="text-xs text-slate-400 mt-1">Add your first employer partner to get started</p>
              <Link href="/admin/employers/new" className="inline-flex items-center gap-1.5 mt-4 text-sm text-brand-blue-600 font-semibold hover:underline">
                <Plus className="w-3.5 h-3.5" /> Add Employer
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50">
                    <th className="text-left py-3 px-5 text-[10px] font-bold uppercase tracking-widest text-slate-400">Employer</th>
                    <th className="text-left py-3 px-4 text-[10px] font-bold uppercase tracking-widest text-slate-400">Industry</th>
                    <th className="text-left py-3 px-4 text-[10px] font-bold uppercase tracking-widest text-slate-400">Location</th>
                    <th className="text-left py-3 px-4 text-[10px] font-bold uppercase tracking-widest text-slate-400">Status</th>
                    <th className="text-left py-3 px-4 text-[10px] font-bold uppercase tracking-widest text-slate-400">Contact</th>
                    <th className="py-3 px-4" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {employers.map((e: any) => (
                    <tr key={e.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3.5 px-5 font-semibold text-slate-900">{e.name}</td>
                      <td className="py-3.5 px-4 text-slate-500">{e.industry ?? '—'}</td>
                      <td className="py-3.5 px-4 text-slate-500">
                        {[e.city, e.state].filter(Boolean).join(', ') || '—'}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold ${STATUS_STYLES[e.status] ?? 'bg-slate-100 text-slate-600'}`}>
                          {e.status ?? 'unknown'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-500 text-xs">{e.contact_email ?? '—'}</td>
                      <td className="py-3.5 px-4 text-right">
                        <Link href={`/admin/employers/${e.id}`}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-brand-blue-600 hover:text-brand-blue-700">
                          View <ArrowRight className="w-3 h-3" />
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
