'use client';

import { useState, useEffect, useCallback } from 'react';
import { CheckCircle, Clock, ClipboardList, AlertCircle, Plus, Loader2 } from 'lucide-react';

interface OjtStatus {
  skillName: string;
  skillDescription: string;
  requiredReps: number;
  requiresVerification: boolean;
  verifiedReps: number;
  pendingReps: number;
  canComplete: boolean;
}

interface Props {
  lessonId: string;
  courseId: string;
  lessonTitle: string;
  onComplete: () => void;
}

export default function OjtCompletionPanel({ lessonId, courseId, lessonTitle, onComplete }: Props) {
  const [status, setStatus] = useState<OjtStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [logging, setLogging] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [logForm, setLogForm] = useState({ notes: '', supervisorName: '', serviceCount: 1 });
  const [showLogForm, setShowLogForm] = useState(false);

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch(`/api/lessons/${lessonId}/ojt-status`);
      if (!res.ok) throw new Error('Failed to load OJT status');
      setStatus(await res.json());
    } catch (e) {
      setError('Could not load OJT requirements. Please refresh.');
    } finally {
      setLoading(false);
    }
  }, [lessonId]);

  useEffect(() => { fetchStatus(); }, [fetchStatus]);

  const logAttempt = async () => {
    setLogging(true);
    setError(null);
    try {
      const res = await fetch(`/api/lessons/${lessonId}/ojt-log`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courseId,
          notes: logForm.notes,
          supervisorName: logForm.supervisorName,
          serviceCount: logForm.serviceCount,
        }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error ?? 'Failed to log attempt');
      }
      setShowLogForm(false);
      setLogForm({ notes: '', supervisorName: '', serviceCount: 1 });
      await fetchStatus();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLogging(false);
    }
  };

  const completeLesson = async () => {
    setCompleting(true);
    setError(null);
    try {
      const res = await fetch(`/api/lessons/${lessonId}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ timeSpentSeconds: 60 }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error ?? 'Failed to mark complete');
      }
      onComplete();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setCompleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-brand-blue-600" />
      </div>
    );
  }

  if (!status) {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 text-sm text-amber-800">
        {error ?? 'OJT requirements unavailable.'}
      </div>
    );
  }

  const totalLogged = status.verifiedReps + status.pendingReps;
  const progressPct = Math.min(100, (status.verifiedReps / status.requiredReps) * 100);

  return (
    <div className="space-y-6">
      {/* Requirement header */}
      <div className="bg-brand-blue-50 border border-brand-blue-200 rounded-xl p-6">
        <div className="flex items-start gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-brand-blue-100 flex items-center justify-center flex-shrink-0">
            <ClipboardList className="w-5 h-5 text-brand-blue-600" />
          </div>
          <div>
            <div className="text-xs font-semibold uppercase tracking-wide text-brand-blue-600 mb-0.5">
              On-the-Job Training Required
            </div>
            <h3 className="font-bold text-slate-900">{status.skillName}</h3>
            <p className="text-sm text-slate-600 mt-1">{status.skillDescription}</p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mb-3">
          <div className="flex justify-between text-xs text-slate-600 mb-1">
            <span>Supervisor-verified reps</span>
            <span className="font-semibold">{status.verifiedReps} / {status.requiredReps}</span>
          </div>
          <div className="h-2.5 bg-slate-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-brand-blue-600 rounded-full transition-all duration-500"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>

        {/* Rep breakdown */}
        <div className="grid grid-cols-3 gap-3 text-center text-sm">
          <div className="bg-white rounded-lg p-3 border border-slate-200">
            <div className="text-2xl font-bold text-green-600">{status.verifiedReps}</div>
            <div className="text-xs text-slate-500 mt-0.5">Verified</div>
          </div>
          <div className="bg-white rounded-lg p-3 border border-slate-200">
            <div className="text-2xl font-bold text-amber-500">{status.pendingReps}</div>
            <div className="text-xs text-slate-500 mt-0.5">Pending review</div>
          </div>
          <div className="bg-white rounded-lg p-3 border border-slate-200">
            <div className="text-2xl font-bold text-slate-400">
              {Math.max(0, status.requiredReps - status.verifiedReps)}
            </div>
            <div className="text-xs text-slate-500 mt-0.5">Still needed</div>
          </div>
        </div>

        {status.requiresVerification && (
          <p className="text-xs text-slate-500 mt-3 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 flex-shrink-0" />
            Each rep must be verified by your supervising barber before it counts.
          </p>
        )}
      </div>

      {/* Log attempt form */}
      {showLogForm ? (
        <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
          <h4 className="font-semibold text-slate-900">Log a Shop Attempt</h4>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Number of times performed this session
            </label>
            <input
              type="number"
              min={1}
              max={20}
              value={logForm.serviceCount}
              onChange={e => setLogForm(f => ({ ...f, serviceCount: parseInt(e.target.value) || 1 }))}
              className="w-24 border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Supervising barber name
            </label>
            <input
              type="text"
              placeholder="e.g. Marcus Johnson"
              value={logForm.supervisorName}
              onChange={e => setLogForm(f => ({ ...f, supervisorName: e.target.value }))}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Notes <span className="text-slate-400">(optional)</span>
            </label>
            <textarea
              rows={3}
              placeholder="What did you work on? Any feedback from your supervisor?"
              value={logForm.notes}
              onChange={e => setLogForm(f => ({ ...f, notes: e.target.value }))}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue-500 resize-none"
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={logAttempt}
              disabled={logging}
              className="flex items-center gap-2 bg-brand-blue-600 text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-brand-blue-700 disabled:opacity-50 transition-colors"
            >
              {logging ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              {logging ? 'Saving…' : 'Save Attempt'}
            </button>
            <button
              onClick={() => { setShowLogForm(false); setError(null); }}
              className="px-5 py-2.5 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setShowLogForm(true)}
          className="w-full flex items-center justify-center gap-2 border-2 border-dashed border-brand-blue-300 text-brand-blue-600 rounded-xl py-4 text-sm font-semibold hover:bg-brand-blue-50 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Log a shop attempt
        </button>
      )}

      {/* Complete button — only enabled when requirements met */}
      <div>
        {status.canComplete ? (
          <button
            onClick={completeLesson}
            disabled={completing}
            className="w-full flex items-center justify-center gap-2 bg-green-600 text-white py-3.5 rounded-xl font-semibold hover:bg-green-700 disabled:opacity-50 transition-colors"
          >
            {completing
              ? <><Loader2 className="w-5 h-5 animate-spin" /> Marking complete…</>
              : <><CheckCircle className="w-5 h-5" /> Mark Lab Complete</>
            }
          </button>
        ) : (
          <div className="w-full flex items-center justify-center gap-2 bg-slate-100 text-slate-400 py-3.5 rounded-xl font-semibold cursor-not-allowed text-sm">
            <Clock className="w-5 h-5" />
            Complete {Math.max(0, status.requiredReps - status.verifiedReps)} more verified rep{status.requiredReps - status.verifiedReps !== 1 ? 's' : ''} to unlock
          </div>
        )}
        {error && !showLogForm && (
          <p className="text-sm text-red-600 mt-2 text-center">{error}</p>
        )}
      </div>
    </div>
  );
}
