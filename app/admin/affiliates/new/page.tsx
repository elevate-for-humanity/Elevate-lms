export const dynamic = 'force-dynamic';

import { Metadata } from 'next';
import Link from 'next/link';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { ArrowLeft, Users, Mail, Phone, Globe, DollarSign, Save } from 'lucide-react';
import { createAffiliate } from '../actions';

import { createClient } from '@/lib/supabase/server';
export const metadata: Metadata = {
  title: 'New Affiliate | Admin',
  description: 'Add a new affiliate partner.',
  robots: { index: false, follow: false },
};

export default async function NewAffiliatePage() {
  const supabase = await createClient();
  const { data: dbRows } = await supabase.from('affiliates').select('*').limit(50);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-3xl mx-auto">
        <div className="mb-4">
          <Breadcrumbs items={[
            { label: 'Admin', href: '/admin/dashboard' },
            { label: 'Affiliates', href: '/admin/affiliates' },
            { label: 'New Affiliate' },
          ]} />
        </div>

        <Link href="/admin/affiliates" className="text-sm text-brand-blue-600 hover:text-brand-blue-700 flex items-center gap-1 mb-4">
          <ArrowLeft className="w-4 h-4" /> Back to Affiliates
        </Link>

        <h1 className="text-2xl font-bold text-gray-900 mb-6">Add New Affiliate</h1>

        <form action={createAffiliate} className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" /> Organization / Name *</span>
            </label>
            <input name="name" required className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue-500" placeholder="Partner organization name" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <span className="flex items-center gap-1"><Mail className="w-3.5 h-3.5" /> Email *</span>
              </label>
              <input name="email" type="email" required className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue-500" placeholder="contact@partner.org" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <span className="flex items-center gap-1"><Phone className="w-3.5 h-3.5" /> Phone</span>
              </label>
              <input name="phone" type="tel" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue-500" placeholder="(317) 555-0100" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <span className="flex items-center gap-1"><Globe className="w-3.5 h-3.5" /> Website</span>
              </label>
              <input name="website" type="url" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue-500" placeholder="https://partner.org" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <span className="flex items-center gap-1"><DollarSign className="w-3.5 h-3.5" /> Commission Rate (%)</span>
              </label>
              <input name="commission" type="number" step="0.1" min="0" max="100" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue-500" placeholder="10" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea name="notes" rows={3} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue-500" placeholder="Additional details about this affiliate..." />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
            <Link href="/admin/affiliates" className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800">Cancel</Link>
            <button type="submit" className="flex items-center gap-2 px-5 py-2 bg-brand-blue-600 text-white rounded-lg text-sm font-medium hover:bg-brand-blue-700">
              <Save className="w-4 h-4" /> Create Affiliate
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
