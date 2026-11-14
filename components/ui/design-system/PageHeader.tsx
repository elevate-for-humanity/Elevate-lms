/**
 * PageHeader — Unified page header for all portal pages.
 *
 * Replaces inconsistent h1/subtitle patterns across portals.
 * Supports breadcrumbs, action buttons, and badge.
 */

import React from 'react';
import { cn } from '@/lib/utils';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  badge?: string;
  badgeColor?: 'blue' | 'green' | 'amber' | 'red' | 'purple' | 'slate';
  actions?: React.ReactNode;
  breadcrumbs?: Array<{ label: string; href?: string }>;
  className?: string;
}

const badgeColors = {
  blue:   'bg-blue-100 text-blue-700',
  green:  'bg-brand-green-100 text-brand-green-700',
  amber:  'bg-amber-100 text-amber-700',
  red:    'bg-red-100 text-red-700',
  purple: 'bg-purple-100 text-purple-700',
  slate:  'bg-slate-100 text-slate-700',
};

export function PageHeader({
  title,
  subtitle,
  badge,
  badgeColor = 'blue',
  actions,
  breadcrumbs,
  className,
}: PageHeaderProps) {
  return (
    <div className={cn('mb-6', className)}>
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav className="flex items-center gap-1.5 text-xs text-slate-500 mb-3">
          {breadcrumbs.map((crumb, i) => (
            <React.Fragment key={i}>
              {i > 0 && <span>/</span>}
              {crumb.href ? (
                <a href={crumb.href} className="hover:text-slate-700 transition-colors">{crumb.label}</a>
              ) : (
                <span className="text-slate-700 font-medium">{crumb.label}</span>
              )}
            </React.Fragment>
          ))}
        </nav>
      )}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-xl font-bold text-slate-900">{title}</h1>
            {badge && (
              <span className={cn('text-xs font-semibold px-2 py-0.5 rounded-full', badgeColors[badgeColor])}>
                {badge}
              </span>
            )}
          </div>
          {subtitle && (
            <p className="text-sm text-slate-500 mt-0.5">{subtitle}</p>
          )}
        </div>
        {actions && (
          <div className="flex items-center gap-2 shrink-0">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
}
