export const dynamic = 'force-dynamic';

import Image from 'next/image';
import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Users, Plus, Phone, Mail, Calendar, Search } from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

export const metadata: Metadata = {
  title: 'Leads | Admin | Elevate For Humanity',
  description: 'Manage prospective student leads.',
};

const statusColors: Record<string, string> = {
  new: 'bg-brand-blue-100 text-brand-blue-800',
  contacted: 'bg-yellow-100 text-yellow-800',
  qualified: 'bg-brand-green-100 text-brand-green-800',
  appointment_set: 'bg-brand-blue-100 text-brand-blue-800',
  application_started: 'bg-indigo-100 text-indigo-800',
  enrolled: 'bg-emerald-100 text-emerald-800',
  not_interested: 'bg-gray-100 text-gray-800',
  unqualified: 'bg-brand-red-100 text-brand-red-800',
};

const statusLabels: Record<string, string> = {
  new: 'New',
  contacted: 'Contacted',
  qualified: 'Qualified',
  appointment_set: 'Appointment Set',
  application_started: 'Application Started',
  enrolled: 'Enrolled',
  not_interested: 'Not Interested',
  unqualified: 'Unqualified',
};

export default async function AdminLeadsPage() {
  const supabase = await createClient();
  const _admin = createAdminClient(); const db = _admin || supabase;
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?redirect=/admin/leads');
  }

  // Fetch leads from database
  let leads: any[] | null = null;
  let error: any = null;
  let totalLeads = 0;
  let newLeads = 0;
  let contactedToday = 0;
  let qualifiedLeads = 0;

  try {
    const result = await db
      .from('leads')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);
    leads = result.data;
    error = result.error;

    if (!error) {
      const { count: total } = await db
        .from('leads')
        .select('*', { count: 'exact', head: true });
      totalLeads = total || 0;

      const { count: newCount } = await db
        .from('leads')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'new');
      newLeads = newCount || 0;

      const { count: contactedCount } = await db
        .from('leads')
        .select('*', { count: 'exact', head: true })
        .gte('last_contacted_at', new Date().toISOString().split('T')[0]);
      contactedToday = contactedCount || 0;

      const { count: qualifiedCount } = await db
        .from('leads')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'qualified');
      qualifiedLeads = qualifiedCount || 0;
    }
  } catch (e) {
    error = { message: 'Table not found. Please run the migration.' };
  }

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Hero Image */}
      <section className="relative h-[160px] sm:h-[220px] md:h-[280px]">
        <Image src="/images/heroes-hq/about-hero.jpg" alt="Administration" fill sizes="100vw" className="object-cover" priority />
      </section>
      {/* Breadcrumbs */}
      <div className="bg-slate-50 border-b">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'Admin', href: '/admin' }, { label: 'Leads' }]} />
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Leads</h1>
            <p className="text-gray-600 mt-1">Manage prospective student inquiries</p>
          </div>
          <Link
            href="/admin/crm/leads/new"
            className="flex items-center gap-2 px-4 py-2 bg-brand-blue-600 text-white rounded-lg hover:bg-brand-blue-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Add Lead
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-brand-blue-100 rounded-lg">
                <Users className="w-6 h-6 text-brand-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{totalLeads || 0}</p>
                <p className="text-sm text-gray-600">Total Leads</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-brand-green-100 rounded-lg">
                <Phone className="w-6 h-6 text-brand-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{contactedToday || 0}</p>
                <p className="text-sm text-gray-600">Contacted Today</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Calendar className="w-6 h-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{newLeads || 0}</p>
                <p className="text-sm text-gray-600">New Leads</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-brand-blue-100 rounded-lg">
                <Users className="w-6 h-6 text-brand-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{qualifiedLeads || 0}</p>
                <p className="text-sm text-gray-600">Qualified</p>
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search leads..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-brand-blue-500"
              />
            </div>
            <div className="flex gap-2">
              <select className="px-4 py-2 border border-gray-300 rounded-lg bg-white">
                <option value="">All Statuses</option>
                {Object.entries(statusLabels).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
              <select className="px-4 py-2 border border-gray-300 rounded-lg bg-white">
                <option value="">All Programs</option>
                <option value="cna">CNA</option>
                <option value="medical-admin">Medical Admin</option>
                <option value="hvac">HVAC</option>
                <option value="it-support">IT Support</option>
              </select>
            </div>
          </div>
        </div>

        {/* Leads Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {error ? (
            <div className="p-8 text-center">
              <div className="text-brand-red-600 mb-4">Database table not found</div>
              <p className="text-gray-600 mb-4">
                Run the migration in Supabase Dashboard SQL Editor:
              </p>
              <code className="text-sm bg-gray-100 px-2 py-1 rounded">
                supabase/migrations/20260125_admin_tables.sql
              </code>
            </div>
          ) : !leads || leads.length === 0 ? (
            <div className="p-8 text-center">
              <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No leads yet</h3>
              <p className="text-gray-500 mb-4">Get started by adding your first lead</p>
              <Link
                href="/admin/crm/leads/new"
                className="inline-flex items-center gap-2 px-4 py-2 bg-brand-blue-600 text-white rounded-lg hover:bg-brand-blue-700"
              >
                <Plus className="w-5 h-5" />
                Add Lead
              </Link>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-gray-900">Name</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-gray-900">Contact</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-gray-900">Program Interest</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-gray-900">Source</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-gray-900">Status</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-gray-900">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {leads.map((lead) => (
                  <tr key={lead.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <Link href={`/admin/leads/${lead.id}`} className="font-medium text-gray-900 hover:text-brand-blue-600">
                        {lead.first_name} {lead.last_name}
                      </Link>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        <a href={`mailto:${lead.email}`} className="text-sm text-brand-blue-600 hover:underline flex items-center gap-1">
                          <Mail className="w-3 h-3" />
                          {lead.email}
                        </a>
                        {lead.phone && (
                          <a href={`tel:${lead.phone}`} className="text-sm text-gray-500 flex items-center gap-1">
                            <Phone className="w-3 h-3" />
                            {lead.phone}
                          </a>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {lead.program_interest || '-'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 capitalize">
                      {lead.source?.replace('_', ' ') || '-'}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[lead.status] || 'bg-gray-100 text-gray-800'}`}>
                        {statusLabels[lead.status] || lead.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {new Date(lead.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
