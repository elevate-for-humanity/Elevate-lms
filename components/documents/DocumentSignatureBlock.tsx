'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import SignatureCanvas from 'signature_pad';
import { Check, Loader2, Pen, Type, CheckSquare, Lock, AlertCircle } from 'lucide-react';

interface Props {
  agreementType: string;
  agreementVersion?: string;
  /** Where to redirect after signing. Defaults to /lms/dashboard */
  nextUrl?: string;
  /** Label shown on the sign button */
  buttonLabel?: string;
}

type Method = 'checkbox' | 'typed' | 'drawn';

export function DocumentSignatureBlock({
  agreementType,
  agreementVersion = '1.0',
  nextUrl = '/lms/dashboard',
  buttonLabel = 'Sign & Continue',
}: Props) {
  const router = useRouter();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [pad, setPad] = useState<SignatureCanvas | null>(null);

  const [method, setMethod] = useState<Method>('checkbox');
  const [signerName, setSignerName] = useState('');
  const [typed, setTyped] = useState('');
  const [drawn, setDrawn] = useState<string | null>(null);
  const [acknowledged, setAcknowledged] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [signed, setSigned] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [alreadySigned, setAlreadySigned] = useState(false);
  const [loading, setLoading] = useState(true);

  // Pre-fill name and check if already signed
  useEffect(() => {
    import('@/lib/supabase/client').then(({ createClient }) => {
      const supabase = createClient();
      supabase?.auth.getUser().then(async ({ data }) => {
        if (!data?.user) { setLoading(false); return; }
        const { data: profile } = await supabase
          .from('profiles').select('full_name').eq('id', data.user.id).single();
        if (profile?.full_name) setSignerName(profile.full_name);

        const { data: existing } = await supabase
          .from('license_agreement_acceptances')
          .select('id')
          .eq('user_id', data.user.id)
          .eq('agreement_type', agreementType)
          .eq('document_version', agreementVersion)
          .maybeSingle();
        if (existing) setAlreadySigned(true);
        setLoading(false);
      });
    });
  }, [agreementType, agreementVersion]);

  // Init signature pad
  useEffect(() => {
    if (method !== 'drawn' || !canvasRef.current || pad) return;
    const instance = new SignatureCanvas(canvasRef.current, {
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

  const isValid = () => {
    if (!signerName.trim() || !acknowledged) return false;
    if (method === 'typed') return typed.trim().length > 0;
    if (method === 'drawn') return drawn !== null;
    return true;
  };

  const handleSign = async () => {
    if (!isValid()) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch('/api/legal/sign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agreements: [agreementType],
          signer_name: signerName.trim(),
          signature_method: method,
          signature_typed: method === 'typed' ? typed.trim() : undefined,
          signature_data: method === 'drawn' ? drawn : undefined,
          context: 'document',
        }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || 'Failed to sign');
      }
      setSigned(true);
      setTimeout(() => router.push(nextUrl), 1800);
    } catch (e: any) {
      setError(e.message || 'Failed to process signature. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return null;

  if (alreadySigned || signed) {
    return (
      <div className="mt-12 border-t-2 border-brand-green-200 pt-8">
        <div className="flex items-center gap-3 bg-brand-green-50 border border-brand-green-200 rounded-xl p-5">
          <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center flex-shrink-0">
            <Check className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="font-bold text-brand-green-800">
              {signed ? 'Agreement signed successfully.' : 'You have already signed this agreement.'}
            </p>
            <p className="text-sm text-brand-green-700 mt-0.5">
              {signed ? 'Redirecting you now...' : 'Your signature is on file.'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-12 border-t-2 border-slate-200 pt-8 print:hidden">
      <h2 className="text-xl font-bold text-slate-900 mb-1">Sign This Agreement</h2>
      <p className="text-sm text-slate-500 mb-6">
        By signing below you confirm you have read and agree to the terms above.
      </p>

      {error && (
        <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      <div className="space-y-5">
        {/* Full name */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1.5">
            Full Legal Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={signerName}
            onChange={(e) => setSignerName(e.target.value)}
            placeholder="Enter your full legal name"
            className="w-full max-w-md px-4 py-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-blue-500 focus:border-brand-blue-500"
          />
        </div>

        {/* Method selector */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">Signature Method</label>
          <div className="flex gap-3">
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

        {/* Typed */}
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

        {/* Drawn */}
        {method === 'drawn' && (
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">
              Draw Your Signature <span className="text-red-500">*</span>
            </label>
            <div className="border-2 border-slate-300 rounded-xl overflow-hidden bg-white max-w-md">
              <canvas ref={canvasRef} style={{ width: '100%', height: '140px', touchAction: 'none' }} />
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

        {/* Acknowledgment */}
        <label className="flex items-start gap-3 cursor-pointer p-4 bg-slate-50 rounded-xl border border-slate-200 hover:bg-slate-100 transition-colors max-w-2xl">
          <input
            type="checkbox"
            checked={acknowledged}
            onChange={(e) => setAcknowledged(e.target.checked)}
            className="mt-0.5 w-5 h-5 text-brand-blue-600 border-slate-300 rounded focus:ring-brand-blue-500"
          />
          <span className="text-sm text-slate-700 leading-relaxed">
            I have read and understand this agreement in full. I agree to be bound by its terms. I understand this constitutes a legally binding electronic signature under the Electronic Signatures in Global and National Commerce Act (E-SIGN).
          </span>
        </label>

        {/* Submit */}
        <div className="flex items-center gap-4">
          <button
            onClick={handleSign}
            disabled={!isValid() || submitting}
            className={`inline-flex items-center gap-2 px-8 py-3 rounded-xl font-semibold text-base transition-colors ${
              isValid() && !submitting
                ? 'bg-brand-blue-600 text-white hover:bg-brand-blue-700'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            }`}
          >
            {submitting
              ? <><Loader2 className="w-5 h-5 animate-spin" /> Signing...</>
              : <><Check className="w-5 h-5" /> {buttonLabel}</>
            }
          </button>
          <p className="text-xs text-slate-500 flex items-center gap-1.5">
            <Lock className="w-3 h-3" /> Signature, IP address, and timestamp recorded securely.
          </p>
        </div>
      </div>
    </div>
  );
}
