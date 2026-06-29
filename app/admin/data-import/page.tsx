import { Metadata } from 'next';
import { requireRole } from '@/lib/auth/require-role';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import DataImportClient from './DataImportClient';

export const dynamic = 'force-dynamic';
export const revalidate = 60;
export const metadata: Metadata = { title: 'Data Import | Admin | Elevate For Humanity' };

export default async function DataImportPage() {
  await requireRole(['admin']);
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      <div>
        <nav className="flex items-center gap-1.5 text-xs text-slate-500 mb-3">
          <Link href="/admin/dashboard" className="hover:text-slate-700">Admin</Link>
          <ChevronRight className="w-3 h-3" />
          <span className="text-slate-900 font-medium">Data Import</span>
        </nav>
        <h1 className="text-2xl font-bold text-slate-900">Data Import</h1>
        <p className="text-sm text-slate-500 mt-1">
          Bulk import students, courses, enrollments, or employers via CSV.
          Download a template, fill it in, then upload.
        </p>
      </div>
      <DataImportClient />
    </div>
  );
}
