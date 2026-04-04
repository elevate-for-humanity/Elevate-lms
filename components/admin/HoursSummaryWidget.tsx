"use client";

/**
 * Hours Summary Widget Component
 *
 * Visual display of required vs transferred vs earned vs remaining hours
 */

interface HoursSummaryWidgetProps {
  required: number;
  transferred: number;
  earned: number;
  remaining: number;
  progressPercent: number;
}

export default function HoursSummaryWidget({
  required,
  transferred,
  earned,
  remaining,
  progressPercent
}: HoursSummaryWidgetProps) {

  const transferredPercent = required > 0 ? (transferred / required) * 100 : 0;
  const earnedPercent = required > 0 ? (earned / required) * 100 : 0;

  return (
    <div className="glow-card p-6">

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-white">
          Hours Summary
        </h2>
        <div className="text-right">
          <div className="text-3xl font-bold text-white">
            {progressPercent.toFixed(1)}%
          </div>
          <div className="text-sm text-slate-400">Complete</div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-6">
        <div className="progress-bar h-4">
          {/* Transferred Hours (Blue) */}
          <div
            className="absolute h-full bg-brand-blue-500 rounded-l-lg transition-all"
            style={{ width: `${transferredPercent}%` }}
          />
          {/* Earned Hours (Green) */}
          <div
            className="absolute h-full bg-brand-green-500 transition-all"
            style={{
              left: `${transferredPercent}%`,
              width: `${earnedPercent}%`
            }}
          />
          {/* Combined glow effect */}
          <div
            className="progress-fill"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Legend */}
        <div className="flex justify-center gap-6 mt-3 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-brand-blue-500 rounded" />
            <span className="text-slate-400">Transferred</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-brand-green-500 rounded" />
            <span className="text-slate-400">Earned at EFH</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-slate-600 rounded" />
            <span className="text-slate-400">Remaining</span>
          </div>
        </div>
      </div>

      {/* Hours Breakdown */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">

        {/* Required */}
        <div className="text-center p-4 bg-slate-800/50 rounded-lg">
          <div className="text-3xl font-bold text-white mb-1">
            {required.toLocaleString('en-US')}
          </div>
          <div className="text-xs text-slate-400 uppercase tracking-wide">
            Required
          </div>
        </div>

        {/* Transferred */}
        <div className="text-center p-4 bg-brand-blue-500/10 border border-brand-blue-500/30 rounded-lg">
          <div className="text-3xl font-bold text-brand-blue-400 mb-1">
            {transferred.toLocaleString('en-US')}
          </div>
          <div className="text-xs text-slate-400 uppercase tracking-wide">
            Transferred
          </div>
          {transferredPercent > 0 && (
            <div className="text-xs text-brand-blue-400 mt-1">
              {transferredPercent.toFixed(1)}%
            </div>
          )}
        </div>

        {/* Earned */}
        <div className="text-center p-4 bg-brand-green-500/10 border border-brand-green-500/30 rounded-lg">
          <div className="text-3xl font-bold text-brand-green-400 mb-1">
            {earned.toLocaleString('en-US')}
          </div>
          <div className="text-xs text-slate-400 uppercase tracking-wide">
            Earned
          </div>
          {earnedPercent > 0 && (
            <div className="text-xs text-brand-green-400 mt-1">
              {earnedPercent.toFixed(1)}%
            </div>
          )}
        </div>

        {/* Remaining */}
        <div className="text-center p-4 bg-brand-orange-500/10 border border-brand-orange-500/30 rounded-lg">
          <div className="text-3xl font-bold text-brand-orange-400 mb-1">
            {remaining.toLocaleString('en-US')}
          </div>
          <div className="text-xs text-slate-400 uppercase tracking-wide">
            Remaining
          </div>
          {remaining > 0 && (
            <div className="text-xs text-brand-orange-400 mt-1">
              {((remaining / required) * 100).toFixed(1)}%
            </div>
          )}
        </div>

      </div>

      {/* Status Message */}
      <div className="mt-6 p-4 bg-slate-800/30 rounded-lg border border-slate-600">
        {remaining <= 0 ? (
          <div className="text-center">
            <div className="text-brand-green-400 text-2xl mb-2">🎉</div>
            <div className="text-brand-green-400 font-semibold">
              All required hours completed!
            </div>
            <div className="text-slate-400 text-sm mt-1">
              Student is eligible for program completion
            </div>
          </div>
        ) : remaining < required * 0.25 ? (
          <div className="text-center">
            <div className="text-brand-blue-400 text-2xl mb-2">🎯</div>
            <div className="text-brand-blue-400 font-semibold">
              Almost there!
            </div>
            <div className="text-slate-400 text-sm mt-1">
              Only {remaining} hours remaining ({((remaining / required) * 100).toFixed(1)}%)
            </div>
          </div>
        ) : (
          <div className="text-center">
            <div className="text-slate-400 text-sm">
              <strong className="text-white">{remaining}</strong> hours remaining to complete program
            </div>
            {transferred > 0 && (
              <div className="text-xs text-brand-blue-400 mt-2">
                ✓ {transferred} hours credited from transfer
              </div>
            )}
          </div>
        )}
      </div>

      {/* Detailed Breakdown (Optional) */}
      <details className="mt-4">
        <summary className="text-sm text-slate-400 cursor-pointer hover:text-white transition-colors">
          View Detailed Calculation
        </summary>
        <div className="mt-3 p-4 bg-slate-800/30 rounded-lg text-sm space-y-2">
          <div className="flex justify-between">
            <span className="text-slate-400">Total Required Hours:</span>
            <span className="text-white font-mono">{required}</span>
          </div>
          <div className="flex justify-between text-brand-blue-400">
            <span>− Transferred Hours:</span>
            <span className="font-mono">−{transferred}</span>
          </div>
          <div className="flex justify-between text-brand-green-400">
            <span>− Earned at EFH:</span>
            <span className="font-mono">−{earned}</span>
          </div>
          <div className="border-t border-slate-600 pt-2 flex justify-between font-semibold">
            <span className="text-slate-300">= Remaining Hours:</span>
            <span className="text-brand-orange-400 font-mono">{remaining}</span>
          </div>
        </div>
      </details>

    </div>
  );
}
