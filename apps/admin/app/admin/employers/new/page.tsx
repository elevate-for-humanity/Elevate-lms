import { Metadata } from 'next';
import { requireRole } from '@/lib/auth/require-role';
import { requireAdminClient } from '@/lib/supabase/admin';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Building2 } from 'lucide-react';

export const dynamic = 'force-dynamic';
export const revalidate = 60;
export const metadata: Metadata = { title: 'New Employer | Admin' };

async function createEmployer(formData: FormData) {
  'use server';
  const db = await requireAdminClient();
  const { error } = await db.from('employers').insert({
    name: formData.get('name') as string,
    industry: (formData.get('industry') as string) || null,
    city: (formData.get('city') as string) || null,
    state: (formData.get('state') as string) || null,
    phone: (formData.get('phone') as string) || null,
    email: (formData.get('email') as string) || null,
    status: 'active',
  });
  if (!error) redirect('/admin/employers');
}

export default async function NewEmployerPage() {
  await requireRole(['admin', 'super_admin', 'staff']);
  return (
    <div className="min-h-screen bg-white p-6">
      <div className="max-w-xl mx-auto">
        <Link href="/admin/employers" className="inline-flex items-center gap-1 text-sm text-brand-blue-600 hover:underline mb-6">
          <ArrowLeft className="w-4 h-4" /> Back to Employers
        </Link>
        <div className="flex items-center gap-2 mb-6">
          <Building2 className="w-5 h-5 text-brand-blue-600" />
          <h1 className="text-2xl font-bold text-slate-900">Add Employer</h1>
        </div>
        <form action={createEmployer} className="space-y-4 bg-white border border-slate-200 rounded-xl p-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Company Name <span className="text-rose-500">*</span></label>
            <input name="name" required className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Industry</label>
            <input name="industry" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue-500" placeholder="e.g. HVAC, Healthcare, Construction" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">City</label>
              <input name="city" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">State</label>
              <input name="state" maxLength={2} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue-500" placeholder="IN" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Phone</label>
              <input name="phone" type="tel" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
              <input name="email" type="email" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue-500" />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Link href="/admin/employers" className="px-4 py-2 text-sm text-slate-600 hover:text-slate-900">Cancel</Link>
            <button type="submit" className="px-5 py-2 bg-brand-blue-600 text-white rounded-lg text-sm font-medium hover:bg-brand-blue-700">Add Employer</button>
          </div>
        </form>
      </div>
    </div>
  );
}
