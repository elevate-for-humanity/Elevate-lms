import { Metadata } from 'next';
import { requireRole } from '@/lib/auth/require-role';
import { ChevronRight } from 'lucide-react';
import Link from 'next/link';
import SnapEtClient from './SnapEtClient';

export const dynamic = 'force-dynamic';
export const revalidate = 60;
export const metadata: Metadata = { title: ' TPP Application | Admin' };

export default async function SnapEtPage() {
  await requireRole(['admin', 'super_admin', 'staff']);
  return (
    <div className="min-h-screen bg-white">
      <div className="bg-white border-b border-slate-200 px-6 py-5">
        <nav className="flex items-center gap-1.5 text-xs text-slate-500 mb-3">
          <Link href="/admin/dashboard" className="hover:text-slate-700">Admin</Link>
          <ChevronRight className="w-3 h-3" />
          <Link href="/admin/grants" className="hover:text-slate-700">Grants</Link>
          <ChevronRight className="w-3 h-3" />
          <span className="text-slate-900 font-medium"> TPP Application</span>
        </nav>
        <h1 className="text-2xl font-bold text-slate-900"> TPP Application</h1>
        <p className="text-sm text-slate-500 mt-1">
          FSSA DFR — Third Party Provider Questionnaire · Pre-populated from platform data · editable before sending
        </p>
      </div>
      <SnapEtClient />
    </div>
  );
}
