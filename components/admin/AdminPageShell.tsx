import React from 'react';
import Link from 'next/link';
import { ChevronRight, LucideIcon } from 'lucide-react';

export interface StatCard {
  label: string;
  value: string | number;
  sub?: string;
  icon: LucideIcon;
  color?: 'red' | 'blue' | 'green' | 'amber' | 'purple' | 'slate';
  href?: string;
  alert?: boolean;
}

interface AdminPageShellProps {
  /** Page title shown in the hero */
  title: string;
  /** Short description shown below the title */
  description?: string;
  /** Breadcrumb trail — last item is current page */
  breadcrumbs?: { label: string; href?: string }[];
  /** Stat cards shown in the hero banner */
  stats?: StatCard[];
  /** Action buttons shown top-right of hero */
  actions?: React.ReactNode;
  /** Page body content */
  children: React.ReactNode;
}

const COLOR_MAP = {
  red:    { icon: 'text-brand-red-400',   bg: 'bg-brand-red-500/10',   border: 'border-brand-red-500/20',   val: 'text-brand-red-300' },
  blue:   { icon: 'text-brand-blue-400',  bg: 'bg-brand-blue-500/10',  border: 'border-brand-blue-500/20',  val: 'text-brand-blue-300' },
  green:  { icon: 'text-green-400',       bg: 'bg-green-500/10',       border: 'border-green-500/20',       val: 'text-green-300' },
  amber:  { icon: 'text-amber-400',       bg: 'bg-amber-500/10',       border: 'border-amber-500/20',       val: 'text-amber-300' },
  purple: { icon: 'text-purple-400',      bg: 'bg-purple-500/10',      border: 'border-purple-500/20',      val: 'text-purple-300' },
  slate:  { icon: 'text-slate-400',       bg: 'bg-slate-700',          border: 'border-slate-600',          val: 'text-white' },
};

export function AdminPageShell({
  title,
  description,
  breadcrumbs,
  stats,
  actions,
  children,
}: AdminPageShellProps) {
  return (
    <div className="min-h-screen bg-slate-50">

      {/* Hero banner */}
      <div className="bg-slate-900 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">

          {/* Breadcrumbs */}
          {breadcrumbs && breadcrumbs.length > 0 && (
            <nav className="flex items-center gap-1.5 pt-4 pb-2">
              {breadcrumbs.map((crumb, i) => (
                <React.Fragment key={i}>
                  {i > 0 && <ChevronRight className="w-3 h-3 text-slate-600" />}
                  {crumb.href ? (
                    <Link href={crumb.href} className="text-xs text-slate-500 hover:text-slate-300 transition-colors">
                      {crumb.label}
                    </Link>
                  ) : (
                    <span className="text-xs text-slate-400">{crumb.label}</span>
                  )}
                </React.Fragment>
              ))}
            </nav>
          )}

          {/* Title row */}
          <div className="flex items-start justify-between gap-4 py-5">
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white leading-tight">{title}</h1>
              {description && (
                <p className="text-sm text-slate-400 mt-1 max-w-2xl">{description}</p>
              )}
            </div>
            {actions && (
              <div className="flex items-center gap-2 flex-shrink-0">{actions}</div>
            )}
          </div>

          {/* Stat cards */}
          {stats && stats.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 pb-6">
              {stats.map(({ label, value, sub, icon: Icon, color = 'slate', href, alert }) => {
                const c = COLOR_MAP[color];
                const card = (
                  <div className={`rounded-xl border ${c.bg} ${c.border} p-4 ${href ? 'hover:brightness-110 transition-all cursor-pointer' : ''} ${alert ? 'ring-1 ring-brand-red-500/50' : ''}`}>
                    <div className="flex items-start justify-between mb-2">
                      <Icon className={`w-4 h-4 ${c.icon}`} />
                      {alert && <span className="w-2 h-2 rounded-full bg-brand-red-400 animate-pulse" />}
                    </div>
                    <p className={`text-2xl font-extrabold ${c.val} leading-none`}>{value}</p>
                    <p className="text-xs text-slate-500 font-medium mt-1">{label}</p>
                    {sub && <p className="text-[10px] text-slate-600 mt-0.5">{sub}</p>}
                  </div>
                );
                return href ? <Link key={label} href={href}>{card}</Link> : <div key={label}>{card}</div>;
              })}
            </div>
          )}
        </div>
      </div>

      {/* Page content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {children}
      </div>
    </div>
  );
}

/** Reusable filter bar */
export function AdminFilterBar({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 mb-5 shadow-sm">
      {children}
    </div>
  );
}

/** Reusable content card */
export function AdminCard({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden ${className}`}>
      {children}
    </div>
  );
}

/** Reusable empty state */
export function AdminEmptyState({ message = 'No records found' }: { message?: string }) {
  return (
    <div className="py-16 text-center text-slate-400">
      <p className="font-medium">{message}</p>
    </div>
  );
}

/** Reusable pagination */
export function AdminPagination({
  page, totalPages, baseHref,
}: { page: number; totalPages: number; baseHref: string }) {
  if (totalPages <= 1) return null;
  const sep = baseHref.includes('?') ? '&' : '?';
  return (
    <div className="px-5 py-3 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
      <p className="text-xs text-slate-500">Page {page} of {totalPages}</p>
      <div className="flex gap-2">
        {page > 1 && (
          <Link href={`${baseHref}${sep}page=${page - 1}`}
            className="px-3 py-1.5 text-xs font-medium border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors">
            Previous
          </Link>
        )}
        {page < totalPages && (
          <Link href={`${baseHref}${sep}page=${page + 1}`}
            className="px-3 py-1.5 text-xs font-medium bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors">
            Next
          </Link>
        )}
      </div>
    </div>
  );
}

/** Status badge */
export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    active:      'bg-green-100 text-green-800 border-green-200',
    approved:    'bg-green-100 text-green-800 border-green-200',
    enrolled:    'bg-brand-blue-100 text-brand-blue-800 border-brand-blue-200',
    pending:     'bg-amber-100 text-amber-800 border-amber-200',
    submitted:   'bg-amber-100 text-amber-800 border-amber-200',
    in_review:   'bg-purple-100 text-purple-800 border-purple-200',
    rejected:    'bg-red-100 text-red-800 border-red-200',
    revoked:     'bg-red-100 text-red-800 border-red-200',
    completed:   'bg-slate-100 text-slate-700 border-slate-200',
    inactive:    'bg-slate-100 text-slate-500 border-slate-200',
  };
  const cls = map[status?.toLowerCase()] ?? 'bg-slate-100 text-slate-600 border-slate-200';
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide border ${cls}`}>
      {status?.replace(/_/g, ' ')}
    </span>
  );
}
