import type { LucideIcon } from 'lucide-react';
import { ArrowUp, ArrowDown } from 'lucide-react';

interface StatCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  trend?: { value: string; positive: boolean };
  color?: 'blue' | 'green' | 'orange' | 'red' | 'purple';
}

const colorMap = {
  blue: { bg: 'bg-brand-blue-50', icon: 'text-brand-blue-600', ring: 'ring-brand-blue-100' },
  green: { bg: 'bg-brand-green-50', icon: 'text-brand-green-600', ring: 'ring-brand-green-100' },
  orange: { bg: 'bg-brand-orange-50', icon: 'text-brand-orange-600', ring: 'ring-brand-orange-100' },
  red: { bg: 'bg-brand-red-50', icon: 'text-brand-red-600', ring: 'ring-brand-red-100' },
  purple: { bg: 'bg-purple-50', icon: 'text-purple-600', ring: 'ring-purple-100' },
};

export function StatCard({ label, value, icon: Icon, trend, color = 'blue' }: StatCardProps) {
  const c = colorMap[color];
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">{label}</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{value}</p>
          {trend && (
            <div className={`flex items-center gap-1 mt-2 text-xs font-semibold ${trend.positive ? 'text-brand-green-600' : 'text-brand-red-600'}`}>
              {trend.positive ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
              <span>{trend.value}</span>
            </div>
          )}
        </div>
        <div className={`w-11 h-11 rounded-lg ${c.bg} ring-1 ${c.ring} flex items-center justify-center`}>
          <Icon className={`w-5 h-5 ${c.icon}`} />
        </div>
      </div>
    </div>
  );
}

interface StatGridProps {
  children: React.ReactNode;
}

export function StatGrid({ children }: StatGridProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {children}
    </div>
  );
}
