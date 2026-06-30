import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Users, Clock, CheckCircle, XCircle, AlertCircle, Mail, Phone, Calendar } from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { createClient } from '@/lib/supabase/server';
import { requireAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'School Applications | Program Holder Portal',
  robots: { index: false, follow: false },
};

const PROGRAM_LABELS: Record<string, string> = {
  'cosmetology-apprenticeship':     'Cosmetology (2,000 hrs)',
  'esthetician-apprenticeship':     'Esthetician (700 hrs)',
  'nail-technician-apprenticeship': 'Nail Technician (400 hrs)',
};

const STATUS_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  pending:      { bg: 'bg-yellow-50',  text: 'text-yellow-700',  label: 'Pending' },
  submitted:    { bg: 'bg-blue-50',    text: 'text-blue-700',    label: 'Submitted' },
  under_review: { bg: 'bg-purple-50',  text: 'text-purple-700',  label: 'Under Review' },
  accepted:     { bg: 'bg-brand-green-50',   text: 'text-brand-green-700',   label: 'Accepted' },
  waitlisted:   { bg: 'bg-orange-50',  text: 'text-orange-700',  label: 'Waitlisted' },
  rejected:     { bg: 'bg-red-50',     text: 'text-red-700',     label: 'Rejected' },
  enrolled:     { bg: 'bg-emerald-50', text: 'text-emerald-700', label: 'Enrolled' },
  approved:     { bg: 'bg-brand-green-50',   text: 'text-brand-green-700',   label: 'Approved' },
};

function StatusPill({ status }: { status: string }) {
  const s = STATUS_STYLES[status] ?? { bg: 'bg-slate-50', text: 'text-slate-700', label: status };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${s.bg} ${s.text}`}>
      {s.label}
    </span>
  );
}

function fmt(iso: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default async function SchoolApplicationsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login?redirect=/program-holder/school-applications');

  const db = await requireAdminClient();

  // Verify access — must be admin/staff or a Mesmerized by Beauty program holder
  const { data: profile } = await db
    .from('profiles')
    .select('role, program_holder_id')
    .eq('id', user.id)
    .maybeSingle();

  const isAdmin = ['admin', 'super_admin', 'staff'].includes(profile?.role ?? '');

  if (!isAdmin && profile?.program_holder_id) {
    const { data: holder } = await db
      .from('program_holders')
      .select('organization_name')
      .eq('id', profile.program_holder_id)
      .maybeSingle();
    if (holder?.organization_name !== 'Mesmerized by Beauty Cosmetology Academy') {
      redirect('/program-holder/dashboard');
    }
  } else if (!isAdmin) {
    redirect('/program-holder/dashboard');
  }

  // Resolve partner_id for Mesmerized by Beauty
  const { data: partner } = await db
    .from('partners')
    .select('id')
    .eq('name', 'Mesmerized by Beauty Cosmetology Academy')
    .maybeSingle();

  if (!partner) {
    return (
      <div className="p-8 text-center text-slate-500">
        Partner record not found. Contact support.
      </div>
    );
  }

  // Fetch all applications
  const { data: applications } = await db
    .from('school_applications')
    .select('id, first_name, last_name, email, phone, city, program_interest, funding_source, status, created_at, reviewed_at, notes')
    .eq('partner_id', partner.id)
    .order('created_at', { ascending: false });

  const apps = applications ?? [];

  // Stats
  const stats = {
    total:       apps.length,
    pending:     apps.filter((a) => ['pending', 'submitted', 'under_review'].includes(a.status)).length,
    accepted:    apps.filter((a) => ['accepted', 'approved', 'enrolled'].includes(a.status)).length,
    rejected:    apps.filter((a) => a.status === 'rejected').length,
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-white border-b px-4 py-3">
        <div className="max-w-7xl mx-auto">
          <Breadcrumbs items={[
            { label: 'Portal', href: '/program-holder/dashboard' },
            { label: 'School Applications' },
          ]} />
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-900">School Applications</h1>
          <p className="text-slate-600 mt-1">Mesmerized by Beauty Cosmetology Academy — cosmetology, esthetician, and nail tech applicants</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total Applications', value: stats.total,    icon: Users,        color: 'text-slate-700' },
            { label: 'Needs Review',        value: stats.pending,  icon: Clock,        color: 'text-yellow-600' },
            { label: 'Accepted',            value: stats.accepted, icon: CheckCircle,  color: 'text-brand-green-600' },
            { label: 'Rejected',            value: stats.rejected, icon: XCircle,      color: 'text-red-500' },
          ].map((s) => (
            <div key={s.label} className="bg-white rounded-xl border p-5">
              <div className="flex items-center gap-2 mb-1">
                <s.icon className={`w-5 h-5 ${s.color}`} />
                <span className="text-xs text-slate-500">{s.label}</span>
              </div>
              <p className="text-3xl font-bold text-slate-900">{s.value}</p>
            </div>
          ))}
        </div>

        {/* Applications Table */}
        {apps.length === 0 ? (
          <div className="bg-white rounded-xl border p-12 text-center">
            <AlertCircle className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 font-medium">No applications yet.</p>
            <p className="text-slate-400 text-sm mt-1">Applications submitted at <Link href="/schools/mesmerized-by-beauty" className="text-purple-600 hover:underline">/schools/mesmerized-by-beauty</Link> will appear here.</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b">
                  <tr>
                    <th className="text-left px-4 py-3 font-semibold text-slate-700">Applicant</th>
                    <th className="text-left px-4 py-3 font-semibold text-slate-700">Program</th>
                    <th className="text-left px-4 py-3 font-semibold text-slate-700">Funding</th>
                    <th className="text-left px-4 py-3 font-semibold text-slate-700">Status</th>
                    <th className="text-left px-4 py-3 font-semibold text-slate-700">Applied</th>
                    <th className="text-left px-4 py-3 font-semibold text-slate-700">Contact</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {apps.map((app) => (
                    <tr key={app.id} className="hover:bg-slate-50 transition">
                      <td className="px-4 py-3">
                        <p className="font-medium text-slate-900">{app.first_name} {app.last_name}</p>
                        {app.city && <p className="text-xs text-slate-500">{app.city}, IN</p>}
                      </td>
                      <td className="px-4 py-3 text-slate-700">
                        {PROGRAM_LABELS[app.program_interest] ?? app.program_interest}
                      </td>
                      <td className="px-4 py-3 text-slate-600 capitalize">
                        {app.funding_source?.replace(/-/g, ' ') ?? '—'}
                      </td>
                      <td className="px-4 py-3">
                        <StatusPill status={app.status} />
                      </td>
                      <td className="px-4 py-3 text-slate-500">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          {fmt(app.created_at)}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col gap-1">
                          <a href={`mailto:${app.email}`} className="flex items-center gap-1 text-brand-blue-600 hover:underline text-xs">
                            <Mail className="w-3.5 h-3.5" /> {app.email}
                          </a>
                          {app.phone && (
                            <a href={`tel:${app.phone}`} className="flex items-center gap-1 text-slate-500 hover:text-slate-700 text-xs">
                              <Phone className="w-3.5 h-3.5" /> {app.phone}
                            </a>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
