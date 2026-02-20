export const dynamic = 'force-dynamic';

import { Metadata } from 'next';
import Link from 'next/link';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { ArrowLeft, Gift, DollarSign, Calendar, Building, Save } from 'lucide-react';
import { createIncentive } from '../actions';

import { createClient } from '@/lib/supabase/server';
export const metadata: Metadata = {
  title: 'Create Incentive | Admin',
  description: 'Create a new employer incentive or tax credit.',
  robots: { index: false, follow: false },
};

export default async function CreateIncentivePage() {
  const supabase = await createClient();
  const { data: dbRows } = await supabase.from('employer_incentives').select('*').limit(50);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-3xl mx-auto">
        <div className="mb-4">
          <Breadcrumbs items={[
            { label: 'Admin', href: '/admin/dashboard' },
            { label: 'Incentives', href: '/admin/incentives' },
            { label: 'Create Incentive' },
          ]} />
        </div>

        <Link href="/admin/incentives" className="text-sm text-brand-blue-600 hover:text-brand-blue-700 flex items-center gap-1 mb-4">
          <ArrowLeft className="w-4 h-4" /> Back to Incentives
        </Link>

        <h1 className="text-2xl font-bold text-gray-900 mb-6">Create Incentive</h1>

        <form action={createIncentive} className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <span className="flex items-center gap-1"><Gift className="w-3.5 h-3.5" /> Incentive Name *</span>
            </label>
            <input name="name" required className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue-500" placeholder="e.g., WOTC Tax Credit" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
              <select name="type" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue-500">
                <option value="tax_credit">Tax Credit</option>
                <option value="grant">Grant</option>
                <option value="subsidy">Wage Subsidy</option>
                <option value="bonus">Completion Bonus</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <span className="flex items-center gap-1"><DollarSign className="w-3.5 h-3.5" /> Amount ($)</span>
              </label>
              <input name="amount" type="number" step="0.01" min="0" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue-500" placeholder="2400.00" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <span className="flex items-center gap-1"><Building className="w-3.5 h-3.5" /> Employer</span>
            </label>
            <input name="employer" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue-500" placeholder="Employer name (if applicable)" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> Start Date</span>
              </label>
              <input name="start_date" type="date" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> End Date</span>
              </label>
              <input name="end_date" type="date" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue-500" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea name="description" rows={3} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue-500" placeholder="Details about this incentive program..." />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
            <Link href="/admin/incentives" className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800">Cancel</Link>
            <button type="submit" className="flex items-center gap-2 px-5 py-2 bg-brand-blue-600 text-white rounded-lg text-sm font-medium hover:bg-brand-blue-700">
              <Save className="w-4 h-4" /> Create Incentive
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
