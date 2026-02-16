'use client';

import { Shield, Clock, Database, Lock, FileText } from 'lucide-react';

/**
 * System Status Panel - Institutional Signals
 * 
 * Displays explicit control statements for auditors and executives.
 * Shows governance posture without exposing internals.
 */

interface SystemStatusPanelProps {
  lastComplianceReview?: string;
  environment?: 'Production' | 'Staging' | 'Development';
}

export function SystemStatusPanel({ 
  lastComplianceReview = '2026-01-15',
  environment = 'Production'
}: SystemStatusPanelProps) {
  const statusItems = [
    {
      label: 'Last Compliance Review',
      value: new Date(lastComplianceReview).toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      }),
      icon: Clock,
      status: 'active',
    },
    {
      label: 'Audit Logging',
      value: 'Enabled',
      icon: FileText,
      status: 'active',
    },
    {
      label: 'Role-Based Access',
      value: 'Enforced',
      icon: Lock,
      status: 'active',
    },
    {
      label: 'Data Exports',
      value: 'Logged',
      icon: Database,
      status: 'active',
    },
    {
      label: 'Environment',
      value: environment,
      icon: Shield,
      status: environment === 'Production' ? 'production' : 'other',
    },
  ];

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-slate-100 rounded-lg">
          <Shield className="w-5 h-5 text-slate-700" />
        </div>
        <div>
          <h3 className="text-base font-semibold text-slate-900">System Governance</h3>
          <p className="text-sm text-slate-600">Platform security and compliance status</p>
        </div>
      </div>

      <div className="space-y-4">
        {statusItems.map((item) => (
          <div 
            key={item.label}
            className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0"
          >
            <div className="flex items-center gap-3">
              <item.icon className="w-4 h-4 text-slate-500" />
              <span className="text-sm text-slate-700">{item.label}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-sm font-medium ${
                item.status === 'active' ? 'text-slate-900' :
                item.status === 'production' ? 'text-green-700' :
                'text-slate-600'
              }`}>
                {item.value}
              </span>
              {item.status === 'active' && (
                <span className="text-slate-400 flex-shrink-0">•</span>
              )}
              {item.status === 'production' && (
                <span className="px-2 py-0.5 text-xs font-medium bg-green-100 text-green-700 rounded">
                  Live
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 pt-4 border-t border-slate-200">
        <p className="text-xs text-slate-500">
          All automated actions are rule-driven, logged, and administrator-approved.
        </p>
      </div>
    </div>
  );
}
