import { Metadata } from 'next';
import { requireRole } from '@/lib/auth/require-role';
import { requireAdminClient } from '@/lib/supabase/admin';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, DollarSign } from 'lucide-react';

export const dynamic = 'force-dynamic';
export const revalidate = 60;
export const metadata: Metadata = { title: 'New Deal | CRM | Admin' };

async function createDeal(formData: FormData) {
  'use server';
  const db = await requireAdminClient();
  const valueCents = Math.round(parseFloat((formData.get('value') as string) || '0') * 100);
  const { error } = await db.from('crm_deals').insert({
    title: formData.get('title') as string,
    stage: formData.get('stage') as string,
    value: valueCents,
    probability: parseInt((formData.get('probability') as string) || '50', 10),
    expected_close_date: (formData.get('expected_close_date') as string) || null,
    notes: (formData.get('notes') as string) || null,
  });
  if (!error) redirect('/admin/crm/deals');
}

export default async function NewDealPage() {
  await requireRole(['admin', 'staff']);
  return (
    <div className="min-h-screen bg-white p-6">
      <div className="max-w-xl mx-auto">
        <Link href="/admin/crm/deals" className="inline-flex items-center gap-1 text-sm text-brand-blue-600 hover:underline mb-6">
          <ArrowLeft className="w-4 h-4" /> Back to Deals
        </Link>
        <div className="flex items-center gap-2 mb-6">
          <DollarSign className="w-5 h-5 text-brand-blue-600" />
          <h1 className="text-2xl font-bold text-slate-900">New Deal</h1>
        </div>
        <form action={createDeal} className="space-y-4 bg-white border border-slate-200 rounded-xl p-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Deal Title <span className="text-rose-500">*</span></label>
            <input name="title" required className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue-500" placeholder="e.g. Workforce partnership — ACME Corp" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Stage</label>
              <select name="stage" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue-500">
                <option>Discovery</option>
                <option>Proposal</option>
                <option>Negotiation</option>
                <option>Closed Won</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Value ($)</label>
              <input name="value" type="number" min="0" step="0.01" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue-500" placeholder="0.00" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Probability (%)</label>
              <input name="probability" type="number" min="0" max="100" defaultValue="50" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Expected Close</label>
              <input name="expected_close_date" type="date" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue-500" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Notes</label>
            <textarea name="notes" rows={3} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue-500 resize-none" />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Link href="/admin/crm/deals" className="px-4 py-2 text-sm text-slate-600 hover:text-slate-900">Cancel</Link>
            <button type="submit" className="px-5 py-2 bg-brand-blue-600 text-white rounded-lg text-sm font-medium hover:bg-brand-blue-700">Create Deal</button>
          </div>
        </form>
      </div>
    </div>
  );
}
