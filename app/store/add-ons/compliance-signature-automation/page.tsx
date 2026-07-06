import { Metadata } from 'next';
import Link from 'next/link';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { PenTool, ArrowRight, FileText, Clock } from 'lucide-react';

export const dynamic = 'force-static';
export const metadata: Metadata = {
  title: 'Compliance & Signature Automation | Elevate Store',
  description: 'Digital signatures, MOU management, and compliance document workflows with full audit trail.',
};

const FEATURES = [
  'Draw or typed digital signatures',
  'MOU creation, distribution, and countersignature',
  'Partner agreement management',
  'Enrollment and instructor agreement workflows',
  'Signature audit trail — IP, timestamp, actor',
  'Expiration tracking and renewal alerts',
  'Bulk signature link generation',
  'PDF export of all signed documents',
  'FERPA-compliant data handling',
  'Role-based access controls',
];

const DOC_TYPES = [
  'State Agency Contracts', 'Partner MOUs', 'Enrollment Agreements',
  'Instructor Agreements', 'Vendor Registrations', 'RFP Responses',
  'Compliance Certifications', 'Board Resolutions',
];

export default function ComplianceSignaturePage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: 'Store', href: '/store' }, { label: 'Add-ons', href: '/store/add-ons' }, { label: 'Compliance & Signature Automation' }]} />
      </div>
      <section className="bg-gradient-to-br from-rose-950 to-slate-900 text-white py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-rose-800/50 text-rose-200 text-xs font-semibold px-3 py-1.5 rounded-full mb-6">
            <PenTool className="w-3.5 h-3.5" /> Operations & Compliance Automation
          </div>
          <h1 className="text-4xl md:text-5xl font-black mb-6">Compliance & Signature Automation</h1>
          <p className="text-lg text-slate-300 max-w-2xl mx-auto mb-10">
            Manage the full lifecycle of compliance documents — MOUs, partner agreements, enrollment agreements,
            and state contracts. Collect signatures, track countersignatures, full audit trail.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/admin/signatures" className="inline-flex items-center gap-2 px-6 py-3 bg-rose-500 hover:bg-rose-400 text-white font-semibold rounded-xl transition-colors">
              Manage Signatures <ArrowRight className="w-4 h-4" />
            </Link>
            <Link href="/admin/mou" className="inline-flex items-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/20 text-slate-900 font-semibold rounded-xl transition-colors">
              MOU Management
            </Link>
          </div>
        </div>
      </section>

      <section className="py-16 px-4">
        <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-12">
          <div>
            <h2 className="text-xl font-bold text-slate-900 mb-6">Features</h2>
            <div className="space-y-3">
              {FEATURES.map(f => (
                <div key={f} className="flex items-center gap-3">
                  <span className="w-4 h-4 rounded-full bg-rose-500 inline-block flex-shrink-0 shrink-0" aria-hidden="true" />
                  <span className="text-sm text-slate-700">{f}</span>
                </div>
              ))}
            </div>
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900 mb-6">Document Types</h2>
            <div className="space-y-2">
              {DOC_TYPES.map(d => (
                <div key={d} className="flex items-center gap-3 p-3 rounded-lg border border-slate-100 bg-slate-50">
                  <FileText className="w-4 h-4 text-slate-400 shrink-0" />
                  <span className="text-sm text-slate-700">{d}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="py-12 px-4 bg-slate-50 border-t border-slate-200">
        <div className="max-w-2xl mx-auto text-center">
          <Link href="/admin/compliance/automation" className="inline-flex items-center gap-2 px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-xl transition-colors">
            Open Compliance Suite <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}
