"use client";

import { AlertCircle, Clock } from 'lucide-react';

interface StudentStatusBadgeProps {
  status: 'on_track' | 'needs_action' | 'at_risk' | string;
  progress: number;
  showProgress?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function StudentStatusBadge({
  status,
  progress,
  showProgress = true,
  size = 'md'
}: StudentStatusBadgeProps) {
  const getBadgeConfig = () => {
    switch (status) {
      case 'on_track':
        return {
          icon: <span className="text-slate-400 flex-shrink-0">•</span>,
          text: 'On Track',
          color: 'text-green-600',
          bgColor: 'bg-green-600',
          lightBg: 'bg-green-100'
        };
      case 'needs_action':
        return {
          icon: <AlertCircle className={size === 'sm' ? 'w-4 h-4' : size === 'lg' ? 'w-6 h-6' : 'w-5 h-5'} />,
          text: 'Needs Action',
          color: 'text-yellow-600',
          bgColor: 'bg-yellow-600',
          lightBg: 'bg-yellow-100'
        };
      case 'at_risk':
        return {
          icon: <AlertCircle className={size === 'sm' ? 'w-4 h-4' : size === 'lg' ? 'w-6 h-6' : 'w-5 h-5'} />,
          text: 'At Risk',
          color: 'text-brand-orange-600',
          bgColor: 'bg-brand-orange-600',
          lightBg: 'bg-red-100'
        };
      default:
        return {
          icon: <Clock className={size === 'sm' ? 'w-4 h-4' : size === 'lg' ? 'w-6 h-6' : 'w-5 h-5'} />,
          text: 'Getting Started',
          color: 'text-black',
          bgColor: 'bg-gray-600',
          lightBg: 'bg-gray-100'
        };
    }
  };

  const badge = getBadgeConfig();
  const textSize = size === 'sm' ? 'text-xs' : size === 'lg' ? 'text-base' : 'text-sm';
  const padding = size === 'sm' ? 'px-3 py-2' : size === 'lg' ? 'px-4 py-2' : 'px-3 py-2.5';

  return (
    <div className="flex items-center gap-4">
      <div className={`inline-flex items-center gap-2 ${padding} rounded-full ${badge.lightBg}`}>
        <span className={badge.color}>{badge.icon}</span>
        <span className={`font-semibold ${badge.color} ${textSize}`}>
          {badge.text}
        </span>
      </div>

      {showProgress && (
        <div className="flex items-center gap-2">
          <div className="w-24 bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full ${badge.bgColor}`}
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className={`font-bold ${badge.color} ${textSize}`}>
            {progress}%
          </span>
        </div>
      )}
    </div>
  );
}
