import { requireRole } from '@/lib/auth/require-role';
import { Metadata } from 'next';
import { requireAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { Users, Search, Filter, Plus, Mail, Phone, MoreVertical, Building2 } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Contacts | CRM | Admin | Elevate For Humanity',
  description: 'Manage contacts and leads in the CRM.',
};

export const dynamic = 'force-dynamic';

export default async function ContactsPage({
  searchParams,
}: {
  searchParams: Promise<{ review?: string }>;
}) {
  await requireRole(['admin', 'staff']);
  const supabase = await createClient();

  const pendingReview = (await searchParams).review === 'pending';
  const db = await requireAdminClient();
  const crmQuery = db
    .from('crm_contacts')
    .select('id,first_name,last_name,email,phone,company,contact_type,status,created_at,updated_at')
    .order('created_at', { ascending: false })
    .limit(pendingReview ? 100 : 50);
  const [crm, marketing] = await Promise.all([
    pendingReview
      ? crmQuery.eq('status', 'Pending Review').contains('tags', ['partnership-review'])
      : crmQuery,
    pendingReview
      ? Promise.resolve({ data: [], error: null })
      : supabase
          .from('marketing_contacts')
          .select(
            'id,name,first_name,last_name,email,phone,company,contact_type,status,message,program_interest,created_at,updated_at',
          )
          .order('created_at', { ascending: false })
          .limit(50),
  ]);
  const byEmail = new Map<string, Record<string, string | null>>();
  for (const contact of crm.data ?? []) {
    const key = contact.email?.trim().toLowerCase() || contact.id;
    byEmail.set(key, contact);
  }
  for (const inquiry of marketing.data ?? []) {
    const key = inquiry.email?.trim().toLowerCase() || inquiry.id;
    const contact = byEmail.get(key);
    if (!contact) {
      byEmail.set(key, inquiry);
      continue;
    }

    const latestCreatedAt = [contact.created_at, inquiry.created_at]
      .filter((value): value is string => Boolean(value))
      .sort()
      .pop() ?? null;
    const latestUpdatedAt = [contact.updated_at, inquiry.updated_at, inquiry.created_at]
      .filter((value): value is string => Boolean(value))
      .sort()
      .pop() ?? latestCreatedAt;
    byEmail.set(key, {
      ...inquiry,
      ...contact,
      name: inquiry.name ?? contact.name ?? null,
      message: inquiry.message ?? contact.message ?? null,
      program_interest: inquiry.program_interest ?? contact.program_interest ?? null,
      created_at: latestCreatedAt,
      updated_at: latestUpdatedAt,
    });
  }
  const contacts = [...byEmail.values()]
    .sort((a, b) => (b.created_at ?? '').localeCompare(a.created_at ?? ''))
    .slice(0, pendingReview ? 100 : 50)
    .map((c) => {
      const updatedAt = new Date(c.updated_at ?? c.created_at ?? Date.now());
      const now = new Date();
      const diffDays = Math.floor((now.getTime() - updatedAt.getTime()) / 86400000);
      const lastContact =
        diffDays === 0 ? 'Today' : diffDays === 1 ? 'Yesterday' : `${diffDays} days ago`;

      const displayName =
        c.name || [c.first_name, c.last_name].filter(Boolean).join(' ').trim() || 'Contact';

      return {
        id: c.id,
        name: displayName,
        email: c.email || '',
        phone: c.phone || '',
        company: c.company || '',
        type: c.contact_type || 'Lead',
        status: c.status || 'Active',
        message: c.message || '',
        programInterest: c.program_interest || '',
        lastContact,
        image: null,
      };
    });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Hot':
        return 'bg-brand-red-100 text-brand-red-700';
      case 'Warm':
        return 'bg-brand-orange-100 text-brand-orange-700';
      case 'Active':
        return 'bg-brand-green-100 text-brand-green-700';
      default:
        return 'bg-slate-100 text-slate-900';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'Lead':
        return 'bg-brand-blue-100 text-brand-blue-700';
      case 'Customer':
        return 'bg-brand-green-100 text-brand-green-700';
      case 'Partner':
        return 'bg-brand-blue-100 text-brand-blue-700';
      default:
        return 'bg-slate-100 text-slate-900';
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {(crm.error || marketing.error) && (
        <p role="alert" className="mx-auto max-w-7xl p-4 text-sm text-red-700">
          Some contacts could not be loaded. Refresh to try again.
        </p>
      )}
      {/* Hero Image */}
      {/* Header */}
      <section className="border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Users className="w-8 h-8 text-brand-blue-600" />
                <h1 className="text-3xl font-bold text-slate-900">Contacts</h1>
              </div>
              <p className="text-slate-700">Manage your contacts and relationships</p>
            </div>
            <Link
              href="/crm/contacts/new"
              className="inline-flex items-center gap-2 px-6 py-3 bg-brand-blue-600 text-white font-semibold rounded-lg hover:bg-brand-blue-700 transition-colors"
            >
              <Plus className="w-5 h-5" />
              Add Contact
            </Link>
          </div>
        </div>
      </section>

      <nav
        aria-label="Contact views"
        className="mx-auto flex max-w-7xl gap-5 px-4 py-4 text-sm font-semibold text-brand-blue-700"
      >
        <Link href="/crm/contacts" aria-current={!pendingReview ? 'page' : undefined}>
          Recent contacts
        </Link>
        <Link href="/crm/contacts?review=pending" aria-current={pendingReview ? 'page' : undefined}>
          Pending partnership review
        </Link>
      </nav>

      {/* Filters */}
      <section className="border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-700" />
              <input
                type="text"
                placeholder="Search contacts..."
                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-blue-500"
              />
            </div>
            <div className="flex gap-3">
              <select className="px-4 py-2 border border-slate-300 rounded-lg">
                <option>All Types</option>
                <option>Leads</option>
                <option>Customers</option>
                <option>Partners</option>
              </select>
              <select className="px-4 py-2 border border-slate-300 rounded-lg">
                <option>All Status</option>
                <option>Hot</option>
                <option>Warm</option>
                <option>Active</option>
              </select>
              <button className="px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 flex items-center gap-2">
                <Filter className="w-4 h-4" />
                More
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Contacts Grid */}
      <section className="py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {contacts.map((contact) => (
              <div
                key={contact.id}
                className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-slate-200 flex items-center justify-center flex-shrink-0">
                      <span className="text-slate-600 font-semibold text-sm">
                        {contact.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900">{contact.name}</h3>
                      <div className="flex items-center gap-1 text-slate-700 text-sm">
                        <Building2 className="w-3 h-3" />
                        {contact.company}
                      </div>
                    </div>
                  </div>
                  <button className="p-1 hover:bg-slate-100 rounded">
                    <MoreVertical className="w-5 h-5 text-slate-700" />
                  </button>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-sm text-slate-700">
                    <Mail className="w-4 h-4 text-slate-700" />
                    {contact.email}
                  </div>
                  {contact.phone ? (
                    <div className="flex items-center gap-2 text-sm text-slate-700">
                      <Phone className="w-4 h-4 text-slate-700" />
                      {contact.phone}
                    </div>
                  ) : null}
                  {contact.programInterest ? (
                    <p className="text-xs text-slate-500">
                      Program:{' '}
                      <span className="font-medium text-slate-700">{contact.programInterest}</span>
                    </p>
                  ) : null}
                  {contact.message ? (
                    <p className="text-sm text-slate-600 line-clamp-3 border-l-2 border-slate-200 pl-3">
                      {contact.message}
                    </p>
                  ) : null}
                </div>

                <div className="flex items-center gap-2 mb-4">
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(contact.type)}`}
                  >
                    {contact.type}
                  </span>
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(contact.status)}`}
                  >
                    {contact.status}
                  </span>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                  <span className="text-sm text-slate-700">
                    Last contact: {contact.lastContact}
                  </span>
                  <Link
                    href={`/crm/contacts/${contact.id}`}
                    className="text-brand-blue-600 text-sm font-medium hover:text-brand-blue-700"
                  >
                    View Details
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
