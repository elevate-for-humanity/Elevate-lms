import { Metadata } from 'next';
export const dynamic = 'force-dynamic';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireRole } from '@/lib/auth/require-role';
import Link from 'next/link';
import { Ticket, AlertCircle, Clock } from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

export const metadata: Metadata = {
  alternates: {
    canonical:
      'https://www.elevateforhumanity.org/staff-portal/customer-service',
  },
  title: 'Customer Service | Elevate For Humanity',
  description: 'Manage customer service tickets and protocols.',
};

export default async function CustomerServicePage() {
  const { user, profile } = await requireRole([
    'staff',
    'admin',
    'super_admin',
    'advisor',
  ]);
  const supabase = await createClient();
  const _admin = createAdminClient(); const db = _admin || supabase;

  if (!supabase) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Service Unavailable</h1>
          <p className="text-gray-600">Please try again later.</p>
        </div>
      </div>
    );
  }

  const { data: protocols } = await db
    .from('customer_service_protocols')
    .select('*')
    .order('category');

  const { data: tickets } = await db
    .from('customer_service_tickets')
    .select(`*, student:student_id(id, first_name, last_name, email)`)
    .in('status', ['open', 'in_progress'])
    .or(`staff_id.eq.${user.id},staff_id.is.null`)
    .order('priority', { ascending: false })
    .order('created_at', { ascending: true });

  const openCount = tickets?.filter((t) => t.status === 'open').length || 0;
  const inProgressCount =
    tickets?.filter((t) => t.status === 'in_progress').length || 0;

  return (
    <div className="min-h-screen bg-white">
      {/* Breadcrumbs */}
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'Staff Portal', href: '/staff-portal' }, { label: 'Customer Service' }]} />
        </div>
      </div>

      <section className="bg-white border-b border-slate-200 py-6">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-black">
                Customer Service
              </h1>
              <p className="text-black mt-2">
                Manage tickets and view protocols
              </p>
            </div>
            <Link
              href="/staff-portal/dashboard"
              className="text-brand-blue-600 hover:text-brand-blue-700 font-medium"
            >
              ← Back
            </Link>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
            <Ticket className="h-11 w-11 text-brand-blue-600 mb-2" />
            <p className="text-3xl font-bold text-black">
              {tickets?.length || 0}
            </p>
            <p className="text-black text-sm">Total Active Tickets</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
            <AlertCircle className="h-11 w-11 text-brand-red-600 mb-2" />
            <p className="text-3xl font-bold text-black">{openCount}</p>
            <p className="text-black text-sm">Open Tickets</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
            <Clock className="h-11 w-11 text-yellow-600 mb-2" />
            <p className="text-3xl font-bold text-black">
              {inProgressCount}
            </p>
            <p className="text-black text-sm">In Progress</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div>
            <h2 className="text-2xl font-bold text-black mb-4">
              Active Tickets
            </h2>
            {!tickets || tickets.length === 0 ? (
              <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-8 text-center">
                <span className="text-slate-400 flex-shrink-0">•</span>
                <p className="text-black">No active tickets</p>
              </div>
            ) : (
              <div className="space-y-4">
                {tickets.map((ticket) => (
                  <div
                    key={ticket.id}
                    className="bg-white rounded-lg shadow-sm border border-slate-200 p-4"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h3 className="font-semibold text-black">
                          {ticket.issue}
                        </h3>
                        <p className="text-sm text-black mt-1">
                          Student: {ticket.student?.first_name}{' '}
                          {ticket.student?.last_name}
                        </p>
                      </div>
                      <span
                        className={`px-2 py-2 text-xs font-medium rounded ${
                          ticket.priority === 'urgent'
                            ? 'bg-brand-red-100 text-brand-red-700'
                            : ticket.priority === 'high'
                              ? 'bg-brand-orange-100 text-brand-orange-700'
                              : ticket.priority === 'medium'
                                ? 'bg-yellow-100 text-yellow-700'
                                : 'bg-white text-black'
                        }`}
                      >
                        {ticket.priority}
                      </span>
                    </div>
                    <div className="flex items-center justify-between mt-3">
                      <span
                        className={`text-sm ${
                          ticket.status === 'open'
                            ? 'text-brand-red-600'
                            : 'text-yellow-600'
                        }`}
                      >
                        {ticket.status === 'open' ? 'Open' : 'In Progress'}
                      </span>
                      <button className="text-sm text-brand-blue-600 hover:text-brand-blue-700 font-medium" aria-label="Action button">
                        View Details →
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <h2 className="text-2xl font-bold text-black mb-4">
              Service Protocols
            </h2>
            {protocols && protocols.length > 0 ? (
              <div className="space-y-4">
                {protocols.map((protocol) => (
                  <div
                    key={protocol.id}
                    className="bg-white rounded-lg shadow-sm border border-slate-200 p-4"
                  >
                    <h3 className="font-semibold text-black mb-2">
                      {protocol.category}
                    </h3>
                    {protocol.dos && protocol.dos.length > 0 && (
                      <div className="mb-2">
                        <p className="text-sm font-medium text-brand-green-700">
                          Do:
                        </p>
                        <ul className="text-sm text-black list-disc list-inside">
                          {protocol.dos.map((item: string, idx: number) => (
                            <li key={idx}>{item}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {protocol.donts && protocol.donts.length > 0 && (
                      <div>
                        <p className="text-sm font-medium text-brand-red-700">
                          Don't:
                        </p>
                        <ul className="text-sm text-black list-disc list-inside">
                          {protocol.donts.map((item: string, idx: number) => (
                            <li key={idx}>{item}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-8 text-center">
                <p className="text-black">No protocols available</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
