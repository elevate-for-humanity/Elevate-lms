import { Metadata } from 'next';
import { requireAdmin } from '@/lib/auth';
import { requireAdminClient } from '@/lib/supabase/admin';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import Link from 'next/link';
import { createCohort } from './actions';

export const dynamic = 'force-dynamic';
export const revalidate = 60;

export const metadata: Metadata = {
  title: 'New Cohort | Admin',
};

export default async function NewCohortPage() {
  await requireAdmin();
  const db = await requireAdminClient();
  if (!db) throw new Error('Admin client unavailable');

  // Load programs for the dropdown
  const { data: programs } = await db
    .from('programs')
    .select('id, title, slug')
    .eq('is_active', true)
    .order('title');

  // Load instructors for the dropdown
  const { data: instructors } = await db
    .from('profiles')
    .select('id, full_name, email')
    .in('role', ['instructor', 'admin', 'super_admin'])
    .order('full_name');

  // Generate a default cohort code (e.g. C-2026-001)
  const { count } = await db
    .from('cohorts')
    .select('*', { count: 'exact', head: true });
  const defaultCode = `C-${new Date().getFullYear()}-${String((count ?? 0) + 1).padStart(3, '0')}`;

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-2xl mx-auto px-4 py-6">
        <Breadcrumbs items={[
          { label: 'Admin', href: '/admin' },
          { label: 'Cohorts', href: '/admin/cohorts' },
          { label: 'New Cohort' },
        ]} />

        <div className="mt-4 mb-6">
          <h1 className="text-2xl font-extrabold text-slate-900">Create Cohort</h1>
          <p className="text-slate-500 text-sm mt-0.5">
            A cohort groups students into a scheduled training session for a program.
          </p>
        </div>

        <form action={createCohort} className="bg-white rounded-xl border border-slate-200 p-6 space-y-5">
          {/* Name */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">
              Cohort Name <span className="text-red-500">*</span>
            </label>
            <input
              name="name"
              required
              placeholder="e.g. HVAC Spring 2026 — Cohort A"
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue-500"
            />
          </div>

          {/* Code */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">
              Cohort Code <span className="text-red-500">*</span>
            </label>
            <input
              name="code"
              required
              defaultValue={defaultCode}
              placeholder="e.g. C-2026-001"
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-brand-blue-500"
            />
            <p className="text-xs text-slate-400 mt-1">Must be unique. Used in reports and FSSA submissions.</p>
          </div>

          {/* Program */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">
              Program <span className="text-red-500">*</span>
            </label>
            <select
              name="program_id"
              required
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue-500"
            >
              <option value="">Select a program...</option>
              {(programs ?? []).map((p) => (
                <option key={p.id} value={p.id}>{p.title}</option>
              ))}
            </select>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">
                Start Date <span className="text-red-500">*</span>
              </label>
              <input
                name="start_date"
                type="date"
                required
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">End Date</label>
              <input
                name="end_date"
                type="date"
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue-500"
              />
            </div>
          </div>

          {/* Capacity + Status */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Max Capacity</label>
              <input
                name="max_capacity"
                type="number"
                min="1"
                max="500"
                defaultValue="20"
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Status</label>
              <select
                name="status"
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue-500"
              >
                <option value="planned">Planned</option>
                <option value="enrolling">Enrolling</option>
                <option value="active">Active</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>

          {/* Location */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Location</label>
            <input
              name="location"
              placeholder="e.g. Elevate Training Center — Room 101"
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue-500"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Notes</label>
            <textarea
              name="notes"
              rows={3}
              placeholder="Internal notes about this cohort..."
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue-500 resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              className="flex-1 bg-slate-900 hover:bg-slate-700 text-white font-bold py-2.5 rounded-xl text-sm transition"
            >
              Create Cohort
            </button>
            <Link
              href="/admin/cohorts"
              className="flex-1 text-center border border-slate-200 text-slate-700 font-semibold py-2.5 rounded-xl text-sm hover:bg-slate-50 transition"
            >
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
