'use client';

/**
 * ExamReadinessPanel
 *
 * Shows a learner exactly why they are not yet exam ready, in plain language
 * tied to the domain model. Replaces vague "not ready" messages with
 * actionable, specific feedback.
 *
 * Used on the course overview page and anywhere exam readiness state is shown.
 */

import { CheckCircle, XCircle, AlertTriangle, Award } from 'lucide-react';

export interface DomainStatus {
  domain_key: string;
  domain_name: string;
  domain_min_score: number | null;
  /** Learner's average best-attempt score across checkpoints for this domain. 0 = not covered. */
  learner_avg: number;
  passed: boolean;
  /** e.g. "Recovery & Recycling: 72% (need 80%)" */
  failure_reason: string | null;
}

export interface ExamReadinessPanelProps {
  isReady: boolean;
  avgScore: number | null;
  minScore: number | null;
  checkpointsPassed: number;
  checkpointsTotal: number;
  lessonsCompleted: number;
  lessonsTotal: number;
  domains: DomainStatus[];
  /** Raw failure_reasons array from evaluate_exam_readiness() */
  failureReasons: string[];
  programTitle: string;
  /** If set, show the authorization expiry date */
  authorizationExpiresAt?: string | null;
}

export default function ExamReadinessPanel({
  isReady,
  avgScore,
  minScore,
  checkpointsPassed,
  checkpointsTotal,
  lessonsCompleted,
  lessonsTotal,
  domains,
  failureReasons,
  programTitle,
  authorizationExpiresAt,
}: ExamReadinessPanelProps) {
  if (isReady) {
    return (
      <div className="rounded-xl border border-green-200 bg-green-50 p-5">
        <div className="flex items-center gap-3 mb-2">
          <Award className="w-6 h-6 text-green-600 shrink-0" />
          <h3 className="font-semibold text-green-800 text-base">Verified Exam Ready</h3>
        </div>
        <p className="text-green-700 text-sm">
          You have met all requirements for <strong>{programTitle}</strong> and are authorized
          to sit for the certification exam.
        </p>
        {authorizationExpiresAt && (
          <p className="text-green-600 text-xs mt-2">
            Authorization expires {new Date(authorizationExpiresAt).toLocaleDateString('en-US', { timeZone: 'UTC', month: 'short', day: 'numeric', year: 'numeric' })}.
            Contact your instructor if you need to reschedule.
          </p>
        )}
      </div>
    );
  }

  const allCheckpointsPassed = checkpointsPassed === checkpointsTotal && checkpointsTotal > 0;
  const allLessonsDone = lessonsCompleted === lessonsTotal && lessonsTotal > 0;

  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50 p-5 space-y-4">
      <div className="flex items-center gap-3">
        <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
        <h3 className="font-semibold text-amber-800 text-base">Exam Authorization Requirements</h3>
      </div>

      <p className="text-amber-700 text-sm">
        Complete the following requirements to unlock your exam authorization for{' '}
        <strong>{programTitle}</strong>.
      </p>

      {/* Overall progress bars */}
      <div className="space-y-3">
        {/* Lessons */}
        <ProgressRow
          label="Lessons completed"
          value={lessonsCompleted}
          total={lessonsTotal}
          passed={allLessonsDone}
          format={(v, t) => `${v} of ${t}`}
        />

        {/* Checkpoints */}
        <ProgressRow
          label="Checkpoints passed (≥80% each)"
          value={checkpointsPassed}
          total={checkpointsTotal}
          passed={allCheckpointsPassed}
          format={(v, t) => `${v} of ${t}`}
        />

        {/* Average score */}
        {avgScore !== null && checkpointsTotal > 0 && (
          <ProgressRow
            label="Average checkpoint score (need 85%)"
            value={avgScore}
            total={100}
            passed={(avgScore ?? 0) >= 85}
            format={(v) => `${v}%`}
          />
        )}
      </div>

      {/* Domain breakdown — this is the key panel */}
      {domains.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-amber-800 uppercase tracking-wide mb-2">
            Competency Domains
          </p>
          <div className="space-y-2">
            {domains.map((d) => (
              <div
                key={d.domain_key}
                className={`flex items-start gap-2 rounded-lg px-3 py-2 text-sm ${
                  d.passed
                    ? 'bg-green-50 border border-green-200'
                    : d.learner_avg === 0
                    ? 'bg-slate-50 border border-slate-200'
                    : 'bg-red-50 border border-red-200'
                }`}
              >
                {d.passed ? (
                  <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 shrink-0" />
                ) : (
                  <XCircle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <span className={`font-medium ${d.passed ? 'text-green-800' : 'text-slate-800'}`}>
                    {d.domain_name}
                  </span>
                  {!d.passed && (
                    <p className="text-xs mt-0.5 text-slate-600">
                      {d.learner_avg === 0
                        ? 'Not yet covered — complete the checkpoint for this domain.'
                        : d.domain_min_score !== null
                        ? `Your score: ${d.learner_avg}% — need ${d.domain_min_score}%. Retake the checkpoint to improve.`
                        : `Score: ${d.learner_avg}%`}
                    </p>
                  )}
                </div>
                {d.passed && d.learner_avg > 0 && (
                  <span className="text-xs text-green-600 font-medium shrink-0">{d.learner_avg}%</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Fallback: raw failure reasons if no domain data */}
      {domains.length === 0 && failureReasons.length > 0 && (
        <ul className="space-y-1">
          {failureReasons.map((r, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-amber-800">
              <XCircle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
              {r}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function ProgressRow({
  label,
  value,
  total,
  passed,
  format,
}: {
  label: string;
  value: number;
  total: number;
  passed: boolean;
  format: (v: number, t: number) => string;
}) {
  const pct = total > 0 ? Math.min(100, Math.round((value / total) * 100)) : 0;
  return (
    <div>
      <div className="flex justify-between items-center mb-1">
        <span className="text-xs text-amber-800">{label}</span>
        <span className={`text-xs font-medium ${passed ? 'text-green-700' : 'text-amber-700'}`}>
          {format(value, total)}
        </span>
      </div>
      <div className="h-1.5 bg-amber-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${passed ? 'bg-green-500' : 'bg-amber-400'}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
