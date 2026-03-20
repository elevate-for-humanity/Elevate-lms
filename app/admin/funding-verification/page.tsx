export const dynamic = 'force-dynamic';

import { createAdminClient } from '@/lib/supabase/admin';
import { apiRequireAdmin } from '@/lib/admin/guards';
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { NextRequest } from 'next/server';
import Link from 'next/link';
import { AlertTriangle, Clock, CheckCircle, FileText, Phone } from 'lucide-react';

interface FundingFlag {
  flag_id: string;
  flag_type: string;
  flag_reason: string;
  flagged_at: string;
  last_actioned_at: string | null;
  sla_days: number;
  sla_escalated_at: string | null;
  age_days: number;
  sla_breached: boolean;
  enrollment_id: string;
  user_id: string;
  program_slug: string;
  enrollment_state: string;
  funding_source: string;
  amount_paid_cents: number | null;
  enrolled_at: string;
  docs_received: boolean;
  last_contact_at: string | null;
  email: string | null;
  full_name: string | null;
}

function formatDate(iso: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatCents(cents: number | null) {
  if (cents == null) return '—';
  return `$${(cents / 100).toFixed(2)}`;
}

export default async function FundingVerificationQueuePage() {
  const db = createAdminClient();

  const { data: flags, error } = await db
    .from('v_funding_verification_queue')
    .select('*')
    .order('sla_breached', { ascending: false })
    .order('age_days', { ascending: false });

  if (error) {
    return (
      <div className="p-8 text-red-600">
        Failed to load funding verification queue: {error.message}
      </div>
    );
  }

  const rows = (flags || []) as FundingFlag[];
  const breached = rows.filter(r => r.sla_breached);
  const pending  = rows.filter(r => !r.sla_breached);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">

        {/* Header */}
        <div className="mb-6">
          <nav className="text-sm text-gray-500 mb-2">
            <Link href="/admin/dashboard" className="hover:text-gray-700">Admin</Link>
            {' / '}
            <span className="text-gray-900">Funding Verification Queue</span>
          </nav>
          <h1 className="text-2xl font-bold text-gray-900">Funding Verification Queue</h1>
          <p className="mt-1 text-sm text-gray-600">
            Enrollments with unconfirmed payment source. Each row requires explicit admin resolution.
            See <Link href="/docs/enrollment-funding-states" className="underline">enrollment-funding-states.md</Link> for policy.
          </p>
        </div>

        {/* Summary bar */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="text-2xl font-bold text-gray-900">{rows.length}</div>
            <div className="text-sm text-gray-500 mt-1">Total unresolved</div>
          </div>
          <div className={`rounded-lg border p-4 ${breached.length > 0 ? 'bg-red-50 border-red-200' : 'bg-white border-gray-200'}`}>
            <div className={`text-2xl font-bold ${breached.length > 0 ? 'text-red-700' : 'text-gray-900'}`}>{breached.length}</div>
            <div className="text-sm text-gray-500 mt-1">SLA breached (&gt;14 days)</div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="text-2xl font-bold text-gray-900">{rows.filter(r => r.docs_received).length}</div>
            <div className="text-sm text-gray-500 mt-1">Docs received</div>
          </div>
        </div>

        {rows.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
            <CheckCircle className="w-10 h-10 text-green-500 mx-auto mb-3" />
            <p className="text-gray-700 font-medium">No unresolved funding verification flags.</p>
            <p className="text-sm text-gray-500 mt-1">All flagged enrollments have been resolved.</p>
          </div>
        ) : (
          <>
            {/* SLA breached section */}
            {breached.length > 0 && (
              <div className="mb-8">
                <div className="flex items-center gap-2 mb-3">
                  <AlertTriangle className="w-4 h-4 text-red-600" />
                  <h2 className="text-sm font-semibold text-red-700 uppercase tracking-wide">SLA Breached — Requires Immediate Action</h2>
                </div>
                <FlagTable rows={breached} />
              </div>
            )}

            {/* Pending section */}
            {pending.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Clock className="w-4 h-4 text-yellow-600" />
                  <h2 className="text-sm font-semibold text-yellow-700 uppercase tracking-wide">Pending — Within SLA Window</h2>
                </div>
                <FlagTable rows={pending} />
              </div>
            )}
          </>
        )}

        {/* Policy note */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
          <strong>Metric note:</strong> <code className="bg-blue-100 px-1 rounded">v_enrolled_not_paid = 0</code> means no new unauthorized enrollment leakage.
          It does <em>not</em> mean all students are financially cleared.
          This queue tracks the pending_funding_verification cohort separately.
        </div>
      </div>
    </div>
  );
}

function FlagTable({ rows }: { rows: FundingFlag[] }) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <table className="min-w-full divide-y divide-gray-200 text-sm">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-3 text-left font-medium text-gray-500">Student</th>
            <th className="px-4 py-3 text-left font-medium text-gray-500">Program</th>
            <th className="px-4 py-3 text-left font-medium text-gray-500">Enrolled</th>
            <th className="px-4 py-3 text-left font-medium text-gray-500">Age</th>
            <th className="px-4 py-3 text-left font-medium text-gray-500">Funding</th>
            <th className="px-4 py-3 text-left font-medium text-gray-500">Paid</th>
            <th className="px-4 py-3 text-left font-medium text-gray-500">Docs</th>
            <th className="px-4 py-3 text-left font-medium text-gray-500">Last Contact</th>
            <th className="px-4 py-3 text-left font-medium text-gray-500">Action</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {rows.map(row => (
            <tr key={row.flag_id} className={row.sla_breached ? 'bg-red-50' : undefined}>
              <td className="px-4 py-3">
                <div className="font-medium text-gray-900">{row.full_name || '—'}</div>
                <div className="text-gray-500 text-xs">{row.email || row.user_id}</div>
              </td>
              <td className="px-4 py-3 text-gray-700">{row.program_slug}</td>
              <td className="px-4 py-3 text-gray-500">{formatDate(row.enrolled_at)}</td>
              <td className="px-4 py-3">
                <span className={`font-medium ${row.sla_breached ? 'text-red-700' : row.age_days > 7 ? 'text-yellow-700' : 'text-gray-700'}`}>
                  {row.age_days}d
                </span>
              </td>
              <td className="px-4 py-3 text-gray-500 text-xs">{row.funding_source}</td>
              <td className="px-4 py-3 text-gray-500">{formatCents(row.amount_paid_cents)}</td>
              <td className="px-4 py-3">
                {row.docs_received
                  ? <span className="inline-flex items-center gap-1 text-green-700"><FileText className="w-3 h-3" /> Yes</span>
                  : <span className="text-gray-400">No</span>}
              </td>
              <td className="px-4 py-3 text-gray-500">
                {row.last_contact_at
                  ? <span className="inline-flex items-center gap-1"><Phone className="w-3 h-3" />{formatDate(row.last_contact_at)}</span>
                  : <span className="text-red-500">None</span>}
              </td>
              <td className="px-4 py-3">
                <Link
                  href={`/admin/applications?user=${row.user_id}&program=${row.program_slug}`}
                  className="text-blue-600 hover:underline text-xs font-medium"
                >
                  Review →
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
