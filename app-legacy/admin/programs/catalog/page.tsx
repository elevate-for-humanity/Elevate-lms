import { requireRole } from '@/lib/auth/require-role';
import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import {
  FileText,
  Download,
  Printer,
  Eye,
  Calendar,
  Building2,
  Clock,
  GraduationCap,
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Program Catalog Generator | Admin | Elevate',
  description: 'Generate program catalogs for state submission and compliance.',
};

export const dynamic = 'force-dynamic';
export const revalidate = 60;

export default async function ProgramCatalogPage() {
  await requireRole(['admin', 'super_admin', 'staff']);
  const supabase = await createClient();

  const { data: allPrograms = [] } = await supabase
    .from('programs')
    .select('*')
    .order('title', { ascending: true });

  // Group programs by category
  const categories = {
    healthcare: allPrograms.filter((p: any) =>
      (p.title || p.name || '').toLowerCase().match(/cna|medical|phlebotomy|health/),
    ),
    trades: allPrograms.filter((p) =>
      (p.title || p.name || '').toLowerCase().match(/hvac|barber|electrical|plumbing|welding/),
    ),
    technology: allPrograms.filter((p) =>
      (p.title || p.name || '').toLowerCase().match(/\bit\b|cyber|tech/),
    ),
    business: allPrograms.filter((p) =>
      (p.title || p.name || '').toLowerCase().match(/business|tax|marketing/),
    ),
  };

  const totalPrograms = allPrograms.length;
  const totalClockHours = allPrograms.reduce(
    (sum: number, p: any) => sum + (p.clock_hours || 0),
    0,
  );

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Image */}
      <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: 'Admin', href: '/admin' }, { label: 'Catalog' }]} />
      </div>
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-2 text-sm text-slate-700 mb-2">
              <Link href="/admin" className="hover:text-slate-900">
                Admin
              </Link>
              <span>/</span>
              <Link href="/admin/programs" className="hover:text-slate-900">
                Programs
              </Link>
              <span>/</span>
              <span className="text-slate-900">Catalog Generator</span>
            </div>
            <h1 className="text-3xl font-bold text-slate-900">Program Catalog Generator</h1>
            <p className="text-slate-700 mt-1">
              Generate official program catalogs for state submission
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-brand-blue-100 rounded-lg flex items-center justify-center">
                <GraduationCap className="w-6 h-6 text-brand-blue-600" />
              </div>
              <div>
                <p className="text-sm text-slate-700">Total Programs</p>
                <p className="text-2xl font-bold text-slate-900">{totalPrograms}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-brand-green-100 rounded-lg flex items-center justify-center">
                <Clock className="w-6 h-6 text-brand-green-600" />
              </div>
              <div>
                <p className="text-sm text-slate-700">Total Clock Hours</p>
                <p className="text-2xl font-bold text-slate-900">
                  {totalClockHours.toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-brand-blue-100 rounded-lg flex items-center justify-center">
                <Building2 className="w-6 h-6 text-brand-blue-600" />
              </div>
              <div>
                <p className="text-sm text-slate-700">Categories</p>
                <p className="text-2xl font-bold text-slate-900">4</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-brand-orange-100 rounded-lg flex items-center justify-center">
                <Calendar className="w-6 h-6 text-brand-orange-600" />
              </div>
              <div>
                <p className="text-sm text-slate-700">Last Updated</p>
                <p className="text-lg font-bold text-slate-900">
                  {new Date().toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Catalog Options */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* Full Catalog */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 bg-brand-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <FileText className="w-7 h-7 text-brand-blue-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-slate-900">Full Program Catalog</h3>
                <p className="text-sm text-slate-700 mt-1 mb-4">
                  Complete catalog with all programs, descriptions, clock hours, credentials, and
                  requirements. Suitable for state submission and accreditation.
                </p>
                <div className="flex items-center gap-3">
                  <Link
                    href="/api/admin/catalog/full?format=pdf"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-brand-blue-600 text-white rounded-lg hover:bg-brand-blue-700 text-sm font-medium"
                  >
                    <Download className="w-4 h-4" />
                    Download PDF
                  </Link>
                  <Link
                    href="/admin/programs/catalog"
                    className="inline-flex items-center gap-2 px-4 py-2 border border-slate-300 text-slate-900 rounded-lg hover:bg-slate-50 text-sm font-medium"
                  >
                    <Eye className="w-4 h-4" />
                    Preview
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Summary Catalog */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 bg-brand-green-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <FileText className="w-7 h-7 text-brand-green-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-slate-900">Summary Catalog</h3>
                <p className="text-sm text-slate-700 mt-1 mb-4">
                  Condensed version with program names, clock hours, and credentials only. Ideal for
                  quick reference and marketing materials.
                </p>
                <div className="flex items-center gap-3">
                  <Link
                    href="/api/admin/catalog/summary?format=pdf"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-brand-green-600 text-white rounded-lg hover:bg-brand-green-700 text-sm font-medium"
                  >
                    <Download className="w-4 h-4" />
                    Download PDF
                  </Link>
                  <button className="inline-flex items-center gap-2 px-4 py-2 border border-slate-300 text-slate-900 rounded-lg hover:bg-slate-50 text-sm font-medium">
                    <Printer className="w-4 h-4" />
                    Print
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Programs by Category */}
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <div className="px-6 py-4 border-b">
            <h2 className="text-lg font-semibold text-slate-900">Programs by Category</h2>
          </div>

          <div className="divide-y">
            {/* Healthcare */}
            <div className="p-6">
              <h3 className="text-md font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <span className="w-3 h-3 bg-brand-red-500 rounded-full"></span>
                Healthcare ({categories.healthcare.length} programs)
              </h3>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {categories.healthcare.slice(0, 6).map((program) => (
                  <div key={program.slug} className="bg-slate-50 rounded-lg p-4">
                    <h4 className="font-medium text-slate-900 text-sm">
                      {program.title || program.name}
                    </h4>
                    <div className="flex items-center gap-4 mt-2 text-xs text-slate-700">
                      <span>
                        {program.duration_weeks ? `${program.duration_weeks} weeks` : '—'}
                      </span>
                      {program.clock_hours && (
                        <span className="text-brand-blue-600 font-medium">
                          {program.clock_hours} hrs
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Skilled Trades */}
            <div className="p-6">
              <h3 className="text-md font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <span className="w-3 h-3 bg-brand-orange-500 rounded-full"></span>
                Skilled Trades ({categories.trades.length} programs)
              </h3>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {categories.trades.slice(0, 6).map((program) => (
                  <div key={program.slug} className="bg-slate-50 rounded-lg p-4">
                    <h4 className="font-medium text-slate-900 text-sm">
                      {program.title || program.name}
                    </h4>
                    <div className="flex items-center gap-4 mt-2 text-xs text-slate-700">
                      <span>
                        {program.duration_weeks ? `${program.duration_weeks} weeks` : '—'}
                      </span>
                      {program.clock_hours && (
                        <span className="text-brand-blue-600 font-medium">
                          {program.clock_hours} hrs
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Technology */}
            <div className="p-6">
              <h3 className="text-md font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <span className="w-3 h-3 bg-brand-blue-500 rounded-full"></span>
                Technology ({categories.technology.length} programs)
              </h3>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {categories.technology.slice(0, 6).map((program) => (
                  <div key={program.slug} className="bg-slate-50 rounded-lg p-4">
                    <h4 className="font-medium text-slate-900 text-sm">
                      {program.title || program.name}
                    </h4>
                    <div className="flex items-center gap-4 mt-2 text-xs text-slate-700">
                      <span>
                        {program.duration_weeks ? `${program.duration_weeks} weeks` : '—'}
                      </span>
                      {program.clock_hours && (
                        <span className="text-brand-blue-600 font-medium">
                          {program.clock_hours} hrs
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Business */}
            <div className="p-6">
              <h3 className="text-md font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <span className="w-3 h-3 bg-brand-blue-500 rounded-full"></span>
                Business & Finance ({categories.business.length} programs)
              </h3>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {categories.business.slice(0, 6).map((program) => (
                  <div key={program.slug} className="bg-slate-50 rounded-lg p-4">
                    <h4 className="font-medium text-slate-900 text-sm">
                      {program.title || program.name}
                    </h4>
                    <div className="flex items-center gap-4 mt-2 text-xs text-slate-700">
                      <span>
                        {program.duration_weeks ? `${program.duration_weeks} weeks` : '—'}
                      </span>
                      {program.clock_hours && (
                        <span className="text-brand-blue-600 font-medium">
                          {program.clock_hours} hrs
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Export Options */}
        <div className="mt-8 bg-brand-blue-50 rounded-xl p-6">
          <h3 className="font-semibold text-slate-900 mb-4">Export Options</h3>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/api/admin/catalog/export?format=csv"
              className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 text-slate-900 rounded-lg hover:bg-slate-50 text-sm font-medium"
            >
              <Download className="w-4 h-4" />
              Export as CSV
            </Link>
            <Link
              href="/api/admin/catalog/export?format=xlsx"
              className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 text-slate-900 rounded-lg hover:bg-slate-50 text-sm font-medium"
            >
              <Download className="w-4 h-4" />
              Export as Excel
            </Link>
            <Link
              href="/api/admin/catalog/export?format=json"
              className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 text-slate-900 rounded-lg hover:bg-slate-50 text-sm font-medium"
            >
              <Download className="w-4 h-4" />
              Export as JSON
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
