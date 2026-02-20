export const dynamic = 'force-dynamic';

import { Metadata } from 'next';
import Link from 'next/link';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { ArrowLeft, FileText, User, DollarSign, Calendar, Save, Mail, Phone } from 'lucide-react';
import { createTaxApplication } from '../actions';

import { createClient } from '@/lib/supabase/server';
export const metadata: Metadata = {
  title: 'New Tax Filing Application | Admin',
  description: 'Create a new tax filing assistance application.',
  robots: { index: false, follow: false },
};

export default async function NewTaxFilingApplicationPage() {
  const supabase = await createClient();
  const { data: dbRows } = await supabase.from('tax_applications').select('*').limit(50);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-3xl mx-auto">
        <div className="mb-4">
          <Breadcrumbs items={[
            { label: 'Admin', href: '/admin/dashboard' },
            { label: 'Tax Filing', href: '/admin/tax-filing' },
            { label: 'Applications', href: '/admin/tax-filing/applications' },
            { label: 'New Application' },
          ]} />
        </div>

        <Link href="/admin/tax-filing/applications" className="text-sm text-brand-blue-600 hover:text-brand-blue-700 flex items-center gap-1 mb-4">
          <ArrowLeft className="w-4 h-4" /> Back to Applications
        </Link>

        <h1 className="text-2xl font-bold text-gray-900 mb-6">New Tax Filing Application</h1>

        <form action={createTaxApplication} className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <span className="flex items-center gap-1"><User className="w-3.5 h-3.5" /> Client Name *</span>
            </label>
            <input name="client_name" required className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue-500" placeholder="Full legal name" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <span className="flex items-center gap-1"><Mail className="w-3.5 h-3.5" /> Email *</span>
              </label>
              <input name="client_email" type="email" required className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue-500" placeholder="client@email.com" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <span className="flex items-center gap-1"><Phone className="w-3.5 h-3.5" /> Phone</span>
              </label>
              <input name="client_phone" type="tel" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue-500" placeholder="(317) 555-0100" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <span className="flex items-center gap-1"><FileText className="w-3.5 h-3.5" /> Filing Type</span>
              </label>
              <select name="filing_type" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue-500">
                <option value="individual">Individual (1040)</option>
                <option value="business">Business</option>
                <option value="nonprofit">Nonprofit</option>
                <option value="amendment">Amendment</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> Tax Year</span>
              </label>
              <select name="tax_year" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue-500">
                <option value="2025">2025</option>
                <option value="2024">2024</option>
                <option value="2023">2023</option>
                <option value="2022">2022</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea name="notes" rows={3} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue-500" placeholder="Special circumstances, documents needed, etc." />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
            <Link href="/admin/tax-filing/applications" className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800">Cancel</Link>
            <button type="submit" className="flex items-center gap-2 px-5 py-2 bg-brand-blue-600 text-white rounded-lg text-sm font-medium hover:bg-brand-blue-700">
              <Save className="w-4 h-4" /> Create Application
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
