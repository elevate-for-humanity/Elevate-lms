'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle, Loader2 } from 'lucide-react';

export default function MOUSignClient({ holderName }: { holderName: string }) {
  const router = useRouter();
  const [name, setName] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [signed, setSigned] = useState(false);

  async function handleSign() {
    if (!name.trim() || !agreed) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/program-holder/mou/sign-typed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ typedName: name.trim() }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || 'Failed to sign MOU');
      }
      setSigned(true);
      setTimeout(() => router.push('/program-holder/dashboard'), 2000);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  if (signed) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-xl p-8 text-center">
        <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
        <h3 className="text-lg font-bold text-green-800 mb-1">MOU Signed</h3>
        <p className="text-green-700 text-sm">Redirecting to your dashboard...</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 mt-6">
      <h3 className="text-base font-bold text-slate-900 mb-4">Sign this Agreement</h3>

      <div className="bg-slate-50 rounded-lg p-4 mb-5 text-sm text-slate-600 leading-relaxed">
        By signing below, <strong>{holderName}</strong> agrees to the terms of this Memorandum of Understanding with Elevate for Humanity Career & Technical Institute, including program delivery standards, reporting requirements, and compliance obligations.
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Type your full legal name to sign
        </label>
        <input
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="Full legal name"
          className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue-500"
        />
        {name && (
          <p className="mt-2 font-signature text-2xl text-slate-700 italic pl-1">{name}</p>
        )}
      </div>

      <label className="flex items-start gap-3 mb-5 cursor-pointer">
        <input
          type="checkbox"
          checked={agreed}
          onChange={e => setAgreed(e.target.checked)}
          className="mt-0.5 w-4 h-4 rounded border-slate-300 text-brand-blue-600"
        />
        <span className="text-sm text-slate-600">
          I have read and agree to the terms of this Memorandum of Understanding. I understand this constitutes a legally binding agreement.
        </span>
      </label>

      {error && <p className="text-red-600 text-sm mb-4">{error}</p>}

      <button
        onClick={handleSign}
        disabled={!name.trim() || !agreed || loading}
        className="w-full bg-brand-blue-600 hover:bg-brand-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
      >
        {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Signing...</> : 'Sign & Submit MOU'}
      </button>
      <p className="text-xs text-slate-400 text-center mt-2">
        Signed {new Date().toLocaleDateString()} · IP recorded for compliance
      </p>
    </div>
  );
}
