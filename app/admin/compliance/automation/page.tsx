import { Metadata } from 'next';
import { requireRole } from '@/lib/auth/require-role';
import { requireAdminClient } from '@/lib/supabase/admin';
import Link from 'next/link';
import {
  ChevronRight, FileText, Upload, Search, PenTool,
  Download, ShieldCheck, Briefcase, ArrowRight, CheckCircle2,
  Clock, AlertTriangle,
} from 'lucide-react';

export const dynamic = 'force-dynamic';
export const revalidate = 60; // deploy-trigger: 20260518173947
export const metadata: Metadata = {
  title: 'Compliance Automation | Admin | Elevate For Humanity',
};

export default async function ComplianceAutomationPage() {
  await requireRole(['admin', 'super_admin', 'staff']);
  const db = await requireAdminClient();

  const [
    { count: contractCount },
    { count: pendingContracts },
    { count: grantAppCount },
    { count: pendingGrants },
    { count: docCount },
    { count: pendingDocs },
  ] = await Promise.all([
    db.from('contract_templates').select('*', { count: 'exact', head: true }),
    db.from('contract_templates').select('*', { count: 'exact', head: true }).in('status', ['uploaded','extracting','extracted','prefilling','review']),
    db.from('grant_applications').select('*', { count: 'exact', head: true }),
    db.from('grant_applications').select('*', { count: 'exact', head: true }).in('status', ['draft','in_review']),
    db.from('documents').select('*', { count: 'exact', head: true }),
    db.from('documents').select('*', { count: 'exact', head: true }).in('extraction_status', ['pending','processing']),
  ]);

  const PIPELINE_STEPS = [
    { step: '1', label: 'Upload Template', desc: 'Upload state/agency contract, grant form, or MOU', icon: Upload, href: '/admin/contracts', color: 'bg-violet-50 text-violet-600' },
    { step: '2', label: 'Extract Fields', desc: 'AI detects all blank fields, checkboxes, and signature lines', icon: Search, href: '/admin/contracts', color: 'bg-blue-50 text-blue-600' },
    { step: '3', label: 'Prefill from Org Profile', desc: 'EIN, UEI, CAGE, address, signatory auto-populated from verified facts', icon: ShieldCheck, href: '/admin/settings/organization-profile', color: 'bg-emerald-50 text-emerald-600' },
    { step: '4', label: 'Review & Approve', desc: 'Admin reviews every field — AI narrative flagged for approval', icon: CheckCircle2, href: '/admin/contracts', color: 'bg-amber-50 text-amber-600' },
    { step: '5', label: 'Sign', desc: 'Draw or typed signature with legal audit trail', icon: PenTool, href: '/admin/signatures', color: 'bg-rose-50 text-rose-600' },
    { step: '6', label: 'Export', desc: 'Generate signed PDF or DOCX for submission', icon: Download, href: '/admin/contracts', color: 'bg-slate-50 text-slate-600' },
  ];

  const MODULES = [
    {
      title: 'Contracts & Templates',
      desc: 'State agency contracts, MOUs, vendor registrations, RFP responses',
      href: '/admin/contracts',
      icon: FileText,
      stats: [
        { label: 'Total', value: contractCount ?? 0 },
        { label: 'In Progress', value: pendingContracts ?? 0, warn: (pendingContracts ?? 0) > 0 },
      ],
    },
    {
      title: 'Grant Applications',
      desc: 'Federal, state, and private grant applications with org prefill',
      href: '/admin/grants/applications',
      icon: Briefcase,
      stats: [
        { label: 'Total', value: grantAppCount ?? 0 },
        { label: 'Draft/Review', value: pendingGrants ?? 0, warn: (pendingGrants ?? 0) > 0 },
      ],
    },
    {
      title: 'Grant Opportunities',
      desc: 'SAM.gov search, opportunity tracking, deadline alerts',
      href: '/admin/grants/opportunities',
      icon: Search,
      stats: [],
    },
    {
      title: 'Document Intelligence',
      desc: 'Upload, extract, and map fields from any document',
      href: '/admin/documents',
      icon: Upload,
      stats: [
        { label: 'Total', value: docCount ?? 0 },
        { label: 'Pending', value: pendingDocs ?? 0, warn: (pendingDocs ?? 0) > 0 },
      ],
    },
    {
      title: 'Signatures',
      desc: 'Digital signature management and audit trail',
      href: '/admin/signatures',
      icon: PenTool,
      stats: [],
    },
    {
      title: 'Organization Profile',
      desc: 'Legal name, EIN, UEI, CAGE, SAM status, authorized signatory',
      href: '/admin/settings/organization-profile',
      icon: ShieldCheck,
      stats: [],
    },
    {
      title: 'Submissions OS',
      desc: 'Org profile, facts vault, content library, past performance, templates',
      href: '/admin/submissions',
      icon: CheckCircle2,
      stats: [],
    },
    {
      title: 'MOU Management',
      desc: 'Partner MOUs, countersignatures, and distribution',
      href: '/admin/mou',
      icon: FileText,
      stats: [],
    },
  ];

  return (
    <div className="min-h-screen bg-white">
      <div className="bg-white border-b border-slate-200 px-6 py-5">
        <nav className="flex items-center gap-1.5 text-xs text-slate-500 mb-3">
          <Link href="/admin/dashboard" className="hover:text-slate-700">Admin</Link>
          <ChevronRight className="w-3 h-3" />
          <Link href="/admin/compliance" className="hover:text-slate-700">Compliance</Link>
          <ChevronRight className="w-3 h-3" />
          <span className="text-slate-900 font-medium">Automation</span>
        </nav>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Grant & Contract Automation Suite</h1>
            <p className="text-sm text-slate-500 mt-1">
              Upload → Extract → Prefill → Review → Sign → Export. Powered by verified org data.
            </p>
          </div>
          <div className="flex gap-2">
            <Link href="/admin/contracts" className="px-4 py-2 bg-violet-600 text-white rounded-xl text-sm font-semibold hover:bg-violet-700 transition-colors">
              New Contract
            </Link>
            <Link href="/admin/grants/applications/new" className="px-4 py-2 bg-slate-900 text-white rounded-xl text-sm font-semibold hover:bg-slate-800 transition-colors">
              New Application
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-10">

        {/* Pipeline */}
        <div>
          <h2 className="text-sm font-semibold text-slate-700 mb-4">Automation Pipeline</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {PIPELINE_STEPS.map((s) => {
              const Icon = s.icon;
              return (
                <Link key={s.step} href={s.href}
                  className="bg-white rounded-xl border border-slate-200 p-4 hover:border-violet-300 hover:shadow-sm transition-all group">
                  <div className={`w-8 h-8 rounded-lg ${s.color} flex items-center justify-center mb-3`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="text-xs font-bold text-slate-400 mb-1">Step {s.step}</div>
                  <div className="text-sm font-semibold text-slate-900 mb-1">{s.label}</div>
                  <div className="text-xs text-slate-500 leading-snug">{s.desc}</div>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Modules */}
        <div>
          <h2 className="text-sm font-semibold text-slate-700 mb-4">All Modules</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {MODULES.map((m) => {
              const Icon = m.icon;
              return (
                <Link key={m.title} href={m.href}
                  className="bg-white rounded-xl border border-slate-200 p-5 hover:border-slate-300 hover:shadow-sm transition-all group">
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center">
                      <Icon className="w-4 h-4 text-slate-600" />
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-violet-500 transition-colors" />
                  </div>
                  <h3 className="font-semibold text-slate-900 text-sm mb-1">{m.title}</h3>
                  <p className="text-xs text-slate-500 leading-snug mb-3">{m.desc}</p>
                  {m.stats.length > 0 && (
                    <div className="flex gap-3">
                      {m.stats.map(stat => (
                        <div key={stat.label} className="text-center">
                          <div className={`text-lg font-bold tabular-nums ${stat.warn ? 'text-amber-600' : 'text-slate-900'}`}>
                            {stat.value}
                          </div>
                          <div className="text-xs text-slate-400">{stat.label}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </Link>
              );
            })}
          </div>
        </div>

        {/* Org profile status */}
        <div className="bg-violet-50 border border-violet-200 rounded-2xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-violet-900 text-sm">Organization Profile — Prefill Source of Truth</h3>
              <p className="text-xs text-violet-700 mt-1">
                EIN, UEI, CAGE code, SAM status, authorized signatory, and address power all autofill.
                Keep this current to ensure accurate contract and grant prefill.
              </p>
            </div>
            <Link href="/admin/settings/organization-profile"
              className="px-4 py-2 bg-violet-600 text-white rounded-lg text-sm font-medium hover:bg-violet-700 transition-colors whitespace-nowrap">
              Manage Profile
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}
