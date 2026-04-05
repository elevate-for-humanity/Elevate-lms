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
  red:    { icon: 'text-brand-red-600',   bg: 'bg-brand-red-50',   border: 'border-brand-red-200',   val: 'text-brand-red-700',   bar: 'bg-brand-red-600'   },
  blue:   { icon: 'text-brand-blue-600',  bg: 'bg-brand-blue-50',  border: 'border-brand-blue-200',  val: 'text-brand-blue-700',  bar: 'bg-brand-blue-600'  },
  green:  { icon: 'text-emerald-600',     bg: 'bg-emerald-50',     border: 'border-emerald-200',     val: 'text-emerald-700',     bar: 'bg-emerald-500'     },
  amber:  { icon: 'text-amber-600',       bg: 'bg-amber-50',       border: 'border-amber-200',       val: 'text-amber-700',       bar: 'bg-amber-500'       },
  purple: { icon: 'text-violet-600',      bg: 'bg-violet-50',      border: 'border-violet-200',      val: 'text-violet-700',      bar: 'bg-violet-500'      },
  slate:  { icon: 'text-slate-600',       bg: 'bg-slate-50',       border: 'border-slate-200',       val: 'text-slate-900',       bar: 'bg-slate-400'       },
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

      {/* Page header — white, matches marketing site */}
      <div className="bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">

          {/* Breadcrumbs */}
          {breadcrumbs && breadcrumbs.length > 0 && (
            <nav className="flex items-center gap-1.5 pt-4 pb-1">
              {breadcrumbs.map((crumb, i) => (
                <React.Fragment key={i}>
                  {i > 0 && <ChevronRight className="w-3 h-3 text-slate-300" />}
                  {crumb.href ? (
                    <Link href={crumb.href} className="text-xs text-slate-400 hover:text-brand-blue-600 transition-colors">
                      {crumb.label}
                    </Link>
                  ) : (
                    <span className="text-xs text-slate-500 font-medium">{crumb.label}</span>
                  )}
                </React.Fragment>
              ))}
            </nav>
          )}

          {/* Title row */}
          <div className="flex items-start justify-between gap-4 py-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 leading-tight">{title}</h1>
              {description && (
                <p className="text-sm text-slate-500 mt-1 max-w-2xl leading-relaxed">{description}</p>
              )}
            </div>
            {actions && (
              <div className="flex items-center gap-2 flex-shrink-0 mt-1">{actions}</div>
            )}
          </div>

          {/* Stat cards */}
          {stats && stats.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 pb-5">
              {stats.map(({ label, value, sub, icon: Icon, color = 'slate', href, alert }) => {
                const c = COLOR_MAP[color];
                const card = (
                  <div className={`group rounded-2xl border ${c.bg} ${c.border} overflow-hidden shadow-sm ${href ? 'hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer' : ''} ${alert ? 'ring-2 ring-brand-red-400' : ''}`}>
                    <div className={`h-1 ${c.bar}`} />
                    <div className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <Icon className={`w-4 h-4 ${c.icon}`} />
                        {alert && <span className="w-2 h-2 rounded-full bg-brand-red-500 animate-pulse" />}
                      </div>
                      <p className={`text-2xl font-black tabular-nums ${c.val} leading-none`}>{value}</p>
                      <p className="text-xs text-slate-500 font-semibold mt-1.5 uppercase tracking-wide">{label}</p>
                      {sub && <p className="text-[10px] text-slate-400 mt-0.5">{sub}</p>}
                    </div>
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
