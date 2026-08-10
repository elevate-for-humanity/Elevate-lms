import type { Metadata } from 'next';
import Link from 'next/link';
import { createEmployerApprenticeship } from '../actions';
import { requireRole } from '@/lib/auth/require-role';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'New Apprenticeship Draft | Employer Portal',
  robots: { index: false, follow: false },
};

export default async function NewEmployerApprenticeshipPage() {
  await requireRole(['employer', 'sponsor']);

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-3xl mx-auto px-4 py-10">
        <div className="mb-8">
          <p className="text-xs font-bold uppercase tracking-widest text-brand-blue-600 mb-1">Employer Portal</p>
          <h1 className="text-2xl font-extrabold text-slate-900">Create Apprenticeship Draft</h1>
          <p className="text-sm text-slate-600 mt-2">
            This creates a draft proposal only. It does not represent an approved or registered apprenticeship until administrative review is complete.
          </p>
        </div>

        <form action={createEmployerApprenticeship} className="bg-white rounded-2xl border border-slate-200 p-6 space-y-6">
          <div>
            <label htmlFor="title" className="block text-sm font-semibold text-slate-800 mb-2">Program title</label>
            <input
              id="title"
              name="title"
              required
              minLength={3}
              maxLength={160}
              className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-blue-500"
              placeholder="Example: Barber Apprenticeship"
            />
          </div>

          <div>
            <label htmlFor="duration_months" className="block text-sm font-semibold text-slate-800 mb-2">Estimated duration in months</label>
            <input
              id="duration_months"
              name="duration_months"
              type="number"
              min={1}
              max={120}
              className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-blue-500"
            />
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-semibold text-slate-800 mb-2">Description</label>
            <textarea
              id="description"
              name="description"
              rows={5}
              className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-blue-500"
            />
          </div>

          <div>
            <label htmlFor="requirements" className="block text-sm font-semibold text-slate-800 mb-2">Employer requirements</label>
            <textarea
              id="requirements"
              name="requirements"
              rows={4}
              className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-blue-500"
            />
          </div>

          <div>
            <label htmlFor="benefits" className="block text-sm font-semibold text-slate-800 mb-2">Benefits / wage progression notes</label>
            <textarea
              id="benefits"
              name="benefits"
              rows={4}
              className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-blue-500"
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-end border-t border-slate-200 pt-5">
            <Link href="/employer/apprenticeships" className="px-5 py-2.5 rounded-lg border border-slate-300 text-slate-700 text-center">
              Cancel
            </Link>
            <button type="submit" className="px-5 py-2.5 rounded-lg bg-brand-blue-600 text-white font-semibold hover:bg-brand-blue-700">
              Save Draft
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
