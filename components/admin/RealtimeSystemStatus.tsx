'use client';

/**
 * RealtimeSystemStatus
 *
 * Global operational telemetry bar — mounted once in the admin layout,
 * sits between the topbar and main content. Shows live platform state.
 * Hides itself when all systems are healthy to reduce visual noise.
 */

import Link from 'next/link';
import { AlertTriangle, Activity, Users, Bot, Zap, RefreshCw } from 'lucide-react';
import { useRealtimeMetrics } from '@/hooks/useRealtimeMetrics';
import { ADMIN } from '@/lib/routes/canonical-routes';

function StatusDot({ status }: { status: 'healthy' | 'ok' | 'degraded' | 'down' | 'unknown' }) {
  const color =
    status === 'healthy' || status === 'ok' ? 'bg-emerald-400' :
    status === 'degraded'                   ? 'bg-amber-400 animate-pulse' :
    status === 'down'                       ? 'bg-red-500 animate-pulse' :
                                              'bg-zinc-500';
  return <span className={`inline-block w-1.5 h-1.5 rounded-full ${color}`} />;
}

function Metric({
  icon: Icon,
  label,
  value,
  status,
  href,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  status?: 'healthy' | 'ok' | 'degraded' | 'down' | 'unknown';
  href?: string;
}) {
  const inner = (
    <span className="flex items-center gap-1.5 text-zinc-400 hover:text-zinc-200 transition-colors">
      {status && <StatusDot status={status} />}
      <Icon className="w-3 h-3" />
      <span className="text-zinc-500">{label}:</span>
      <span className="text-zinc-200 tabular-nums">{value}</span>
    </span>
  );
  return href ? <Link href={href}>{inner}</Link> : inner;
}

export function RealtimeSystemStatus() {
  const m = useRealtimeMetrics();

  // Only show the bar when something needs attention — keep it invisible when healthy
  const hasIssue =
    m.hosting === 'degraded' || m.hosting === 'down' ||
    m.aiQueue === 'degraded' || m.aiQueue === 'down' ||
    m.failures > 0 ||
    m.applications > 0;

  // Always show during unknown state (first load) or when there are issues
  if (m.hosting === 'healthy' && m.aiQueue === 'ok' && !hasIssue) {
    return null;
  }

  return (
    <div
      className={`flex items-center gap-5 border-b px-6 py-1.5 text-xs font-mono ${
        m.hosting === 'down' || m.aiQueue === 'down'
          ? 'border-red-900/50 bg-red-950/30'
          : m.hosting === 'degraded' || m.aiQueue === 'degraded' || m.failures > 0
          ? 'border-amber-900/50 bg-amber-950/20'
          : 'border-zinc-800 bg-zinc-950'
      }`}
    >
      <Metric
        icon={Activity}
        label="Runtime"
        value={m.hosting}
        status={m.hosting}
        href={ADMIN.SYSTEM_HEALTH}
      />

      <Metric
        icon={Users}
        label="Enrollments"
        value={m.enrollments.toLocaleString()}
        href={ADMIN.ENROLLMENTS}
      />

      {m.applications > 0 && (
        <Metric
          icon={AlertTriangle}
          label="Applications"
          value={m.applications}
          status="degraded"
          href={ADMIN.APPLICATIONS}
        />
      )}

      <Metric
        icon={Bot}
        label="AI"
        value={m.aiQueue}
        status={m.aiQueue}
        href={ADMIN.AI_STUDIO}
      />

      {m.failures > 0 && (
        <Metric
          icon={Zap}
          label="Failures"
          value={m.failures}
          status="degraded"
          href={ADMIN.AUTOMATION}
        />
      )}

      <span className="ml-auto flex items-center gap-1 text-zinc-600">
        <RefreshCw className="w-2.5 h-2.5" />
        {m.updatedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
      </span>
    </div>
  );
}
