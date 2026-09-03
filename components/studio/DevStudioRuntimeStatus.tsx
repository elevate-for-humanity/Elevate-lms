'use client';

import Link from 'next/link';
import { CheckCircle, Circle, Loader2, AlertCircle } from 'lucide-react';
import {
  DEV_STUDIO_RUNTIME_LABEL,
  type StudioRuntimeCompletion,
  type StudioRuntimePhase,
} from '@/lib/devstudio/studio-runtime';

const PHASE_LABEL: Record<StudioRuntimePhase, string> = {
  not_configured: 'Not configured',
  offline: 'Offline',
  booting: 'Starting up',
  ready: 'Ready',
};

export default function DevStudioRuntimeStatus({
  runtime,
  compact = false,
}: {
  runtime: StudioRuntimeCompletion | null | undefined;
  compact?: boolean;
}) {
  if (!runtime) {
    return (
      <div className="flex items-center gap-2 text-xs text-slate-500">
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
        Checking {DEV_STUDIO_RUNTIME_LABEL}…
      </div>
    );
  }

  const phaseColor =
    runtime.phase === 'ready'
      ? 'text-brand-green-400'
      : runtime.phase === 'booting'
        ? 'text-amber-400'
        : 'text-slate-400';

  return (
    <div
      className={
        compact
          ? 'space-y-2'
          : 'rounded-lg border border-[#3c3c3c] bg-[#252526] p-3 space-y-3'
      }
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-sm font-semibold text-white">{runtime.label}</p>
          <p className={`text-[11px] ${phaseColor}`}>
            {PHASE_LABEL[runtime.phase]}
            {runtime.complete ? ' · Dev Studio can use the live repo' : ''}
          </p>
        </div>
        {!compact && (
          <Link
            href="/studio"
            className="text-[11px] text-[#4ec9b0] underline"
          >
            Open Services
          </Link>
        )}
      </div>

      <ul className="space-y-2">
        {runtime.steps.map((step) => (
          <li key={step.id} className="flex gap-2 text-xs">
            {step.done ? (
              <CheckCircle className="h-4 w-4 shrink-0 text-brand-green-500" />
            ) : runtime.phase === 'booting' && step.id === 'repo-ready' ? (
              <Loader2 className="h-4 w-4 shrink-0 animate-spin text-amber-400" />
            ) : (
              <Circle className="h-4 w-4 shrink-0 text-slate-500" />
            )}
            <div className="min-w-0">
              <p className={step.done ? 'text-[#cccccc]' : 'text-slate-300'}>{step.label}</p>
              {step.detail && (
                <p className="mt-0.5 text-[10px] leading-snug text-[#858585]">{step.detail}</p>
              )}
            </div>
          </li>
        ))}
      </ul>

      {!runtime.complete && runtime.phase === 'booting' && (
        <p className="flex items-start gap-1.5 text-[10px] text-amber-200/90">
          <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
          First boot clones the repo and runs <code className="text-amber-100">pnpm install</code>. Refresh
          Health or Services after a few minutes.
        </p>
      )}
    </div>
  );
}
