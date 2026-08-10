'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { signAgreement } from '@/apps/marketing/app/actions/sign-agreement';
import SignatureCanvas from 'signature_pad';
import { Check, Loader2, Pen, Type, CheckSquare, Lock, AlertCircle } from 'lucide-react';

interface Props {
  agreementType: string;
  agreementVersion?: string;
  nextUrl?: string;
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
  const [signerEmail, setSignerEmail] = useState('');

  useEffect(() => {
    let cancelled = false;
    void import('@/lib/supabase/client').then(async ({ createClient }) => {
      const supabase = createClient();
      const { data } = await supabase.auth.getUser();
      if (cancelled) return;
      if (!data?.user) {
        setLoading(false);
        return;
      }
      setSignerEmail(data.user.email ?? '');
      const [{ data: profile }, { data: existing }] = await Promise.all([
        supabase.from('profiles').select('full_name').eq('id', data.user.id).maybeSingle(),
        supabase
          .from('license_agreement_acceptances')
          .select('id')
          .eq('user_id', data.user.id)
          .eq('agreement_type', agreementType)
          .eq('document_version', agreementVersion)
          .maybeSingle(),
      ]);
      if (cancelled) return;
      if (profile?.full_name) setSignerName(profile.full_name);
      if (existing) setAlreadySigned(true);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [agreementType, agreementVersion]);

  useEffect(() => {
    if (method !== 'drawn' || !canvasRef.current || pad) return undefined;
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
    return () => {
      window.removeEventListener('resize', resize);
      instance.off();
    };
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
      const result = await signAgreement({
        agreementType,
        agreementVersion,
        signerName: signerName.trim(),
        signerEmail,
        signatureMethod: method,
        signatureTyped: method === 'typed' ? typed.trim() : undefined,
        signatureData: method === 'drawn' ? drawn ?? undefined : undefined,
        context: 'onboarding',
      });
      if ('error' in result && result.error) throw new Error(result.error);
      setSigned(true);
      setTimeout(() => router.push(nextUrl), 1800);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Failed to process signature. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return null;

  if (alreadySigned || signed) {
    return (
      <div className="mt-12 border-t-2 border-emerald-200 pt-8">
        <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-5">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-700">
            <Check className="h-5 w-5 text-white" />
          </div>
          <div>
            <p className="font-bold text-emerald-900">{signed ? 'Agreement signed successfully.' : 'You have already signed this agreement.'}</p>
            <p className="mt-0.5 text-sm text-emerald-800">{signed ? 'Redirecting you now...' : 'Your signature is on file.'}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-12 border-t-2 border-slate-200 pt-8 print:hidden">
      <h2 className="mb-1 text-xl font-bold text-slate-900">Sign This Agreement</h2>
      <p className="mb-6 text-sm text-slate-600">By signing below you confirm you have read and agree to the terms above.</p>
      {error ? (
        <div className="mb-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-700" />
          <p className="text-sm text-red-800">{error}</p>
        </div>
      ) : null}

      <div className="space-y-5">
        <div>
          <label className="mb-1.5 block text-sm font-semibold text-slate-800">Full Legal Name <span className="text-red-600">*</span></label>
          <input type="text" value={signerName} onChange={(event) => setSignerName(event.target.value)} placeholder="Enter your full legal name" className="w-full max-w-md rounded-lg border border-slate-300 px-4 py-2.5 text-sm focus:border-blue-600 focus:ring-2 focus:ring-blue-500" />
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-800">Signature Method</label>
          <div className="flex flex-wrap gap-3">
            {[
              { method: 'checkbox' as Method, Icon: CheckSquare, label: 'Checkbox' },
              { method: 'typed' as Method, Icon: Type, label: 'Type' },
              { method: 'drawn' as Method, Icon: Pen, label: 'Draw' },
            ].map(({ method: option, Icon, label }) => (
              <button key={option} type="button" onClick={() => setMethod(option)} className={`flex items-center gap-2 rounded-lg border-2 px-4 py-2.5 text-sm font-medium transition-colors ${method === option ? 'border-blue-700 bg-blue-50 text-blue-800' : 'border-slate-200 bg-white text-slate-700 hover:border-slate-400'}`}>
                <Icon className="h-4 w-4" /> {label}
              </button>
            ))}
          </div>
        </div>

        {method === 'typed' ? (
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-slate-800">Type Your Signature <span className="text-red-600">*</span></label>
            <input type="text" value={typed} onChange={(event) => setTyped(event.target.value)} placeholder="Type your full name" className="w-full max-w-md rounded-lg border border-slate-300 px-4 py-3 text-2xl focus:ring-2 focus:ring-blue-500" style={{ fontFamily: "'Brush Script MT', cursive" }} />
          </div>
        ) : null}

        {method === 'drawn' ? (
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-slate-800">Draw Your Signature <span className="text-red-600">*</span></label>
            <div className="max-w-md overflow-hidden rounded-xl border-2 border-slate-300 bg-white">
              <canvas ref={canvasRef} style={{ width: '100%', height: '140px', touchAction: 'none' }} />
            </div>
            <button type="button" onClick={() => { pad?.clear(); setDrawn(null); }} className="mt-1.5 text-xs font-bold text-blue-700 hover:underline">Clear</button>
          </div>
        ) : null}

        <label className="flex max-w-2xl cursor-pointer items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 hover:bg-slate-100">
          <input type="checkbox" checked={acknowledged} onChange={(event) => setAcknowledged(event.target.checked)} className="mt-0.5 h-5 w-5 rounded border-slate-300 text-blue-700 focus:ring-blue-500" />
          <span className="text-sm leading-relaxed text-slate-800">I have read and understand this agreement in full. I agree to be bound by its terms and understand this is a legally binding electronic signature.</span>
        </label>

        <div className="flex flex-wrap items-center gap-4">
          <button type="button" onClick={() => void handleSign()} disabled={!isValid() || submitting} className={`inline-flex items-center gap-2 rounded-xl px-8 py-3 text-base font-semibold ${isValid() && !submitting ? 'bg-blue-700 text-white hover:bg-blue-800' : 'cursor-not-allowed bg-slate-200 text-slate-500'}`}>
            {submitting ? <><Loader2 className="h-5 w-5 animate-spin" /> Signing...</> : <><Check className="h-5 w-5" /> {buttonLabel}</>}
          </button>
          <p className="flex items-center gap-1.5 text-xs text-slate-600"><Lock className="h-3 w-3" /> Signature, IP address, and timestamp recorded securely.</p>
        </div>
      </div>
    </div>
  );
}
