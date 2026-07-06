import { Metadata } from 'next';
import Link from 'next/link';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { Sparkles, ArrowRight, AlertTriangle } from 'lucide-react';

export const dynamic = 'force-static';
export const metadata: Metadata = {
  title: 'Proposal Writing Assistant | Elevate Store',
  description: 'AI-assisted grant narrative writing grounded in your org data — no hallucinations, no fluff.',
};

const MODES = [
  { mode: 'grant_persuasive', desc: 'Federal and state grant applications — compelling, outcome-focused' },
  { mode: 'workforce_development', desc: 'DOL, WIOA, and workforce board submissions — operational and specific' },
  { mode: 'state_contract_formal', desc: 'State agency contracts and RFP responses — precise and compliant' },
  { mode: 'compliance_formal', desc: 'Audit responses, corrective action plans, compliance filings' },
  { mode: 'executive_summary', desc: 'Board presentations, capability statements, one-pagers' },
  { mode: 'budget_justification', desc: 'Budget narratives with line-item justification' },
  { mode: 'partner_mou', desc: 'MOU narratives and partner agreement language' },
];

const FIELDS = [
  'Executive Summary', 'Problem Statement', 'Project Description',
  'Goals & Objectives', 'Evaluation Plan', 'Sustainability Plan',
  'Budget Narrative', 'Target Population', 'Partner Agencies',
];

export default function ProposalWritingPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: 'Store', href: '/store' }, { label: 'Add-ons', href: '/store/add-ons' }, { label: 'Proposal Writing Assistant' }]} />
      </div>
      <section className="bg-gradient-to-br from-emerald-950 to-slate-900 text-white py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-emerald-800/50 text-emerald-200 text-xs font-semibold px-3 py-1.5 rounded-full mb-6">
            <Sparkles className="w-3.5 h-3.5" /> Operations & Compliance Automation
          </div>
          <h1 className="text-4xl md:text-5xl font-black mb-6">Proposal Writing Assistant</h1>
          <p className="text-lg text-slate-300 max-w-2xl mx-auto mb-10">
            AI-assisted grant narrative writing grounded in your verified org data.
            Sounds like a real operator wrote it — not generic AI.
            Missing facts are flagged, never invented.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/admin/grants/applications/new" className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-white font-semibold rounded-xl transition-colors">
              Start an Application <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      <section className="py-16 px-4">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold text-slate-900 mb-2">7 Writing Modes</h2>
          <p className="text-slate-500 text-sm mb-8">Each mode is tuned for a specific document type and audience.</p>
          <div className="grid sm:grid-cols-2 gap-3">
            {MODES.map(m => (
              <div key={m.mode} className="flex items-start gap-3 p-4 rounded-xl border border-slate-200">
                <code className="text-xs font-mono bg-emerald-50 text-emerald-700 px-2 py-1 rounded shrink-0">{m.mode}</code>
                <span className="text-sm text-slate-600">{m.desc}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-12 px-4 bg-slate-50">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold text-slate-900 mb-8">Narrative fields supported</h2>
          <div className="flex flex-wrap gap-2">
            {FIELDS.map(f => (
              <span key={f} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-full text-sm text-slate-700">
                <span className="w-3.5 h-3.5 rounded-full bg-emerald-500 inline-block flex-shrink-0" aria-hidden="true" /> {f}
              </span>
            ))}
          </div>
        </div>
      </section>

      <section className="py-8 px-4 bg-amber-50 border-y border-amber-200">
        <div className="max-w-4xl mx-auto flex items-start gap-4">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <p className="text-sm text-amber-800">
            <strong>No hallucinations.</strong> The assistant pulls from your verified org facts, prior applications, and program descriptions before generating text.
            Unverifiable claims are flagged with <code className="bg-amber-100 px-1 rounded">[VERIFY]</code> — never silently invented.
            Every AI-generated field requires admin approval before export.
          </p>
        </div>
      </section>

      <section className="py-12 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <Link href="/admin/grants/applications/new" className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl transition-colors">
            Start Writing a Grant Application <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}
