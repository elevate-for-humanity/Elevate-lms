import type { Metadata } from 'next';
import Link from 'next/link';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { FileText } from 'lucide-react';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'Policies',
  description: `Academic, enrollment, refund, conduct, and privacy policies for ${PLATFORM_DEFAULTS.orgName} programs.`,
  alternates: { canonical: 'https://www.elevateforhumanity.org/policies' },
};

const POLICIES = [
  { title: 'Terms of Service', href: '/legal', desc: 'Platform and program terms of use.' },
  { title: 'Privacy Policy', href: '/legal/privacy', desc: 'Data collection, use, and protection.' },
  { title: 'Refund Policy', href: '/tuition-fees#refund', desc: 'Tuition refund schedule and procedures.' },
  { title: 'Satisfactory Academic Progress', href: '/satisfactory-academic-progress', desc: 'SAP standards for funded students.' },
  { title: 'Attendance Policy', href: '/legal/disclosures#attendance', desc: 'Attendance requirements by program type.' },
  { title: 'Code of Conduct', href: '/legal/disclosures#conduct', desc: 'Student and participant conduct standards.' },
  { title: 'Grievance Policy', href: '/grievance', desc: 'How to file and resolve a grievance.' },
  { title: 'Equal Opportunity', href: '/equal-opportunity', desc: 'Non-discrimination and equal access statement.' },
  { title: 'Federal Compliance', href: '/federal-compliance', desc: 'WIOA, Title IX, ADA compliance.' },
  {
    title: 'WIOA / INTraining ETPL forms',
    href: '/compliance/wioa',
    desc: 'IEAP (new programs) and Section 188 checklists — per program.',
  },
  { title: 'Accessibility', href: '/accessibility', desc: 'Platform and facility accessibility standards.' },
];

export default function PoliciesPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: 'Legal', href: '/legal' }, { label: 'Policies' }]} />
      </div>
      <section className="bg-slate-900 text-white py-14 px-4 text-center">
        <h1 className="text-4xl font-black mb-3">Policies</h1>
        <p className="text-slate-300 max-w-xl mx-auto">Academic, enrollment, conduct, and privacy policies governing {PLATFORM_DEFAULTS.orgName} programs.</p>
      </section>
      <section className="max-w-3xl mx-auto px-4 py-12">
        <div className="divide-y divide-slate-200 border border-slate-200 rounded-xl overflow-hidden">
          {POLICIES.map((p) => (
            <Link key={p.href} href={p.href} className="flex items-center gap-4 px-5 py-4 bg-white hover:bg-slate-50 group transition">
              <FileText className="w-5 h-5 text-slate-400 shrink-0" />
              <div className="flex-1">
                <div className="font-semibold text-slate-900 group-hover:text-brand-blue-700">{p.title}</div>
                <div className="text-sm text-slate-500">{p.desc}</div>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
