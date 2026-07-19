import { Metadata } from 'next';
import { requireRole } from '@/lib/auth/require-role';
import Link from 'next/link';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { ArrowLeft, Upload, FileText, Globe, Package } from 'lucide-react';

export const dynamic = 'force-dynamic';
export const revalidate = 60;

export const metadata: Metadata = {
  title: 'Course Import | Admin | Elevate For Humanity',
};

const IMPORT_SOURCES = [
  {
    id: 'scorm',
    label: 'SCORM Package',
    description: 'Upload a SCORM 1.2 or 2004 .zip package.',
    icon: Package,
    href: '/admin/videos/upload',
  },
  {
    id: 'csv',
    label: 'CSV / Spreadsheet',
    description: 'Import lessons and modules from a structured CSV file.',
    icon: FileText,
    href: '/admin/studio',
  },
  {
    id: 'external',
    label: 'External LMS',
    description: 'Pull courses from a connected LMS integration.',
    icon: Globe,
    href: '/admin/partners/lms-integrations',
  },
];

export default async function CourseImportPage() {
  await requireRole(['admin', 'staff']);

  return (
    <div className="min-h-screen bg-white p-6">
      <div className="max-w-3xl mx-auto">
        <div className="mb-4">
          <Breadcrumbs
            items={[
              { label: 'Admin', href: '/admin/dashboard' },
              { label: 'Dev Studio', href: '/admin/dashboard' },
              { label: 'Course Import' },
            ]}
          />
        </div>

        <Link
          href="/admin/dashboard"
          className="text-sm text-brand-blue-600 hover:text-brand-blue-700 flex items-center gap-1 mb-6"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Advanced Tools
        </Link>

        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-brand-blue-50 rounded-lg">
            <Upload className="w-6 h-6 text-brand-blue-600" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Course Import</h1>
        </div>
        <p className="text-slate-600 mb-8">
          Import course content from external sources into the Elevate LMS.
        </p>

        <div className="grid gap-4">
          {IMPORT_SOURCES.map(({ id, label, description, icon: Icon, href }) => (
            <Link
              key={id}
              href={href}
              className="flex items-start gap-4 p-5 rounded-xl border border-slate-200 hover:border-brand-blue-300 hover:bg-brand-blue-50 transition-colors group"
            >
              <div className="p-2 bg-slate-100 rounded-lg group-hover:bg-brand-blue-100 transition-colors">
                <Icon className="w-5 h-5 text-slate-600 group-hover:text-brand-blue-600" />
              </div>
              <div>
                <p className="font-semibold text-slate-900">{label}</p>
                <p className="text-sm text-slate-500 mt-0.5">{description}</p>
              </div>
            </Link>
          ))}
        </div>

        <div className="mt-8 p-4 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
          <strong>Blueprint-driven courses</strong> are the canonical path for new programs.
          Use the <Link href="/admin/studio" className="underline">Course Studio</Link> to build
          from a blueprint instead of importing.
        </div>
      </div>
    </div>
  );
}
