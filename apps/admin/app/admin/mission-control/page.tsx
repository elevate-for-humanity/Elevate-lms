import { Metadata } from 'next';
import Link from 'next/link';
import { requireRole } from '@/lib/auth/require-role';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { MissionControlLiveOpsPanel } from '@/components/admin/dashboard/MissionControlLiveOpsPanel';
import {
  Activity,
  ArrowRight,
  BarChart3,
  Inbox,
  RefreshCw,
  Users,
  Zap,
} from 'lucide-react';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Mission Control | Admin',
  description: 'Live operations, alerts, and platform health for Elevate admin.',
};

const QUICK_LINKS = [
  { href: '/admin/operations', label: 'Operations hub', icon: RefreshCw },
  { href: '/admin/at-risk', label: 'At-risk learners', icon: Users },
  { href: '/admin/inbox', label: 'Admin inbox', icon: Inbox },
  { href: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/admin/workflows', label: 'Workflows', icon: Zap },
] as const;

export default async function MissionControlPage() {
  await requireRole(['admin', 'super_admin', 'staff']);

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="border-b bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <Breadcrumbs
            items={[
              { label: 'Admin', href: '/admin/dashboard' },
              { label: 'Mission Control' },
            ]}
          />
          <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-brand-red-600 text-xs font-bold uppercase tracking-widest mb-2">
                <Activity className="w-4 h-4" />
                Mission Control
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                Live platform operations
              </h1>
              <p className="text-slate-600 mt-2 max-w-2xl text-sm sm:text-base">
                Real-time clock-ins, lesson activity, and unresolved alerts. Use Operations for
                cron and workflow dead letters.
              </p>
            </div>
            <Link
              href="/admin/operations"
              className="inline-flex items-center gap-2 rounded-lg bg-slate-900 text-white px-4 py-2.5 text-sm font-semibold hover:bg-slate-800"
            >
              Full operations hub
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <MissionControlLiveOpsPanel />

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-8">
          {QUICK_LINKS.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm hover:border-brand-blue-300 transition-colors"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100">
                <Icon className="w-5 h-5 text-slate-600" />
              </span>
              <span className="font-semibold text-slate-900">{label}</span>
              <ArrowRight className="w-4 h-4 text-slate-400 ml-auto" />
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
