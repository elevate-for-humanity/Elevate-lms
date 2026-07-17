import { Metadata } from 'next';
import { requireRole } from '@/lib/auth/require-role';
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { Plus, Briefcase, Clock, CheckCircle, AlertCircle } from 'lucide-react';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Apprenticeships | Employer Portal',
  description: 'Manage your DOL-registered apprenticeship programs.',
  robots: { index: false, follow: false },
};

const STATUS_STYLES: Record<string, string> = {
  active: 'bg-brand-green-100 text-brand-green-800',
  pending: 'bg-yellow-100 text-yellow-800',
  draft: 'bg-slate-100 text-slate-700',
  inactive: 'bg-red-100 text-red-700',
};

export default async function EmployerApprenticeshipsPage() {
  const { user } = await requireRole(['employer', 'admin', 'staff']);
  const supabase = await createClient();

  // Fetch all apprenticeship programs for this employer
  const { data: apprenticeships } = await supabase
    .from('apprenticeships')
    .select('id, title, description, status, duration_months, created_at')
    .eq('employer_id', user.id)
    .order('created_at', { ascending: false });

  // Fetch enrollment counts per apprenticeship
  const ids = (apprenticeships || []).map((a) => a.id);
  const { data: enrollments } = ids.length
    ? await supabase
        .from('apprenticeship_enrollments')
        .select('apprenticeship_id')
        .in('apprenticeship_id', ids)
    : { data: [] };

  const enrollmentCounts = (enrollments || []).reduce<Record<string, number>>((acc, e) => {
    acc[e.apprenticeship_id] = (acc[e.apprenticeship_id] || 0) + 1;
    return acc;
  }, {});

  const list = apprenticeships || [];

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-5xl mx-auto px-4 py-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-brand-blue-600 mb-1">
              Employer Portal
            </p>
            <h1 className="text-2xl font-extrabold text-slate-900">Apprenticeship Programs</h1>
            <p className="text-slate-500 text-sm mt-1">
              DOL-registered apprenticeships you sponsor through Elevate.
            </p>
          </div>
          <Link
            href="/employer/apprenticeships/new"
            className="inline-flex items-center gap-2 bg-brand-blue-600 hover:bg-brand-blue-700 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Program
          </Link>
        </div>

        {list.length === 0 ? (
          /* Empty state */
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
            <Briefcase className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h2 className="text-lg font-bold text-slate-800 mb-2">No apprenticeship programs yet</h2>
            <p className="text-slate-500 text-sm mb-6 max-w-sm mx-auto">
              Create your first DOL-registered apprenticeship program to start enrolling
              apprentices through Elevate.
            </p>
            <Link
              href="/employer/apprenticeships/new"
              className="inline-flex items-center gap-2 bg-brand-blue-600 hover:bg-brand-blue-700 text-white font-bold px-6 py-3 rounded-xl text-sm transition-colors"
            >
              <Plus className="w-4 h-4" />
              Create Apprenticeship Program
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {list.map((a) => (
              <Link
                key={a.id}
                href={`/employer/apprenticeships/${a.id}`}
                className="block bg-white rounded-2xl border border-slate-200 p-6 hover:shadow-md hover:-translate-y-0.5 transition-all"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                      <h2 className="font-bold text-slate-900 text-base truncate">{a.title}</h2>
                      <span
                        className={`text-xs font-bold px-2 py-0.5 rounded-full capitalize ${
                          STATUS_STYLES[a.status] ?? STATUS_STYLES.draft
                        }`}
                      >
                        {a.status ?? 'draft'}
                      </span>
                    </div>
                    {a.description && (
                      <p className="text-slate-500 text-sm line-clamp-2">{a.description}</p>
                    )}
                  </div>
                  <div className="flex gap-6 shrink-0 text-center">
                    <div>
                      <p className="text-xl font-extrabold text-slate-900">
                        {enrollmentCounts[a.id] ?? 0}
                      </p>
                      <p className="text-xs text-slate-500">Enrolled</p>
                    </div>
                    {a.duration_months && (
                      <div>
                        <p className="text-xl font-extrabold text-slate-900">
                          {a.duration_months}
                        </p>
                        <p className="text-xs text-slate-500">Months</p>
                      </div>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Back link */}
        <div className="mt-8">
          <Link
            href="/employer/dashboard"
            className="text-sm text-slate-500 hover:text-slate-700 transition-colors"
          >
            ← Back to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
