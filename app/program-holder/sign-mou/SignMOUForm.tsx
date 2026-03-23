'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import SignaturePad from 'signature_pad';
import { Check, Loader2, Pen, Type, CheckSquare, Lock, AlertCircle } from 'lucide-react';

type Method = 'checkbox' | 'typed' | 'drawn';

export function SignMOUForm() {
  const router = useRouter();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [pad, setPad] = useState<SignaturePad | null>(null);

  const [method, setMethod] = useState<Method>('checkbox');
  const [signerName, setSignerName] = useState('');
  const [signerEmail, setSignerEmail] = useState('');
  const [signerTitle, setSignerTitle] = useState('');
  const [typed, setTyped] = useState('');
  const [drawn, setDrawn] = useState<string | null>(null);
  const [acknowledged, setAcknowledged] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [alreadySigned, setAlreadySigned] = useState(false);
  const [loading, setLoading] = useState(true);

  // Pre-fill name + email; check if already signed
  useEffect(() => {
    import('@/lib/supabase/client').then(({ createBrowserClient }) => {
      const supabase = createBrowserClient();
      supabase.auth.getUser().then(async ({ data }) => {
        if (!data?.user) { setLoading(false); return; }
        if (data.user.email) setSignerEmail(data.user.email);
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name, email')
          .eq('id', data.user.id)
          .single();
        if (profile?.full_name) setSignerName(profile.full_name);
        if (profile?.email) setSignerEmail(profile.email);

        const { data: existing } = await supabase
          .from('license_agreement_acceptances')
          .select('id')
          .eq('user_id', data.user.id)
          .eq('agreement_type', 'mou')
          .maybeSingle();
        if (existing) setAlreadySigned(true);
        setLoading(false);
      });
    });
  }, []);

  // Init drawn signature pad when method switches to 'drawn'
  useEffect(() => {
    if (method !== 'drawn' || !canvasRef.current || pad) return;
    const instance = new SignaturePad(canvasRef.current, {
      backgroundColor: 'rgb(255,255,255)',
      penColor: 'rgb(15,23,42)',
    });
    instance.addEventListener('endStroke', () => {
      if (!instance.isEmpty()) setDrawn(instance.toDataURL('image/png'));
    });
    const resize = () => {
      if (!canvasRef.current) return;
      const ratio = Math.max(window.devicePixelRatio || 1, 1);
      canvasRef.current.width = canvasRef.current.offsetWidth * ratio;
      canvasRef.current.height = canvasRef.current.offsetHeight * ratio;
      canvasRef.current.getContext('2d')?.scale(ratio, ratio);
      instance.clear();
      setDrawn(null);
    };
    resize();
    window.addEventListener('resize', resize);
    setPad(instance);
    return () => { window.removeEventListener('resize', resize); instance.off(); };
  }, [method, pad]);

  // Reset pad state when switching away from drawn
  useEffect(() => {
    if (method !== 'drawn') { setPad(null); setDrawn(null); }
  }, [method]);

  const isValid = () => {
    if (!signerName.trim() || !signerEmail.trim() || !acknowledged) return false;
    if (method === 'typed') return typed.trim().length > 1;
    if (method === 'drawn') return drawn !== null;
    return true; // checkbox
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid()) return;
    setIsSubmitting(true);
    setError('');

    try {
      const res = await fetch('/api/legal/sign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agreements: ['mou'],
          signer_name: signerName.trim(),
          signer_email: signerEmail.trim(),
          signer_title: signerTitle.trim() || undefined,
          signature_method: method,
          signature_typed: method === 'typed' ? typed.trim() : undefined,
          signature_data: method === 'drawn' ? drawn : undefined,
          context: 'onboarding',
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to sign MOU');

      router.push('/program-holder/dashboard?mou=signed');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to sign MOU');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return null;

  if (alreadySigned) {
    return (
      <div className="flex items-center gap-3 bg-brand-green-50 border border-brand-green-200 rounded-xl p-5">
        <div className="w-10 h-10 bg-brand-green-600 rounded-full flex items-center justify-center flex-shrink-0">
          <Check className="w-5 h-5 text-white" />
        </div>
        <div>
          <p className="font-bold text-brand-green-800">MOU already signed.</p>
          <p className="text-sm text-brand-green-700 mt-0.5">Your signature is on file.</p>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Signer information */}
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="signerName" className="block text-sm font-medium text-slate-700 mb-1">
            Full Legal Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="signerName"
            required
            value={signerName}
            onChange={(e) => setSignerName(e.target.value)}
            className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-brand-blue-500 text-sm"
            placeholder="Your full legal name"
          />
        </div>
        <div>
          <label htmlFor="signerTitle" className="block text-sm font-medium text-slate-700 mb-1">
            Title / Position
          </label>
          <input
            type="text"
            id="signerTitle"
            value={signerTitle}
            onChange={(e) => setSignerTitle(e.target.value)}
            className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-brand-blue-500 text-sm"
            placeholder="Owner, Director, etc."
          />
        </div>
      </div>

      {/* Signature method selector */}
      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-2">Signature Method</label>
        <div className="flex gap-3 flex-wrap">
          {([
            { m: 'checkbox' as Method, Icon: CheckSquare, label: 'Checkbox' },
            { m: 'typed' as Method, Icon: Type, label: 'Type' },
            { m: 'drawn' as Method, Icon: Pen, label: 'Draw' },
          ]).map(({ m, Icon, label }) => (
            <button
              key={m}
              type="button"
              onClick={() => setMethod(m)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border-2 text-sm font-medium transition-colors ${
                method === m
                  ? 'border-brand-blue-600 bg-brand-blue-50 text-brand-blue-700'
                  : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
              }`}
            >
              <Icon className="w-4 h-4" /> {label}
            </button>
          ))}
        </div>
      </div>

      {/* Typed signature input */}
      {method === 'typed' && (
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1.5">
            Type Your Signature <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            placeholder="Type your full name"
            className="w-full max-w-md px-4 py-3 border border-slate-300 rounded-lg text-2xl focus:ring-2 focus:ring-brand-blue-500"
            style={{ fontFamily: "'Brush Script MT', cursive" }}
          />
        </div>
      )}

      {/* Drawn signature canvas */}
      {method === 'drawn' && (
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1.5">
            Draw Your Signature <span className="text-red-500">*</span>
          </label>
          <div className="border-2 border-slate-300 rounded-xl overflow-hidden bg-white max-w-md">
            <canvas
              ref={canvasRef}
              style={{ width: '100%', height: '140px', touchAction: 'none', display: 'block' }}
            />
          </div>
          <button
            type="button"
            onClick={() => { pad?.clear(); setDrawn(null); }}
            className="text-xs text-brand-blue-600 hover:underline mt-1.5"
          >
            Clear
          </button>
        </div>
      )}

      {/* Acknowledgment checkbox */}
      <label className="flex items-start gap-3 cursor-pointer p-4 bg-slate-50 rounded-xl border border-slate-200 hover:bg-slate-100 transition-colors">
        <input
          type="checkbox"
          checked={acknowledged}
          onChange={(e) => setAcknowledged(e.target.checked)}
          className="mt-0.5 w-5 h-5 text-brand-blue-600 border-slate-300 rounded focus:ring-brand-blue-500"
        />
        <span className="text-sm text-slate-700 leading-relaxed">
          I have read and agree to the terms of this Memorandum of Understanding. I understand this digital signature is legally binding under the E-SIGN Act.
        </span>
      </label>

      {/* Error message */}
      {error && (
        <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl p-4">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-wrap items-center gap-4">
        <button
          type="button"
          onClick={() => router.back()}
          className="px-6 py-3 border border-slate-300 text-slate-700 rounded-lg font-semibold hover:bg-slate-50 transition"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={!isValid() || isSubmitting}
          className={`inline-flex items-center gap-2 px-8 py-3 rounded-xl font-semibold text-base transition-colors ${
            isValid() && !isSubmitting
              ? 'bg-brand-blue-600 text-white hover:bg-brand-blue-700'
              : 'bg-slate-200 text-slate-400 cursor-not-allowed'
          }`}
        >
          {isSubmitting
            ? <><Loader2 className="w-5 h-5 animate-spin" /> Signing...</>
            : <><Check className="w-5 h-5" /> Sign MOU</>
          }
        </button>
        <p className="text-xs text-slate-500 flex items-center gap-1.5">
          <Lock className="w-3 h-3" /> Signature, IP address, and timestamp recorded securely.
        </p>
      </div>
    </form>
  );
}
