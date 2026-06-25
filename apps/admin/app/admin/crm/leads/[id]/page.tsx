import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { requireRole } from '@/lib/auth/require-role';
import { requireAdminClient } from '@/lib/supabase/admin';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { ArrowLeft, Mail, Phone, Calendar, Tag, User } from 'lucide-react';

export const dynamic = 'force-dynamic';
export const revalidate = 60;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
}

function Field({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-0.5">{label}</p>
      <p className="text-sm text-slate-900">{value || '—'}</p>
    </div>
  );
}

export default async function LeadDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireRole(['admin', 'staff']);
  const { id } = await params;
  const db = await requireAdminClient();

  const { data: lead, error } = await db
    .from('leads')
    .select('id, first_name, last_name, full_name, email, phone, status, stage, source, program_interest, notes, created_at, updated_at, last_contacted_at, assigned_to, funding_interest, state')
    .eq('id', id)
    .maybeSingle();

  if (error || !lead) notFound();

  const name = lead.full_name || [lead.first_name, lead.last_name].filter(Boolean).join(' ') || lead.email || 'Unknown Lead';

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-4 py-4">
        <Breadcrumbs
          items={[
            { label: 'Admin', href: '/admin' },
            { label: 'CRM', href: '/admin/crm' },
            { label: 'Leads', href: '/admin/crm/leads' },
            { label: name },
          ]}
        />
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="flex items-center gap-4 mb-6">
          <Link href="/admin/crm/leads" className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
            <ArrowLeft className="w-4 h-4 text-slate-600" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{name}</h1>
            <p className="text-sm text-slate-500 mt-0.5">
              Lead · Created {new Date(lead.created_at).toLocaleDateString()}
            </p>
          </div>
          <div className="ml-auto">
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
              lead.status === 'closed_won' ? 'bg-green-100 text-green-800' :
              lead.status === 'closed_lost' ? 'bg-red-100 text-red-800' :
              'bg-amber-100 text-amber-800'
            }`}>
              {lead.status ?? 'No status'}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Contact Info */}
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h2 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
              <User className="w-4 h-4 text-slate-400" /> Contact Information
            </h2>
            <div className="space-y-4">
              <Field label="Full Name" value={name} />
              <Field label="Email" value={lead.email} />
              <Field label="Phone" value={lead.phone} />
              <Field label="State" value={lead.state} />
            </div>
          </div>

          {/* Lead Details */}
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h2 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Tag className="w-4 h-4 text-slate-400" /> Lead Details
            </h2>
            <div className="space-y-4">
              <Field label="Program Interest" value={lead.program_interest} />
              <Field label="Funding Interest" value={lead.funding_interest} />
              <Field label="Source" value={lead.source} />
              <Field label="Stage" value={lead.stage} />
              <Field label="Assigned To" value={lead.assigned_to} />
            </div>
          </div>

          {/* Activity */}
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h2 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-slate-400" /> Activity
            </h2>
            <div className="space-y-4">
              <Field label="Created" value={new Date(lead.created_at).toLocaleString()} />
              <Field label="Last Updated" value={lead.updated_at ? new Date(lead.updated_at).toLocaleString() : null} />
              <Field label="Last Contacted" value={lead.last_contacted_at ? new Date(lead.last_contacted_at).toLocaleString() : null} />
            </div>
          </div>

          {/* Notes */}
          {lead.notes && (
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <h2 className="text-sm font-bold text-slate-900 mb-3">Notes</h2>
              <p className="text-sm text-slate-700 whitespace-pre-wrap">{lead.notes}</p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3 mt-6">
          {lead.email && (
            <a
              href={`mailto:${lead.email}`}
              className="inline-flex items-center gap-2 px-4 py-2 bg-brand-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-brand-blue-700 transition-colors"
            >
              <Mail className="w-4 h-4" /> Send Email
            </a>
          )}
          {lead.phone && (
            <a
              href={`tel:${lead.phone}`}
              className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 text-sm font-semibold rounded-lg hover:bg-slate-50 transition-colors"
            >
              <Phone className="w-4 h-4" /> Call
            </a>
          )}
          <Link
            href="/admin/crm/leads"
            className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 text-sm font-semibold rounded-lg hover:bg-slate-50 transition-colors ml-auto"
          >
            Back to Leads
          </Link>
        </div>
      </div>
    </div>
  );
}
