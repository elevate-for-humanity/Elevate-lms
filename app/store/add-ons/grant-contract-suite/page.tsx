import { Metadata } from 'next';
import Link from 'next/link';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import {
  Upload, Search, ShieldCheck, PenTool, Download, ArrowRight, FileText, Briefcase, Sparkles,
} from 'lucide-react';

export const dynamic = 'force-static'; // deploy-trigger: 20260518174229

export const metadata: Metadata = {
  title: 'Grant & Contract Automation Suite | Elevate Store',
  description: 'Upload, extract, prefill, sign, and export state contracts and grant applications — powered by verified org data.',
  alternates: { canonical: 'https://www.elevateforhumanity.org/store/add-ons/grant-contract-suite' },
};

const PIPELINE = [
  { icon: Upload,       step: '1', label: 'Upload',   desc: 'Upload any state/agency contract, grant form, or MOU (PDF, DOCX, scanned)' },
  { icon: Search,       step: '2', label: 'Extract',  desc: 'AI detects all blank fields, checkboxes, and signature lines automatically' },
  { icon: ShieldCheck,  step: '3', label: 'Prefill',  desc: 'EIN, UEI, CAGE, SAM status, address, and signatory filled from verified org profile' },
  { icon: ShieldCheck,  step: '4', label: 'Review',   desc: 'Admin approves every field — AI narrative flagged, exact facts never invented' },
  { icon: PenTool,      step: '5', label: 'Sign',     desc: 'Draw or typed signature with legal audit trail and timestamp' },
  { icon: Download,     step: '6', label: 'Export',   desc: 'Generate signed PDF or DOCX ready for submission' },
];

const FEATURES = [
  'Upload state/agency contracts, grant forms, MOUs, RFPs',
  'AI field extraction — PDF, DOCX, scanned images via OCR',
  'Auto-prefill from org profile — EIN, UEI, CAGE, SAM status',
  'Humanized narrative generation in workforce/grant language',
  'Missing-field detection — flags gaps, never invents facts',
  'Admin approval required before any field is exported',
  'Draw or typed digital signatures with audit trail',
  'Export signed PDF and DOCX',
  'Full audit log — actor, timestamp, before/after values',
  'SAM.gov opportunity search and import',
];

export default function GrantContractSuitePage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: 'Store', href: '/store' }, { label: 'Add-ons', href: '/store/add-ons' }, { label: 'Grant & Contract Suite' }]} />
      </div>

      {/* Hero */}
      <section className="bg-gradient-to-br from-violet-950 to-slate-900 text-white py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-violet-800/50 text-violet-200 text-xs font-semibold px-3 py-1.5 rounded-full mb-6">
            <Briefcase className="w-3.5 h-3.5" /> Operations & Compliance Automation
          </div>
          <h1 className="text-4xl md:text-5xl font-black mb-6 leading-tight">
            Grant & Contract<br />Automation Suite
          </h1>
          <p className="text-lg text-slate-300 max-w-2xl mx-auto mb-10">
            Upload any state agency contract or grant form. Extract fields. Prefill from your verified org profile.
            Review, sign, and export — all in one audited pipeline.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/admin/compliance/automation"
              className="inline-flex items-center gap-2 px-6 py-3 bg-violet-500 hover:bg-violet-400 text-white font-semibold rounded-xl transition-colors">
              Open in Admin <ArrowRight className="w-4 h-4" />
            </Link>
            <Link href="/store/demo/admin"
              className="inline-flex items-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/20 text-slate-900 font-semibold rounded-xl transition-colors">
              Try Demo
            </Link>
          </div>
        </div>
      </section>

      {/* Pipeline */}
      <section className="py-16 px-4 bg-slate-50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl font-bold text-slate-900 text-center mb-10">6-Step Automation Pipeline</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {PIPELINE.map((s) => {
              const Icon = s.icon;
              return (
                <div key={s.step} className="bg-white rounded-2xl border border-slate-200 p-5 text-center">
                  <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center mx-auto mb-3">
                    <Icon className="w-5 h-5 text-violet-600" />
                  </div>
                  <div className="text-xs font-bold text-slate-400 mb-1">Step {s.step}</div>
                  <div className="text-sm font-bold text-slate-900 mb-2">{s.label}</div>
                  <div className="text-xs text-slate-500 leading-snug">{s.desc}</div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-slate-900 mb-8">What's included</h2>
          <div className="grid sm:grid-cols-2 gap-3">
            {FEATURES.map(f => (
              <div key={f} className="flex items-start gap-3 p-4 rounded-xl border border-slate-100 bg-slate-50">
                <span className="w-4 h-4 rounded-full bg-violet-600 inline-block flex-shrink-0 mt-0.5 shrink-0" aria-hidden="true" />
                <span className="text-sm text-slate-700">{f}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Important note */}
      <section className="py-8 px-4 bg-amber-50 border-y border-amber-200">
        <div className="max-w-4xl mx-auto flex items-start gap-4">
          <ShieldCheck className="w-6 h-6 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-amber-900 text-sm">Verified data only — no hallucinations</p>
            <p className="text-sm text-amber-800 mt-1">
              EIN, UEI, CAGE code, SAM status, banking info, and legal facts are pulled from your verified org profile only.
              If a fact is missing, it's flagged for admin input — never invented. AI is used only for narrative sections,
              and every AI-generated field requires admin approval before export.
            </p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-2xl font-bold text-slate-900 mb-4">Ready to automate your grant operations?</h2>
          <p className="text-slate-500 mb-8">Included with your Elevate platform license. Open the admin panel to get started.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/admin/compliance/automation"
              className="inline-flex items-center gap-2 px-6 py-3 bg-violet-600 hover:bg-violet-700 text-white font-semibold rounded-xl transition-colors">
              Open Grant & Contract Suite <ArrowRight className="w-4 h-4" />
            </Link>
            <Link href="/admin/settings/organization-profile"
              className="inline-flex items-center gap-2 px-6 py-3 border border-slate-200 text-slate-700 font-semibold rounded-xl hover:bg-slate-50 transition-colors">
              Set Up Org Profile First
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
