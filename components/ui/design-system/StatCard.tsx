/**
 * StatCard — Unified metric display card for all portal dashboards.
 *
 * Replaces the dozens of one-off stat boxes across portals.
 * Consistent sizing, color, and loading state.
 */

import React from 'react';
import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface StatCardProps {
  label: string;
  value: string | number | null | undefined;
  icon?: React.ComponentType<{ className?: string }>;
  trend?: 'up' | 'down' | 'flat';
  trendValue?: string;
  color?: 'blue' | 'green' | 'amber' | 'red' | 'purple' | 'slate';
  loading?: boolean;
  href?: string;
  className?: string;
}

const colorMap = {
  blue:   { icon: 'text-blue-600',   bg: 'bg-blue-50',   value: 'text-blue-700' },
  green:  { icon: 'text-brand-green-600',  bg: 'bg-brand-green-50',  value: 'text-brand-green-700' },
  amber:  { icon: 'text-amber-600',  bg: 'bg-amber-50',  value: 'text-amber-700' },
  red:    { icon: 'text-red-600',    bg: 'bg-red-50',    value: 'text-red-700' },
  purple: { icon: 'text-purple-600', bg: 'bg-purple-50', value: 'text-purple-700' },
  slate:  { icon: 'text-slate-600',  bg: 'bg-slate-50',  value: 'text-slate-700' },
};

export function StatCard({
  label,
  value,
  icon: Icon,
  trend,
  trendValue,
  color = 'slate',
  loading = false,
  className,
}: StatCardProps) {
  const colors = colorMap[color];

  if (loading) {
    return (
      <div className={cn('bg-white rounded-xl border border-slate-200 p-5 animate-pulse', className)}>
        <div className="h-4 bg-slate-100 rounded w-24 mb-3" />
        <div className="h-8 bg-slate-100 rounded w-16" />
      </div>
    );
  }

  return (
    <div className={cn('bg-white rounded-xl border border-slate-200 p-5', className)}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">{label}</span>
        {Icon && (
          <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center', colors.bg)}>
            <Icon className={cn('w-4 h-4', colors.icon)} />
          </div>
        )}
      </div>
      <div className={cn('text-2xl font-bold', colors.value)}>
        {value ?? '—'}
      </div>
      {trend && trendValue && (
        <div className="flex items-center gap-1 mt-1.5">
          {trend === 'up'   && <TrendingUp   className="w-3.5 h-3.5 text-brand-green-500" />}
          {trend === 'down' && <TrendingDown className="w-3.5 h-3.5 text-red-500" />}
          {trend === 'flat' && <Minus        className="w-3.5 h-3.5 text-slate-400" />}
          <span className={cn(
            'text-xs font-medium',
            trend === 'up' ? 'text-brand-green-600' : trend === 'down' ? 'text-red-600' : 'text-slate-500'
          )}>{trendValue}</span>
        </div>
      )}
    </div>
  );
}
