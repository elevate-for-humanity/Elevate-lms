import { Metadata } from 'next';
import { requireRole } from '@/lib/auth/require-role';
import { requireAdminClient } from '@/lib/supabase/admin';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import Link from 'next/link';
import { CheckCircle, Clock, FileText, ShieldCheck, BookOpen } from 'lucide-react';

export const dynamic = 'force-dynamic';
export const revalidate = 60;

export const metadata: Metadata = {
  title: 'Program Holder Acknowledgements | Admin | Elevate For Humanity',
  description: 'Review handbook and rights acknowledgements submitted by program holders.',
};

interface Acknowledgement {
  id: string;
  user_id: string;
  document_type: string | null;
  acknowledged_at: string;
  ip_address: string | null;
  created_at: string;
}

interface HandbookAck {
  id: string;
  user_id: string;
  handbook_version: string;
  acknowledged_at: string;
  ip_address: string | null;
  attendance_policy_ack: boolean | null;
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export default async function ProgramHolderAcknowledgementsPage() {
  await requireRole(['admin', 'staff']);
  const db = await requireAdminClient();

  const [acksRes, handbookRes, holdersRes] = await Promise.all([
    db
      .from('program_holder_acknowledgements')
      .select('id, user_id, document_type, acknowledged_at, ip_address, created_at')
      .order('acknowledged_at', { ascending: false })
      .limit(200),
    db
      .from('handbook_acknowledgments')
      .select('id, user_id, handbook_version, acknowledged_at, ip_address, attendance_policy_ack')
      .order('acknowledged_at', { ascending: false })
      .limit(200),
    db.from('program_holders').select('user_id, organization_name, contact_name, contact_email'),
  ]);

  const acks: Acknowledgement[] = acksRes.data ?? [];
  const handbookAcks: HandbookAck[] = handbookRes.data ?? [];
  const holders = holdersRes.data ?? [];

  const holderMap = new Map<string, any>();
  for (const h of holders) {
    if (h.user_id) holderMap.set(h.user_id, h);
  }

  const today = new Date().toDateString();
  const acksToday = acks.filter((a) => new Date(a.acknowledged_at).toDateString() === today).length;
  const handbookToday = handbookAcks.filter(
    (a) => new Date(a.acknowledged_at).toDateString() === today,
  ).length;
  const byType = new Map<string, number>();
  for (const a of acks) {
    const k = a.document_type ?? 'unknown';
    byType.set(k, (byType.get(k) ?? 0) + 1);
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs
          items={[
            { label: 'Admin', href: '/admin' },
            { label: 'Program Holders', href: '/admin/program-holders' },
            { label: 'Acknowledgements' },
          ]}
        />
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8 space-y-10">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
            <ShieldCheck className="w-6 h-6 text-green-700" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Program Holder Acknowledgements</h1>
            <p className="text-sm text-slate-500">
              Handbook and rights acknowledgements submitted by program holders
            </p>
          </div>
          <div className="ml-auto">
            <Link
              href="/admin/program-holders"
              className="text-sm text-brand-blue-600 hover:underline"
            >
              ← All Program Holders
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {[
            {
              label: 'Total Acknowledgements',
              value: acks.length,
              icon: CheckCircle,
              color: 'text-green-600',
            },
            {
              label: 'Acknowledged Today',
              value: acksToday + handbookToday,
              icon: Clock,
              color: 'text-amber-600',
            },
            {
              label: 'Handbook Acks',
              value: handbookAcks.length,
              icon: BookOpen,
              color: 'text-blue-600',
            },
            {
              label: 'Document Types',
              value: byType.size,
              icon: FileText,
              color: 'text-slate-600',
            },
          ].map((s) => (
            <div key={s.label} className="bg-white rounded-xl border shadow-sm p-6">
              <div className="flex items-center gap-2 mb-2">
                <s.icon className={`w-5 h-5 ${s.color}`} />
                <p className="text-sm text-slate-500">{s.label}</p>
              </div>
              <p className={`text-3xl font-bold ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* Acknowledgements table */}
        <section>
          <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-green-600" />
            Handbook & Rights Acknowledgements
            <span className="ml-2 text-xs font-medium bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">
              {acks.length}
            </span>
          </h2>
          {acks.length === 0 ? (
            <div className="rounded-xl border bg-slate-50 p-8 text-center text-sm text-slate-500">
              No acknowledgements on record yet.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border shadow-sm">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b">
                  <tr>
                    {['Organization', 'Contact', 'Document Type', 'Acknowledged', 'IP'].map((h) => (
                      <th
                        key={h}
                        className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {acks.map((a) => {
                    const holder = holderMap.get(a.user_id);
                    return (
                      <tr key={a.id} className="hover:bg-slate-50">
                        <td className="px-4 py-3 font-medium text-slate-900">
                          {holder?.organization_name ?? (
                            <span className="text-slate-400 text-xs font-mono">
                              {a.user_id?.slice(0, 8)}…
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-slate-600">
                          <p>{holder?.contact_name ?? '—'}</p>
                          <p className="text-xs text-slate-400">{holder?.contact_email ?? ''}</p>
                        </td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-green-100 text-green-700">
                            <CheckCircle className="w-3 h-3" />
                            {(a.document_type ?? 'unknown').replace(/_/g, ' ')}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-500 text-xs">
                          {fmtDate(a.acknowledged_at)}
                        </td>
                        <td className="px-4 py-3 text-slate-400 text-xs font-mono">
                          {a.ip_address ?? '—'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Handbook Acknowledgements */}
        <section>
          <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-blue-600" />
            Enterprise Handbook Acknowledgements
            <span className="ml-2 text-xs font-medium bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">
              {handbookAcks.length}
            </span>
          </h2>
          {handbookAcks.length === 0 ? (
            <div className="rounded-xl border bg-slate-50 p-8 text-center text-sm text-slate-500">
              No handbook acknowledgements on record yet.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border shadow-sm">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b">
                  <tr>
                    {['User', 'Handbook Version', 'Attendance Policy', 'Acknowledged', 'IP'].map(
                      (h) => (
                        <th
                          key={h}
                          className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide"
                        >
                          {h}
                        </th>
                      ),
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {handbookAcks.map((a) => {
                    const holder = holderMap.get(a.user_id);
                    return (
                      <tr key={a.id} className="hover:bg-slate-50">
                        <td className="px-4 py-3">
                          <p className="font-medium text-slate-900">
                            {holder?.organization_name ?? '—'}
                          </p>
                          <p className="text-xs font-mono text-slate-400">
                            {a.user_id?.slice(0, 8)}…
                          </p>
                        </td>
                        <td className="px-4 py-3 text-slate-700">{a.handbook_version}</td>
                        <td className="px-4 py-3">
                          {a.attendance_policy_ack ? (
                            <span className="inline-flex items-center gap-1 text-xs text-green-700">
                              <CheckCircle className="w-3 h-3" /> Acknowledged
                            </span>
                          ) : (
                            <span className="text-slate-400 text-xs">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-slate-500 text-xs">
                          {fmtDate(a.acknowledged_at)}
                        </td>
                        <td className="px-4 py-3 text-slate-400 text-xs font-mono">
                          {a.ip_address ?? '—'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
