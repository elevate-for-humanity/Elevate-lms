import { Metadata } from 'next';
import Link from 'next/link';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { Briefcase, Search, ArrowRight, BarChart3, ShieldCheck, FileText, Users } from 'lucide-react';
import { getAdminUrl } from '@/lib/config/admin-url';

export const dynamic = 'force-static';
export const metadata: Metadata = {
  title: 'Workforce Grant Operations Hub',
  description: 'Full grant operations platform — opportunity search, application pipeline, org profile, facts vault, and submission tracking.',
};

const MODULES = [
  { icon: Search,      label: 'SAM.gov Search',         desc: 'Search federal opportunities by keyword, agency, CFDA number, or deadline', href: 'https://admin.elevateforhumanity.org/grants/opportunities' },
  { icon: Briefcase,   label: 'Application Pipeline',   desc: 'Draft → review → approved → submitted → awarded with full status tracking', href: 'https://admin.elevateforhumanity.org/grants/applications' },
  { icon: ShieldCheck, label: 'Org Profile',            desc: 'Legal name, EIN, UEI, CAGE, SAM status, signatory — single source of truth', href: 'https://admin.elevateforhumanity.org/settings/organization-profile' },
  { icon: FileText,    label: 'Facts Vault',            desc: 'Approved atomic facts for all prefill — never re-enter the same data twice', href: 'https://admin.elevateforhumanity.org/submissions/facts' },
  { icon: Users,       label: 'Content Library',        desc: 'Approved prose blocks, past performance, capability statements for reuse', href: 'https://admin.elevateforhumanity.org/submissions/content' },
  { icon: BarChart3,   label: 'Grant Revenue',          desc: 'Track awarded amounts, expenditures, and reporting deadlines', href: 'https://admin.elevateforhumanity.org/grants/revenue' },
];

const FEATURES = [
  'SAM.gov opportunity search and import',
  'Grant application pipeline with deadline tracking',
  'Organization profile — all legal and compliance data',
  'Facts vault — approved atomic facts for instant prefill',
  'Content library — reusable prose blocks and past performance',
  'Attachment library — W-9, insurance, audit, board list',
  'Submission tracking with deadline alerts',
  'Grant revenue and expenditure reporting',
  'WIOA and DOL compliance reporting',
  'Partner agency management',
];

export default function WorkforceGrantHubPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: 'Store', href: '/store' }, { label: 'Add-ons', href: '/store/add-ons' }, { label: 'Workforce Grant Operations Hub' }]} />
      </div>
      <section className="bg-slate-50 py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <span className="inline-flex items-center gap-2 bg-violet-100 text-violet-700 text-xs font-semibold px-3 py-1.5 rounded-full mb-4">
            <Briefcase className="w-3.5 h-3.5" /> Operations & Compliance Automation
          </span>
          <h1 className="text-3xl md:text-4xl font-black text-slate-900 mb-4">Workforce Grant Operations Hub</h1>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto mb-8">
            Everything a workforce development organization needs to run a professional grant operation.
            Search, apply, track, and report — all connected to your verified org profile.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a href={getAdminUrl("/grants")} className="inline-flex items-center gap-2 px-6 py-3 bg-brand-red-600 hover:bg-brand-red-700 text-white font-semibold rounded-lg transition-colors">
              Open Grants Dashboard <ArrowRight className="w-4 h-4" />
            </a>
            <a href={getAdminUrl("/grants/opportunities")} className="inline-flex items-center gap-2 px-6 py-3 bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold rounded-lg transition-colors">
              Search Opportunities
            </a>
          </div>
        </div>
      </section>

      <section className="py-16 px-4 bg-slate-50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl font-bold text-slate-900 mb-8 text-center">All Modules</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {MODULES.map(m => {
              const Icon = m.icon;
              return (
                <Link key={m.label} href={m.href}
                  className="bg-white rounded-2xl border border-slate-200 p-6 hover:border-violet-300 hover:shadow-sm transition-all group">
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center">
                      <Icon className="w-5 h-5 text-slate-600" />
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-violet-500 transition-colors" />
                  </div>
                  <h3 className="font-bold text-slate-900 text-sm mb-1">{m.label}</h3>
                  <p className="text-xs text-slate-500 leading-snug">{m.desc}</p>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-slate-900 mb-8">Everything included</h2>
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

      <section className="py-12 px-4 bg-slate-50 border-t border-slate-200">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-xl font-bold text-slate-900 mb-3">Included with your Elevate license</h2>
          <p className="text-slate-500 text-sm mb-6">Set up your org profile first — it powers all prefill across every module.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a href={getAdminUrl("/settings/organization-profile")} className="inline-flex items-center gap-2 px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-xl transition-colors">
              Set Up Org Profile <ArrowRight className="w-4 h-4" />
            </a>
            <a href={getAdminUrl("/grants/opportunities")} className="inline-flex items-center gap-2 px-6 py-3 border border-slate-200 text-slate-700 font-semibold rounded-xl hover:bg-slate-50 transition-colors">
              Search Opportunities
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
