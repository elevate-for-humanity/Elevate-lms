import { Metadata } from 'next';
import { requireRole } from '@/lib/auth/require-role';
import { requireAdminClient } from '@/lib/supabase/admin';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Mail } from 'lucide-react';

export const dynamic = 'force-dynamic';
export const revalidate = 60;
export const metadata: Metadata = { title: 'New Campaign | CRM | Admin' };

async function createCampaign(formData: FormData) {
  'use server';
  const db = await requireAdminClient();
  const { error } = await db.from('campaigns').insert({
    name: formData.get('name') as string,
    subject: formData.get('subject') as string,
    body: formData.get('body') as string,
    status: 'draft',
    audience: formData.get('audience') as string || 'all',
  });
  if (!error) redirect('/admin/crm/campaigns');
}

export default async function NewCampaignPage() {
  await requireRole(['admin', 'staff']);
  return (
    <div className="min-h-screen bg-white p-6">
      <div className="max-w-2xl mx-auto">
        <Link href="/admin/crm/campaigns" className="inline-flex items-center gap-1 text-sm text-brand-blue-600 hover:underline mb-6">
          <ArrowLeft className="w-4 h-4" /> Back to Campaigns
        </Link>
        <div className="flex items-center gap-2 mb-6">
          <Mail className="w-5 h-5 text-brand-blue-600" />
          <h1 className="text-2xl font-bold text-slate-900">New Campaign</h1>
        </div>
        <form action={createCampaign} className="space-y-4 bg-white border border-slate-200 rounded-xl p-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Campaign Name <span className="text-rose-500">*</span></label>
            <input name="name" required className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue-500" placeholder="e.g. Spring Enrollment Push" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Email Subject <span className="text-rose-500">*</span></label>
            <input name="subject" required className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue-500" placeholder="Subject line" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Audience</label>
            <select name="audience" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue-500">
              <option value="all">All contacts</option>
              <option value="leads">Leads only</option>
              <option value="enrolled">Enrolled students</option>
              <option value="alumni">Alumni</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Body <span className="text-rose-500">*</span></label>
            <textarea name="body" required rows={6} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue-500 resize-none" placeholder="Email body content..." />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Link href="/admin/crm/campaigns" className="px-4 py-2 text-sm text-slate-600 hover:text-slate-900">Cancel</Link>
            <button type="submit" className="px-5 py-2 bg-brand-blue-600 text-white rounded-lg text-sm font-medium hover:bg-brand-blue-700">Save as Draft</button>
          </div>
        </form>
      </div>
    </div>
  );
}
