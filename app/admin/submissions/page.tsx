import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import {
  Building2, Database, Paperclip, BookOpen, FileText,
  Award, ShieldCheck, Users, AlertTriangle, ScrollText,
  DollarSign, ArrowRight, Target,
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Submissions OS | Admin | Elevate for Humanity',
  description: 'External Submissions Operating System — grants, contracts, bids, vendor registrations.',
};

export const dynamic = 'force-dynamic';

const SCREENS = [
  {
    title: 'Opportunities',
    description: 'Pipeline of grants, RFPs, contracts, and bids — ingest from URL, profile, and track status.',
    href: '/admin/submissions/opportunities',
    icon: Target,
    color: 'bg-brand-blue-50 text-brand-blue-600',
  },
  {
    title: 'Org Profile',
    description: 'Legal name, EIN, UEI, SAM status, authorized signatory, address.',
    href: '/admin/submissions/org',
    icon: Building2,
    color: 'bg-brand-blue-50 text-brand-blue-600',
  },
  {
    title: 'Facts Vault',
    description: 'Approved atomic facts used as merge-field sources in every generated document.',
    href: '/admin/submissions/facts',
    icon: Database,
    color: 'bg-purple-50 text-purple-600',
  },
  {
    title: 'Attachment Library',
    description: 'W-9, insurance certs, audit, board list, SAM proof, capability statement.',
    href: '/admin/submissions/attachments',
    icon: Paperclip,
    color: 'bg-amber-50 text-amber-600',
  },
  {
    title: 'Content Library',
    description: 'Approved prose blocks — mission, org overview, program summaries, equity statement.',
    href: '/admin/submissions/content',
    icon: BookOpen,
    color: 'bg-green-50 text-green-600',
  },
  {
    title: 'Document Templates',
    description: 'Branded letterhead layouts with merge fields for every document type.',
    href: '/admin/submissions/templates',
    icon: FileText,
    color: 'bg-sky-50 text-sky-600',
  },
  {
    title: 'Past Performance',
    description: 'Approved project history for capability statements and RFP responses.',
    href: '/admin/submissions/past-performance',
    icon: Award,
    color: 'bg-emerald-50 text-emerald-600',
  },
  {
    title: 'Compliance Records',
    description: 'Licenses, certifications, SAM registration, ETPL listing, insurance.',
    href: '/admin/submissions/compliance',
    icon: ShieldCheck,
    color: 'bg-rose-50 text-rose-600',
  },
  {
    title: 'Partner Entities',
    description: 'Approved subcontractors, MOU partners, co-applicants, letter-of-support providers.',
    href: '/admin/submissions/partners',
    icon: Users,
    color: 'bg-indigo-50 text-indigo-600',
  },
  {
    title: 'Exception Queue',
    description: 'Unresolved blockers — missing data, required reviews, signature requests.',
    href: '/admin/submissions/exceptions',
    icon: AlertTriangle,
    color: 'bg-orange-50 text-orange-600',
  },
  {
    title: 'Audit Log',
    description: 'Permanent record of every submission run, inserted value, and approval.',
    href: '/admin/submissions/audit',
    icon: ScrollText,
    color: 'bg-slate-100 text-slate-600',
  },
];

export default async function SubmissionsOSPage() {
  const supabase = await createClient();
  const db = createAdminClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login?redirect=/admin/submissions');

  const { data: profile } = await db
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!profile || !['admin', 'super_admin', 'staff'].includes(profile.role)) {
    redirect('/admin');
  }

  // Load summary counts from SOS tables (graceful — tables may not exist yet)
  const [
    { count: factsCount },
    { count: attachmentsCount },
    { count: contentCount },
    { count: exceptionsCount },
    { count: oppsCount },
  ] = await Promise.all([
    db.from('sos_organization_facts').select('*', { count: 'exact', head: true }).eq('status', 'approved'),
    db.from('sos_attachment_library').select('*', { count: 'exact', head: true }).eq('status', 'approved'),
    db.from('sos_content_blocks').select('*', { count: 'exact', head: true }).eq('status', 'approved'),
    db.from('sos_review_tasks').select('*', { count: 'exact', head: true }).eq('status', 'open'),
    db.from('sos_opportunities').select('*', { count: 'exact', head: true }).not('status', 'in', '("submitted","archived")'),
  ]);

  // Also load legacy grant counts
  const { count: grantOppsCount } = await db
    .from('grant_opportunities')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'open');

  const { count: grantAppsCount } = await db
    .from('grant_applications')
    .select('*', { count: 'exact', head: true })
    .in('status', ['draft', 'under_review']);

  const needsMigration = factsCount === null;

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-6xl mx-auto px-4 py-8">

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-brand-blue-600 rounded-xl flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">External Submissions OS</h1>
              <p className="text-slate-500 text-sm">Grants · Contracts · Bids · Vendor Registrations · Applications</p>
            </div>
          </div>
        </div>

        {/* Migration warning */}
        {needsMigration && (
          <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-amber-900">Database migrations pending</p>
              <p className="text-sm text-amber-700 mt-1">
                Apply migrations <code className="font-mono text-xs bg-amber-100 px-1 rounded">20260527000005</code> through{' '}
                <code className="font-mono text-xs bg-amber-100 px-1 rounded">20260527000010</code> in the Supabase Dashboard SQL Editor to activate the Submissions OS.
              </p>
            </div>
          </div>
        )}

        {/* Stats strip */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-8">
          {[
            { label: 'Active Opportunities', value: (oppsCount ?? 0) + (grantOppsCount ?? 0), icon: DollarSign, color: 'text-brand-blue-600' },
            { label: 'Grant Applications', value: grantAppsCount ?? 0, icon: FileText, color: 'text-purple-600' },
            { label: 'Approved Facts', value: factsCount ?? 0, icon: Database, color: 'text-green-600' },
            { label: 'Approved Attachments', value: attachmentsCount ?? 0, icon: Paperclip, color: 'text-amber-600' },
            { label: 'Open Exceptions', value: exceptionsCount ?? 0, icon: AlertTriangle, color: exceptionsCount ? 'text-red-600' : 'text-slate-400' },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-xl border border-slate-200 p-4">
              <s.icon className={`w-5 h-5 ${s.color} mb-2`} />
              <p className="text-2xl font-black text-slate-900">{s.value}</p>
              <p className="text-xs text-slate-500 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Legacy grants quick-links */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 mb-8">
          <h2 className="font-semibold text-slate-900 text-sm mb-3">Grant Management (Legacy)</h2>
          <div className="flex flex-wrap gap-3">
            {[
              { label: 'Overview', href: '/admin/grants' },
              { label: 'Opportunity Inbox', href: '/admin/grants/intake' },
              { label: 'New Opportunity', href: '/admin/grants/new' },
              { label: 'Workflow', href: '/admin/grants/workflow' },
              { label: 'Submissions Log', href: '/admin/grants/submissions' },
              { label: 'Revenue Tracking', href: '/admin/grants/revenue' },
            ].map(l => (
              <Link
                key={l.href}
                href={l.href}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700 hover:bg-brand-blue-50 hover:border-brand-blue-300 hover:text-brand-blue-700 transition"
              >
                {l.label} <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            ))}
          </div>
        </div>

        {/* Submissions OS screens grid */}
        <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-4">
          Submissions OS — Data Vault & Controls
        </h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {SCREENS.map(screen => {
            const Icon = screen.icon;
            return (
              <Link
                key={screen.href}
                href={screen.href}
                className="bg-white rounded-xl border border-slate-200 p-5 hover:border-brand-blue-300 hover:shadow-sm transition group"
              >
                <div className="flex items-start gap-3">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${screen.color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-900 text-sm group-hover:text-brand-blue-700 transition">
                      {screen.title}
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{screen.description}</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-brand-blue-500 flex-shrink-0 mt-0.5 transition" />
                </div>
              </Link>
            );
          })}
        </div>

        {/* Build order reminder */}
        <div className="mt-8 bg-slate-900 rounded-xl p-5 text-slate-300 text-xs leading-relaxed">
          <p className="font-semibold text-white mb-2">System Rule</p>
          <p>
            Only fill and submit information traceable to approved organizational facts, approved attachments, or approved content blocks.
            If any required item involves missing data, judgment, legal attestation, signature, budget commitment, or custom narrative
            beyond approved content — <span className="text-amber-400 font-semibold">halt and create a review task</span> instead of inventing an answer.
          </p>
        </div>

      </div>
    </div>
  );
}
