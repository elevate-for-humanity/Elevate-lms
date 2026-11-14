'use client';

import { useState } from 'react';
import { Mail, Flag, Check, Loader2 } from 'lucide-react';

interface Props {
  studentId: string;
  enrollmentId: string;
  studentName: string;
}

export function LearnerActionButtons({ studentId, enrollmentId, studentName }: Props) {
  const [flagState, setFlagState] = useState<'idle' | 'loading' | 'done'>('idle');
  const [emailState, setEmailState] = useState<'idle' | 'loading' | 'done'>('idle');

  async function handleFlag(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (flagState !== 'idle') return;
    setFlagState('loading');
    try {
      await fetch('/api/admin/at-risk/flag', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId, enrollmentId }),
      });
      setFlagState('done');
    } catch {
      setFlagState('idle');
    }
  }

  async function handleEmail(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (emailState !== 'idle') return;
    setEmailState('loading');
    try {
      await fetch('/api/admin/at-risk/follow-up', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId, enrollmentId }),
      });
      setEmailState('done');
    } catch {
      setEmailState('idle');
    }
  }

  return (
    <div className="flex items-center gap-1 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
      <button
        onClick={handleEmail}
        title={`Send re-engagement email to ${studentName}`}
        className="p-1.5 rounded-lg hover:bg-blue-50 text-slate-400 hover:text-blue-600 transition-colors disabled:opacity-50"
        disabled={emailState !== 'idle'}
      >
        {emailState === 'loading' ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : emailState === 'done' ? (
          <Check className="w-3.5 h-3.5 text-brand-green-500" />
        ) : (
          <Mail className="w-3.5 h-3.5" />
        )}
      </button>
      <button
        onClick={handleFlag}
        title={`Flag ${studentName} for follow-up`}
        className="p-1.5 rounded-lg hover:bg-amber-50 text-slate-400 hover:text-amber-600 transition-colors disabled:opacity-50"
        disabled={flagState !== 'idle'}
      >
        {flagState === 'loading' ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : flagState === 'done' ? (
          <Check className="w-3.5 h-3.5 text-brand-green-500" />
        ) : (
          <Flag className="w-3.5 h-3.5" />
        )}
      </button>
    </div>
  );
}
