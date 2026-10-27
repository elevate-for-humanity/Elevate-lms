'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
export function CareerOnboarding() {
  const [started, setStarted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  useEffect(() => {
    void fetch('/api/learner/career-onboarding').then(async response => {
      const body = await response.json();
      if (!response.ok) throw new Error(body.error);
      setStarted(body.started);
    }).catch(error => setMessage(error.message)).finally(() => setLoading(false));
  }, []);
  return <section className="space-y-3 rounded-2xl border border-blue-200 bg-blue-50 p-5">
    <h2 className="text-xl font-black">Career readiness onboarding</h2>
    <p>{started ? 'Your career profile is started. Complete your resume, submit credentials for review, and track your applications.' : 'Start your career profile, then prepare your resume and credential evidence before applying for jobs.'}</p>
    {!started && <button disabled={loading} className="rounded-xl bg-blue-700 px-4 py-3 font-bold text-white disabled:opacity-50" onClick={async () => {
      setLoading(true); setMessage('');
      try {
        const response = await fetch('/api/learner/career-onboarding', { method: 'POST' });
        const body = await response.json();
        if (!response.ok) throw new Error(body.error);
        setStarted(body.started); setMessage('Career onboarding started and saved.');
      } catch (error) { setMessage(error instanceof Error ? error.message : 'Unable to start onboarding.'); }
      finally { setLoading(false); }
    }}>{loading ? 'Loading…' : 'Start Career Services'}</button>}
    <p role="status" className="text-sm">{message}</p>
    <ol className="list-inside list-decimal space-y-2"><li><Link href="/lms/resume-builder" className="font-bold text-blue-700 underline">Build or upload your resume</Link></li><li><Link href="/lms/certification/upload" className="font-bold text-blue-700 underline">Submit earned credentials for verification</Link></li><li><Link href="/lms/placement" className="font-bold text-blue-700 underline">Track employment applications</Link></li></ol>
  </section>;
}
