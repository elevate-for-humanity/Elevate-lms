import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface DashboardMetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  trend?: {
    value: number;
    label?: string;
  };
  href?: string;
  variant?: 'default' | 'success' | 'warning' | 'danger';
}

export function DashboardMetricCard({
  title,
  value,
  subtitle,
  icon,
  trend,
  href,
  variant = 'default',
}: DashboardMetricCardProps) {
  const variantStyles = {
    default: 'bg-white border-slate-200',
    success: 'bg-green-50 border-green-200',
    warning: 'bg-amber-50 border-amber-200',
    danger: 'bg-red-50 border-red-200',
  };

  const content = (
    <div className={`rounded-xl border p-4 lg:p-6 ${variantStyles[variant]} transition-shadow hover:shadow-md`}>
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-slate-500 truncate">{title}</p>
          <p className="mt-2 text-2xl lg:text-3xl font-bold text-slate-900 truncate">{value}</p>
          {subtitle && (
            <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
          )}
          {trend && (
            <div className="mt-2 flex items-center gap-1">
              {trend.value > 0 ? (
                <TrendingUp className="w-4 h-4 text-green-600" />
              ) : trend.value < 0 ? (
                <TrendingDown className="w-4 h-4 text-red-600" />
              ) : (
                <Minus className="w-4 h-4 text-slate-400" />
              )}
              <span className={`text-sm font-medium ${
                trend.value > 0 ? 'text-green-600' : trend.value < 0 ? 'text-red-600' : 'text-slate-500'
              }`}>
                {trend.value > 0 ? '+' : ''}{trend.value}%
              </span>
              {trend.label && (
                <span className="text-sm text-slate-500">{trend.label}</span>
              )}
            </div>
          )}
        </div>
        {icon && (
          <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500">
            {icon}
          </div>
        )}
      </div>
    </div>
  );

  if (href) {
    return (
      <a href={href} className="block">
        {content}
      </a>
    );
  }

  return content;
}
