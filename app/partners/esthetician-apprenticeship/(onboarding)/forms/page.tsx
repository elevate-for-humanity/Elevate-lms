export const dynamic = 'force-dynamic';
import Link from 'next/link';
import { FileText, ArrowRight, ExternalLink, CheckCircle } from 'lucide-react';
import { InstitutionalHeader } from '@/components/documents/InstitutionalHeader';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

const FORMS = [
  {
    id: 'mou',
    name: 'Memorandum of Understanding (MOU)',
    description: `Worksite partnership agreement between your spa and ${PLATFORM_DEFAULTS.orgName}. Must be signed before hosting apprentices.`,
    required: true,
    action: 'sign' as const,
    href: '/partners/esthetician-apprenticeship/sign-mou',
  },
  {
    id: 'w9',
    name: 'IRS Form W-9',
    description: 'Required for OJT wage reimbursement processing through WorkOne.',
    required: true,
    action: 'download' as const,
    href: 'https://www.irs.gov/pub/irs-pdf/fw9.pdf',
  },
  {
    id: 'ojt_agreement',
    name: 'WorkOne OJT Agreement (if applicable)',
    description: 'Required if you are participating in the WIOA On-the-Job Training wage reimbursement program.',
    required: false,
    action: 'external' as const,
    href: 'https://www.in.gov/dwd/workone/',
  },
  {
    id: 'supervisor_designation',
    name: 'Supervisor Designation Form',
    description: 'Designates the licensed esthetician who will supervise the apprentice.',
    required: true,
    action: 'sign' as const,
    href: '/partners/esthetician-apprenticeship/sign-mou',
  },
];

const ACTION_LABELS = {
  sign: 'Sign Online',
  download: 'Download PDF',
  external: 'Visit Site',
  upload: 'Upload',
};

export default function EstheticianFormsPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <InstitutionalHeader title="Required Forms" subtitle="Esthetician Apprenticeship — Host Spa Partner" documentType="Forms Checklist" />

        <div className="mt-8 space-y-4">
          {FORMS.map((form) => (
            <div key={form.id} className="bg-white border border-slate-200 rounded-xl p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <FileText className="w-5 h-5 text-pink-500 mt-0.5 shrink-0" />
                  <div>
                    <p className="font-semibold text-slate-900 text-sm">
                      {form.name}
                      {form.required && <span className="text-red-500 ml-1">*</span>}
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">{form.description}</p>
                  </div>
                </div>
                <Link
                  href={form.href}
                  target={form.action === 'download' || form.action === 'external' ? '_blank' : undefined}
                  rel={form.action === 'download' || form.action === 'external' ? 'noopener noreferrer' : undefined}
                  className="flex-shrink-0 inline-flex items-center gap-1.5 text-xs font-bold text-white bg-pink-600 hover:bg-pink-700 px-3 py-2 rounded-lg transition-colors"
                >
                  {ACTION_LABELS[form.action]}
                  {(form.action === 'download' || form.action === 'external') && <ExternalLink className="w-3 h-3" />}
                </Link>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 flex items-center justify-between">
          <Link href="/partners/esthetician-apprenticeship/documents" className="text-sm text-slate-500 hover:text-slate-700">← Back to Documents</Link>
          <Link href="/partners/esthetician-apprenticeship/sign-mou"
            className="inline-flex items-center gap-2 bg-pink-600 hover:bg-pink-700 text-white font-bold px-6 py-3 rounded-xl transition-colors text-sm">
            Continue to Sign MOU <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
