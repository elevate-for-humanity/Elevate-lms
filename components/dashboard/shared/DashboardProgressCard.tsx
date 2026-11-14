import React from 'react';
import { CheckCircle, Clock, AlertCircle } from 'lucide-react';

interface DashboardProgressCardProps {
  title: string;
  current: number;
  total: number;
  unit?: string;
  icon?: React.ReactNode;
  status?: 'on_track' | 'at_risk' | 'complete' | 'behind';
  href?: string;
}

export function DashboardProgressCard({
  title,
  current,
  total,
  unit = 'hrs',
  icon,
  status = 'on_track',
  href,
}: DashboardProgressCardProps) {
  const percentage = total > 0 ? Math.min(100, Math.round((current / total) * 100)) : 0;

  const statusStyles = {
    on_track: {
      bar: 'bg-brand-blue-500',
      icon: 'text-brand-blue-600',
      badge: 'bg-brand-blue-50 text-brand-blue-700',
    },
    at_risk: {
      bar: 'bg-amber-500',
      icon: 'text-amber-600',
      badge: 'bg-amber-50 text-amber-700',
    },
    complete: {
      bar: 'bg-green-500',
      icon: 'text-green-600',
      badge: 'bg-green-50 text-green-700',
    },
    behind: {
      bar: 'bg-red-500',
      icon: 'text-red-600',
      badge: 'bg-red-50 text-red-700',
    },
  };

  const styles = statusStyles[status];

  const content = (
    <div className="rounded-xl border border-slate-200 bg-white p-4 lg:p-6">
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">
            {current.toLocaleString()} <span className="text-lg font-normal text-slate-500">/ {total.toLocaleString()} {unit}</span>
          </p>
        </div>
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${styles.badge}`}>
          {icon || (status === 'complete' ? <CheckCircle className="w-5 h-5" /> : <Clock className="w-5 h-5" />)}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="relative">
        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
          <div 
            className={`h-full ${styles.bar} transition-all duration-500`}
            style={{ width: `${percentage}%` }}
          />
        </div>
        <div className="mt-2 flex items-center justify-between text-sm">
          <span className={`px-2 py-0.5 rounded ${styles.badge}`}>
            {percentage}% complete
          </span>
          <span className="text-slate-500">
            {Math.max(0, total - current).toLocaleString()} {unit} remaining
          </span>
        </div>
      </div>
    </div>
  );

  if (href) {
    return (
      <a href={href} className="block hover:shadow-md transition-shadow">
        {content}
      </a>
    );
  }

  return content;
}
