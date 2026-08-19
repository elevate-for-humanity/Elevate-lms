import Link from 'next/link';
import { Building2, FileText } from 'lucide-react';
import { requireRole } from '@/lib/auth/require-role';
import { HOST_SHOP_ROLES } from '@/lib/rbac/role-matrix';
import { getHostShopBoard } from '@/lib/partner/board';
import HostShopDocumentsClient from './HostShopDocumentsClient';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Host Shop Documents | Elevate LMS', robots: { index: false, follow: false } };

export default async function DocumentsPage() {
  const { user } = await requireRole(HOST_SHOP_ROLES);
  const board = await getHostShopBoard(user.id);
  return <main className="min-h-screen bg-slate-50">
    <header className="border-b border-slate-200 bg-white"><div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6"><div className="flex items-center gap-3"><Link href="/host-shop/dashboard" className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-blue-700" aria-label="Back to Host Shop dashboard"><Building2 className="h-5 w-5 text-white" /></Link><div><p className="font-bold text-slate-950">{board.partner?.name || 'Host Shop'}</p><p className="text-xs text-slate-500">Compliance documents</p></div></div><Link href="/host-shop/dashboard" className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50">Back to dashboard</Link></div></header>
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6"><div className="mb-6"><div className="flex items-center gap-2 text-brand-blue-700"><FileText className="h-5 w-5" /><p className="text-sm font-extrabold uppercase tracking-[0.12em]">Host Site Compliance</p></div><h1 className="mt-2 text-3xl font-black text-slate-950">Required Documents</h1><p className="mt-2 text-slate-600">Upload the documents required for {board.tradeInfo.label}. New or replacement files are submitted for review and remain private.</p></div><HostShopDocumentsClient partnerId={board.partner.id} programType={board.programType} partnerState={board.partner.state || 'IN'} requirements={board.documentStatuses} /></div>
  </main>;
}
