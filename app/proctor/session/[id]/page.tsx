'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, Play, Square, AlertTriangle, CheckCircle2,
  XCircle, Clock, User, FileText, Shield, Loader2,
  ExternalLink, Printer,
} from 'lucide-react';
import type { ExamSession, ExamResult } from '@/lib/proctor/types';
import { STATUS_CONFIG, RESULT_CONFIG, EXAM_PROVIDERS } from '@/lib/proctor/types';

const PROVIDER_URLS: Record<string, string> = {
  certiport: 'https://certiport.pearsonvue.com/',
  esco_epa608: 'https://www.escogroup.org/',
  careersafe_osha: 'https://www.careersafeonline.com/',
};

export default function SessionPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [session, setSession] = useState<ExamSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);

  const fetchSession = useCallback(async () => {
    try {
      const res = await fetch(`/api/proctor/sessions/${id}`);
      if (!res.ok) throw new Error('Session not found');
      const data = await res.json();
      setSession(data.session);
    } catch (err) {
      setError('Failed to load session. Please refresh.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { fetchSession(); }, [fetchSession]);

  async function updateSession(payload: Record<string, unknown>) {
    setUpdating(true);
    setError(null);
    try {
      const res = await fetch(`/api/proctor/sessions/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Update failed');
      }
      const data = await res.json();
      setSession(data.session);
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setUpdating(false);
    }
  }

  function startExam() {
    updateSession({ status: 'in_progress', started_at: new Date().toISOString() });
  }

  function completeExam(result: ExamResult, score?: number) {
    updateSession({
      status: 'completed',
      result,
      score: score ?? null,
      completed_at: new Date().toISOString(),
    });
  }

  function voidExam() {
    if (!confirm('Void this exam session? This cannot be undone.')) return;
    updateSession({ status: 'voided', completed_at: new Date().toISOString() });
  }

  function markNoShow() {
    updateSession({ status: 'no_show' });
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-brand-blue-600" />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="text-center py-20">
        <XCircle className="w-12 h-12 text-brand-red-400 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-slate-900 mb-2">Session Not Found</h2>
        <p className="text-slate-500 mb-6">{error || 'This session may have been deleted.'}</p>
        <Link href="/proctor" className="text-brand-blue-600 hover:underline font-medium">Back to Sessions</Link>
      </div>
    );
  }

  const statusCfg = STATUS_CONFIG[session.status];
  const resultCfg = RESULT_CONFIG[session.result];
  const providerInfo = EXAM_PROVIDERS[session.provider];
  const providerUrl = PROVIDER_URLS[session.provider];
  const isActive = session.status === 'in_progress';
  const isTerminal = ['completed', 'voided', 'no_show'].includes(session.status);

  return (
    <div className="max-w-4xl mx-auto">
      <Link href="/proctor" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-900 mb-6">
        <ArrowLeft className="w-4 h-4" /> Back to Sessions
      </Link>

      {error && (
        <div className="bg-brand-red-50 border border-brand-red-200 rounded-xl p-4 mb-6 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-brand-red-600 flex-shrink-0" />
          <p className="text-brand-red-800 text-sm">{error}</p>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h2 className="text-2xl font-black text-slate-900">{session.student_name}</h2>
            <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${statusCfg.color}`}>
              {statusCfg.label}
            </span>
            {isTerminal && (
              <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${resultCfg.color}`}>
                {resultCfg.label}
                {session.score != null && ` — ${session.score}%`}
              </span>
            )}
          </div>
          <p className="text-slate-500">
            {session.exam_name} &middot; {providerInfo?.label}
            {session.program_slug && ` &middot; ${session.program_slug}`}
          </p>
        </div>
        <div className="flex gap-2">
          {providerUrl && (
            <a
              href={providerUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm text-brand-blue-600 hover:text-brand-blue-800 px-4 py-2.5 border border-brand-blue-200 rounded-lg hover:bg-brand-blue-50 transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              Open {providerInfo?.label}
            </a>
          )}
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 text-sm text-slate-600 hover:text-slate-900 px-3 py-2.5 border border-slate-200 rounded-lg hover:bg-white transition-colors"
          >
            <Printer className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Timer (active sessions) */}
      {isActive && session.started_at && (
        <LiveTimer startedAt={session.started_at} durationMin={session.duration_min} />
      )}

      {/* Info grid */}
      <div className="grid md:grid-cols-2 gap-6 mb-8">
        {/* Session details */}
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
            <FileText className="w-4 h-4 text-slate-400" /> Exam Details
          </h3>
          <dl className="space-y-3 text-sm">
            <Row label="Provider" value={providerInfo?.label || session.provider} />
            <Row label="Exam" value={session.exam_name} />
            {session.exam_code && <Row label="Exam Code" value={session.exam_code} mono />}
            <Row label="Duration" value={`${session.duration_min} minutes`} />
            {session.start_code && <Row label="Start Code" value={session.start_code} mono />}
            {session.start_key && <Row label="Start Key" value={session.start_key} mono />}
          </dl>
        </div>

        {/* Test taker */}
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
            <User className="w-4 h-4 text-slate-400" /> Test Taker
          </h3>
          <dl className="space-y-3 text-sm">
            <Row label="Name" value={session.student_name} />
            {session.student_email && <Row label="Email" value={session.student_email} />}
            {session.program_slug && <Row label="Program" value={session.program_slug} />}
            <div className="flex items-center justify-between py-1">
              <dt className="text-slate-500">ID Verified</dt>
              <dd className="flex items-center gap-1.5">
                {session.id_verified ? (
                  <><CheckCircle2 className="w-4 h-4 text-brand-green-600" /> <span className="text-brand-green-700 font-medium">Yes — {session.id_type?.replace('_', ' ')}</span></>
                ) : (
                  <><XCircle className="w-4 h-4 text-brand-red-500" /> <span className="text-brand-red-600 font-medium">No</span></>
                )}
              </dd>
            </div>
            {session.id_notes && <Row label="ID Notes" value={session.id_notes} />}
          </dl>
        </div>

        {/* Proctor info */}
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
            <Shield className="w-4 h-4 text-slate-400" /> Proctor
          </h3>
          <dl className="space-y-3 text-sm">
            <Row label="Proctor" value={session.proctor_name} />
            <Row label="Created" value={new Date(session.created_at).toLocaleString()} />
            {session.started_at && <Row label="Started" value={new Date(session.started_at).toLocaleString()} />}
            {session.completed_at && <Row label="Ended" value={new Date(session.completed_at).toLocaleString()} />}
            {session.proctor_notes && <Row label="Notes" value={session.proctor_notes} />}
          </dl>
        </div>

        {/* Result (completed only) */}
        {isTerminal && (
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-slate-400" /> Result
            </h3>
            <dl className="space-y-3 text-sm">
              <Row label="Status" value={statusCfg.label} />
              <Row label="Result" value={resultCfg.label} />
              {session.score != null && <Row label="Score" value={`${session.score}%`} />}
              {session.started_at && session.completed_at && (
                <Row
                  label="Actual Duration"
                  value={`${Math.round((new Date(session.completed_at).getTime() - new Date(session.started_at).getTime()) / 60000)} minutes`}
                />
              )}
            </dl>
          </div>
        )}
      </div>

      {/* Actions */}
      {!isTerminal && (
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h3 className="font-bold text-slate-900 mb-4">Actions</h3>

          {session.status === 'checked_in' && (
            <div className="flex flex-wrap gap-3">
              <button
                onClick={startExam}
                disabled={updating}
                className="inline-flex items-center gap-2 bg-brand-green-600 hover:bg-brand-green-700 disabled:bg-slate-300 text-white px-6 py-3 rounded-lg font-bold transition-colors"
              >
                {updating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                Start Exam Timer
              </button>
              <button
                onClick={markNoShow}
                disabled={updating}
                className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 px-4 py-3 border border-slate-200 rounded-lg hover:bg-white transition-colors"
              >
                Mark No-Show
              </button>
            </div>
          )}

          {isActive && (
            <div className="space-y-4">
              <p className="text-sm text-slate-600">Record the exam result when the test taker finishes:</p>
              <div className="flex flex-wrap gap-3">
                <ResultButton label="Pass" result="pass" score onClick={completeExam} updating={updating} color="bg-brand-green-600 hover:bg-brand-green-700" />
                <ResultButton label="Fail" result="fail" score onClick={completeExam} updating={updating} color="bg-brand-red-600 hover:bg-brand-red-700" />
                <ResultButton label="Incomplete" result="incomplete" onClick={completeExam} updating={updating} color="bg-yellow-600 hover:bg-yellow-700" />
              </div>
              <div className="pt-3 border-t border-slate-100">
                <button
                  onClick={voidExam}
                  disabled={updating}
                  className="inline-flex items-center gap-2 text-sm text-brand-red-600 hover:text-brand-red-800 px-4 py-2 border border-brand-red-200 rounded-lg hover:bg-brand-red-50 transition-colors"
                >
                  <Square className="w-3.5 h-3.5" /> Void Session
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-4 py-1">
      <dt className="text-slate-500 flex-shrink-0">{label}</dt>
      <dd className={`text-slate-900 font-medium text-right ${mono ? 'font-mono text-xs' : ''}`}>{value}</dd>
    </div>
  );
}

function ResultButton({
  label, result, score, onClick, updating, color,
}: {
  label: string;
  result: ExamResult;
  score?: boolean;
  onClick: (result: ExamResult, score?: number) => void;
  updating: boolean;
  color: string;
}) {
  function handleClick() {
    if (score) {
      const input = prompt(`Enter score percentage for "${label}" (0-100), or leave blank:`);
      const parsed = input ? parseFloat(input) : undefined;
      onClick(result, parsed && !isNaN(parsed) ? parsed : undefined);
    } else {
      onClick(result);
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={updating}
      className={`inline-flex items-center gap-2 text-white px-6 py-3 rounded-lg font-bold transition-colors disabled:bg-slate-300 ${color}`}
    >
      {updating ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
      {label}
    </button>
  );
}

function LiveTimer({ startedAt, durationMin }: { startedAt: string; durationMin: number }) {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  const startMs = new Date(startedAt).getTime();
  const endMs = startMs + durationMin * 60 * 1000;
  const remainingMs = Math.max(0, endMs - now);
  const elapsedMs = now - startMs;

  const remainMin = Math.floor(remainingMs / 60000);
  const remainSec = Math.floor((remainingMs % 60000) / 1000);
  const elapsedMin = Math.floor(elapsedMs / 60000);
  const progress = Math.min(100, (elapsedMs / (durationMin * 60000)) * 100);
  const isLow = remainMin < 15;
  const isExpired = remainingMs === 0;

  return (
    <div className={`rounded-xl border p-6 mb-8 ${isExpired ? 'bg-brand-red-50 border-brand-red-200' : isLow ? 'bg-yellow-50 border-yellow-200' : 'bg-brand-blue-50 border-brand-blue-200'}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Clock className={`w-5 h-5 ${isExpired ? 'text-brand-red-600' : isLow ? 'text-yellow-600' : 'text-brand-blue-600'}`} />
          <span className="font-semibold text-slate-900">
            {isExpired ? 'Time Expired' : 'Time Remaining'}
          </span>
        </div>
        <span className="text-sm text-slate-500">{elapsedMin} of {durationMin} min elapsed</span>
      </div>
      <div className={`text-4xl font-black font-mono ${isExpired ? 'text-brand-red-700' : isLow ? 'text-yellow-700' : 'text-brand-blue-700'}`}>
        {String(remainMin).padStart(2, '0')}:{String(remainSec).padStart(2, '0')}
      </div>
      <div className="mt-3 h-2 bg-white/50 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${isExpired ? 'bg-brand-red-500' : isLow ? 'bg-yellow-500' : 'bg-brand-blue-500'}`}
          style={{ width: `${progress}%` }}
        />
      </div>
      {isExpired && (
        <p className="mt-3 text-sm text-brand-red-700 font-medium">
          The allotted time has expired. Record the exam result below.
        </p>
      )}
    </div>
  );
}
