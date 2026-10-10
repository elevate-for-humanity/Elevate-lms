import React from 'react';
import Link from 'next/link';
import type { LucideIcon } from 'lucide-react';

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
  title: string;
  description?: string;
  breadcrumbs?: { label: string; href?: string }[];
  stats?: StatCard[];
  actions?: React.ReactNode;
  children: React.ReactNode;
}

export function AdminPageShell({
  title,
  description,
  breadcrumbs,
  stats,
  actions,
  children,
}: AdminPageShellProps) {
  return (
    <section className="min-h-screen bg-slate-50">
      <header className="bg-slate-900 px-4 py-6 text-white sm:px-6">
        {breadcrumbs?.length ? (
          <nav aria-label="Breadcrumb" className="mb-4 flex flex-wrap gap-2 text-sm text-slate-300">
            {breadcrumbs.map((item, index) => (
              <React.Fragment key={`${item.label}-${index}`}>
                {index > 0 && <span aria-hidden="true">/</span>}
                {item.href ? (
                  <Link href={item.href} className="hover:text-white">
                    {item.label}
                  </Link>
                ) : (
                  <span aria-current="page">{item.label}</span>
                )}
              </React.Fragment>
            ))}
          </nav>
        ) : null}
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">{title}</h1>
            {description && <p className="mt-2 text-sm text-slate-300">{description}</p>}
          </div>
          {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
        </div>
      </header>
      <div className="space-y-5 px-4 py-6 sm:px-6">
        {stats?.length ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {stats.map((stat) => {
              const Icon = stat.icon;
              const content = (
                <>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm font-medium text-slate-600">{stat.label}</span>
                    {Icon && <Icon aria-hidden="true" className="h-5 w-5 text-slate-500" />}
                  </div>
                  <p className="mt-2 text-2xl font-bold text-slate-950">{stat.value}</p>
                  {stat.sub && <p className="mt-1 text-xs text-slate-500">{stat.sub}</p>}
                </>
              );
              const className = `rounded-xl border bg-white p-4 ${stat.alert ? 'border-amber-300' : 'border-slate-200'}`;
              return stat.href ? (
                <Link key={stat.label} href={stat.href} className={className}>
                  {content}
                </Link>
              ) : (
                <div key={stat.label} className={className}>
                  {content}
                </div>
              );
            })}
          </div>
        ) : null}
        {children}
      </div>
    </section>
  );
}

export function AdminFilterBar({ children }: { children: React.ReactNode }) {
  return <div className="bg-white rounded-xl border border-slate-200 p-4 mb-5">{children}</div>;
}

export function AdminCard({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`bg-white rounded-xl border border-slate-200 overflow-hidden ${className}`}>
      {children}
    </div>
  );
}

export function AdminEmptyState({ message = 'No records found' }: { message?: string }) {
  return (
    <div className="py-16 text-center text-slate-400">
      <p className="font-medium">{message}</p>
    </div>
  );
}

export function AdminPagination({
  page,
  totalPages,
  baseHref,
}: {
  page: number;
  totalPages: number;
  baseHref: string;
}) {
  if (totalPages <= 1) return null;
  const sep = baseHref.includes('?') ? '&' : '?';
  return (
    <div className="px-5 py-3 border-t border-slate-100 flex items-center justify-between">
      <p className="text-xs text-slate-500">
        Page {page} of {totalPages}
      </p>
      <div className="flex gap-2">
        {page > 1 && (
          <Link
            href={`${baseHref}${sep}page=${page - 1}`}
            className="px-3 py-1.5 text-xs font-medium border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors"
          >
            Previous
          </Link>
        )}
        {page < totalPages && (
          <Link
            href={`${baseHref}${sep}page=${page + 1}`}
            className="px-3 py-1.5 text-xs font-medium bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            Next
          </Link>
        )}
      </div>
    </div>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    active: 'bg-brand-green-100 text-brand-green-800',
    approved: 'bg-brand-green-100 text-brand-green-800',
    enrolled: 'bg-blue-100 text-blue-800',
    pending: 'bg-amber-100 text-amber-800',
    submitted: 'bg-amber-100 text-amber-800',
    in_review: 'bg-purple-100 text-purple-800',
    rejected: 'bg-red-100 text-red-800',
    revoked: 'bg-red-100 text-red-800',
    completed: 'bg-slate-100 text-slate-700',
    inactive: 'bg-slate-100 text-slate-500',
  };
  const cls = map[status?.toLowerCase()] ?? 'bg-slate-100 text-slate-600';
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${cls}`}
    >
      {status?.replace(/_/g, ' ')}
    </span>
  );
}
