import { Metadata } from 'next';
import { requireRole } from '@/lib/auth/require-role';
import { requireAdminClient } from '@/lib/supabase/admin';
import Link from 'next/link';
import { BookOpen, Plus, ChevronRight, ArrowRight, Star } from 'lucide-react';

export const dynamic = 'force-dynamic';
export const revalidate = 60;
export const metadata: Metadata = { title: 'Learning Paths | Admin' };

export default async function LearningPathsPage() {
  await requireRole(['admin', 'staff']);
  const db = await requireAdminClient();

  const { data: paths, error } = await db
    .from('learning_paths')
    .select('id, name, description, is_featured, path_type, created_at')
    .order('is_featured', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(100);

  if (error) console.error('[LearningPaths] query failed:', error.message);

  const allPaths = paths ?? [];
  const featured = allPaths.filter((p: any) => p.is_featured).length;
  const published = allPaths.filter((p: any) => p.path_type === 'credential').length;

  return (
    <div className="min-h-screen bg-white">
      <div className="bg-white border-b border-slate-200 px-6 py-5">
        <nav className="flex items-center gap-1.5 text-xs text-slate-500 mb-3">
          <Link href="/admin/dashboard" className="hover:text-slate-700">Admin</Link>
          <ChevronRight className="w-3 h-3" />
          <span className="text-slate-900 font-medium">Learning Paths</span>
        </nav>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Learning Paths</h1>
            <p className="text-sm text-slate-500 mt-1">Structured career development pathways</p>
          </div>
          <Link
            href="/admin/learning-paths/new"
            className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors"
          >
            <Plus className="w-4 h-4" /> Add Path
          </Link>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Total Paths', value: allPaths.length, icon: BookOpen, color: 'text-brand-blue-600', bg: 'bg-brand-blue-50' },
            { label: 'Credential Paths', value: published, icon: Star, color: 'text-green-600', bg: 'bg-green-50' },
            { label: 'Featured', value: featured, icon: Star, color: 'text-amber-600', bg: 'bg-amber-50' },
          ].map((s) => {
            const Icon = s.icon;
            return (
              <div key={s.label} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
                <div className={`w-10 h-10 ${s.bg} rounded-xl flex items-center justify-center mb-3`}>
                  <Icon className={`w-5 h-5 ${s.color}`} />
                </div>
                <p className="text-2xl font-bold text-slate-900">{s.value}</p>
                <p className="text-sm text-slate-500 mt-0.5">{s.label}</p>
              </div>
            );
          })}
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100">
            <h2 className="text-sm font-semibold text-slate-900">All Learning Paths</h2>
          </div>
          {!allPaths.length ? (
            <p className="text-slate-500 text-sm text-center py-12">No learning paths yet.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="text-left py-3 px-5 text-[10px] font-bold uppercase tracking-widest text-slate-400">Title</th>
                  <th className="text-left py-3 px-4 text-[10px] font-bold uppercase tracking-widest text-slate-400">Type</th>
                  <th className="text-left py-3 px-4 text-[10px] font-bold uppercase tracking-widest text-slate-400">Featured</th>
                  <th className="text-left py-3 px-4 text-[10px] font-bold uppercase tracking-widest text-slate-400">Created</th>
                  <th className="py-3 px-4" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {allPaths.map((p: any) => (
                  <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3.5 px-5">
                      <p className="font-semibold text-slate-900">{p.name ?? '—'}</p>
                      {p.description && (
                        <p className="text-xs text-slate-400 truncate max-w-xs mt-0.5">{p.description}</p>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold ${
                        p.path_type === 'credential' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {p.path_type ?? 'general'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">
                      {p.is_featured ? <Star className="w-4 h-4 text-amber-500 fill-amber-500" /> : '—'}
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 text-xs">
                      {p.created_at ? new Date(p.created_at).toLocaleDateString() : '—'}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <Link
                        href={`/admin/learning-paths/${p.id}`}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-brand-blue-600 hover:text-brand-blue-700"
                      >
                        Edit <ArrowRight className="w-3 h-3" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
