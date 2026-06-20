import { Metadata } from 'next';
import { requireRole } from '@/lib/auth/require-role';
import { requireAdminClient } from '@/lib/supabase/admin';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, HeartHandshake } from 'lucide-react';

export const dynamic = 'force-dynamic';
export const revalidate = 60;
export const metadata: Metadata = { title: 'New WIOA Participant | Admin' };

async function createWioaParticipant(formData: FormData) {
  'use server';
  const db = await requireAdminClient();
  const { error } = await db.from('wioa_participants').insert({
    first_name: formData.get('first_name') as string,
    last_name: formData.get('last_name') as string,
    email: (formData.get('email') as string) || null,
    funding_source: (formData.get('funding_source') as string) || 'wioa_adult',
    eligibility_status: 'pending',
    household_size: parseInt((formData.get('household_size') as string) || '1', 10),
    annual_income: parseFloat((formData.get('annual_income') as string) || '0'),
  });
  if (!error) redirect('/admin/wioa');
}

export default async function NewWioaParticipantPage() {
  await requireRole(['admin', 'super_admin', 'staff']);
  return (
    <div className="min-h-screen bg-white p-6">
      <div className="max-w-xl mx-auto">
        <Link href="/admin/wioa" className="inline-flex items-center gap-1 text-sm text-brand-blue-600 hover:underline mb-6">
          <ArrowLeft className="w-4 h-4" /> Back to WIOA
        </Link>
        <div className="flex items-center gap-2 mb-6">
          <HeartHandshake className="w-5 h-5 text-brand-blue-600" />
          <h1 className="text-2xl font-bold text-slate-900">New WIOA Participant</h1>
        </div>
        <form action={createWioaParticipant} className="space-y-4 bg-white border border-slate-200 rounded-xl p-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">First Name <span className="text-rose-500">*</span></label>
              <input name="first_name" required className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Last Name <span className="text-rose-500">*</span></label>
              <input name="last_name" required className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue-500" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
            <input name="email" type="email" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Funding Source</label>
            <select name="funding_source" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue-500">
              <option value="wioa_adult">WIOA Adult</option>
              <option value="wioa_dislocated">WIOA Dislocated Worker</option>
              <option value="wioa_youth">WIOA Youth</option>
              <option value="snap_et">SNAP E&T</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Household Size</label>
              <input name="household_size" type="number" min="1" defaultValue="1" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Annual Income ($)</label>
              <input name="annual_income" type="number" min="0" step="0.01" defaultValue="0" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue-500" />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Link href="/admin/wioa" className="px-4 py-2 text-sm text-slate-600 hover:text-slate-900">Cancel</Link>
            <button type="submit" className="px-5 py-2 bg-brand-blue-600 text-white rounded-lg text-sm font-medium hover:bg-brand-blue-700">Add Participant</button>
          </div>
        </form>
      </div>
    </div>
  );
}
