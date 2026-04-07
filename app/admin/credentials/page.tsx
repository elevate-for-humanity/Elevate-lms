import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { Shield, Plus, ExternalLink, Award, BookOpen, Users } from 'lucide-react';
import { mapCredentialRow, type RawCredentialRow, type CredentialRecord } from '@/lib/domain';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Credential Registry | Admin' };

const LANE_LABELS: Record<string, { label: string; color: string }> = {
  elevate_issued:     { label: 'Elevate Issued',     color: 'bg-brand-blue-100 text-brand-blue-800' },
  elevate_proctored:  { label: 'Elevate Proctored',  color: 'bg-purple-100 text-purple-800' },
  partner_delivered:  { label: 'Partner Delivered',  color: 'bg-slate-100 text-slate-600' },
};

const STACK_LABELS: Record<string, string> = {
  workforce_readiness: 'Workforce Readiness',
  customer_service:    'Customer Service & Retail',
  hvac_trades:         'Technical & Skilled Trades',
  workkeys:            'WorkKeys Assessment',
  digital_workforce:   'Digital Workforce Skills',
};

export default async function CredentialRegistryPage() {
  const supabase = await createClient();
  const db = createAdminClient();


  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (!profile || !['admin','super_admin','org_admin','staff'].includes(profile.role)) {
    redirect('/unauthorized');
  }

  const { data: rawCredentials } = await supabase
    .from('credential_registry')
    .select('*')
    .order('credential_stack')
    .order('stack_level')
    .order('name');

  const credentials: CredentialRecord[] = (rawCredentials ?? []).map(
    (r) => mapCredentialRow(r as RawCredentialRow)
  );

  // Group by stack
  const stacks: Record<string, CredentialRecord[]> = {};
  for (const c of credentials) {
    const stack = c.credentialStack ?? 'other';
    if (!stacks[stack]) stacks[stack] = [];
    stacks[stack].push(c);
  }

  const total = credentials.length;
  const elevateIssued = credentials.filter(c => c.issuerType === 'elevate_issued').length;
  const elevateProctored = credentials.filter(c => c.issuerType === 'elevate_proctored').length;
  const partnerDelivered = credentials.filter(c => c.issuerType === 'partner_delivered').length;

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <Breadcrumbs items={[
          { label: 'Admin', href: '/admin' },
          { label: 'Credential Registry' },
        ]} />

        <div className="mt-6 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <Shield className="w-6 h-6 text-brand-blue-600" />
              Credential Registry
            </h1>
            <p className="text-slate-500 mt-1 text-sm">
              Authoritative list of all credentials Elevate issues, proctors, or prepares learners for.
            </p>
          </div>
          <Link
            href="/admin/credentials/new"
            className="flex items-center gap-2 px-4 py-2 bg-brand-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-brand-blue-700"
          >
            <Plus className="w-4 h-4" />
            Add Credential
          </Link>
        </div>

        {/* Summary stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
          {[
            { label: 'Total Credentials', value: total, color: 'text-slate-900' },
            { label: 'Elevate Issued', value: elevateIssued, color: 'text-brand-blue-700' },
            { label: 'Elevate Proctored', value: elevateProctored, color: 'text-purple-700' },
            { label: 'Partner Delivered', value: partnerDelivered, color: 'text-slate-500' },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-xl border border-slate-200 p-4">
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-slate-500 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Three-lane legend */}
        <div className="mt-6 bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Authority Lanes</p>
          <div className="flex flex-wrap gap-4 text-sm">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-brand-blue-100 text-brand-blue-800">Elevate Issued</span>
              <span className="text-slate-500">Elevate owns curriculum, assessment, and certificate</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">Elevate Proctored</span>
              <span className="text-slate-500">National body issues; Elevate administers the exam</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600">Partner Delivered</span>
              <span className="text-slate-500">Vendor/manufacturer system; Elevate prepares only</span>
            </div>
          </div>
        </div>

        {/* Credentials by stack */}
        <div className="mt-6 space-y-6">
          {Object.entries(stacks).map(([stack, creds]) => (
            <div key={stack} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <div className="px-5 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                <h2 className="font-semibold text-slate-800 text-sm">
                  {STACK_LABELS[stack] ?? stack}
                </h2>
                <span className="text-xs text-slate-400">{creds.length} credential{creds.length !== 1 ? 's' : ''}</span>
              </div>
              <div className="divide-y divide-slate-100">
                {creds.map((c) => {
                  const lane = LANE_LABELS[c.issuerType] ?? { label: c.issuerType, color: 'bg-slate-100 text-slate-600' };
                  return (
                    <div key={c.id} className="flex items-center gap-4 px-5 py-3 hover:bg-slate-50 transition-colors">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${lane.color}`}>
                            {lane.label}
                          </span>
                          {c.abbreviation && (
                            <span className="text-xs font-mono text-slate-400">{c.abbreviation}</span>
                          )}
                          {c.stackLevel && (
                            <span className="text-xs text-slate-400 capitalize">{c.stackLevel}</span>
                          )}
                          {c.metadata?.protected && (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-red-50 text-red-700 font-medium flex items-center gap-1">
                              <Shield className="w-3 h-3" /> Protected
                            </span>
                          )}
                          {c.wioaEligible && (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-green-50 text-green-700 font-medium">WIOA</span>
                          )}
                        </div>
                        <p className="text-sm font-semibold text-slate-900 mt-0.5">{c.name}</p>
                        <p className="text-xs text-slate-400">
                          Issued by: {c.issuingAuthority}
                          {c.requiresExam && ` · ${c.examType ?? 'exam'} required`}
                          {c.renewalPeriodMonths && ` · Renews every ${c.renewalPeriodMonths}mo`}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {!c.isPublished && (
                          <span className="text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">Unpublished</span>
                        )}
                        <Link
                          href={`/admin/credentials/${c.id}`}
                          className="text-xs text-brand-blue-600 hover:underline px-2 py-1 rounded hover:bg-brand-blue-50"
                        >
                          Edit
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <p className="text-xs text-slate-400 text-center mt-8">
          Credential registry enforces proctor-authority rules across the program builder and AI course generator.
        </p>
      </div>
    </div>
  );
}
