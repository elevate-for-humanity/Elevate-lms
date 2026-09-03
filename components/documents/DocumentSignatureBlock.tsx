'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import SignaturePad from 'signature_pad';
import { Check, Loader2, Lock } from 'lucide-react';
import { signAgreement } from '@/apps/marketing/app/actions/sign-agreement';

type Method = 'checkbox' | 'typed' | 'drawn';

type Props = {
  agreementType: string;
  agreementVersion?: string;
  nextUrl?: string;
  buttonLabel?: string;
};

export function DocumentSignatureBlock({
  agreementType,
  agreementVersion = '1.0',
  nextUrl = '/lms/dashboard',
  buttonLabel = 'Sign & Continue',
}: Props) {
  const router = useRouter();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const padRef = useRef<SignaturePad | null>(null);
  const [method, setMethod] = useState<Method>('checkbox');
  const [legalName, setLegalName] = useState('');
  const [typedName, setTypedName] = useState('');
  const [drawnSignature, setDrawnSignature] = useState<string | null>(null);
  const [acknowledged, setAcknowledged] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (method !== 'drawn' || !canvasRef.current) return;
    const pad = new SignaturePad(canvasRef.current, {
      backgroundColor: 'rgb(255,255,255)',
      penColor: 'rgb(15,23,42)',
    });
    padRef.current = pad;
    const sync = () => {
      if (!pad.isEmpty()) setDrawnSignature(pad.toDataURL('image/png'));
    };
    pad.addEventListener('endStroke', sync);
    return () => {
      pad.removeEventListener('endStroke', sync);
      pad.off();
      padRef.current = null;
    };
  }, [method]);

  const valid =
    legalName.trim().length > 1 &&
    acknowledged &&
    (method === 'checkbox' ||
      (method === 'typed' && typedName.trim().length > 1) ||
      (method === 'drawn' && Boolean(drawnSignature)));

  async function handleSign() {
    if (!valid) return;
    setSubmitting(true);
    setMessage(null);
    try {
      const result = await signAgreement({
        agreementType,
        agreementVersion,
        method,
        typedName: method === 'typed' ? typedName.trim() : legalName.trim(),
        signature: method === 'drawn' ? drawnSignature ?? undefined : undefined,
      });
      if ('error' in result && typeof result.error === 'string') {
        throw new Error(result.error);
      }
      setMessage('Agreement signed successfully.');
      window.setTimeout(() => router.push(nextUrl), 700);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to record signature.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="mt-10 border-t border-slate-200 pt-8 print:hidden">
      <h2 className="text-xl font-bold text-slate-950">Sign this agreement</h2>
      <p className="mt-1 text-sm text-slate-600">Your signature method, timestamp, and agreement version are recorded.</p>

      {message ? <p className="mt-4 rounded-lg bg-slate-50 p-3 text-sm text-slate-800">{message}</p> : null}

      <div className="mt-5 space-y-4">
        <label className="block">
          <span className="text-sm font-semibold text-slate-800">Full legal name</span>
          <input
            value={legalName}
            onChange={(event) => setLegalName(event.target.value)}
            className="mt-1 w-full max-w-md rounded-lg border border-slate-300 px-3 py-2"
          />
        </label>

        <div className="flex flex-wrap gap-2">
          {(['checkbox', 'typed', 'drawn'] as Method[]).map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => {
                setMethod(option);
                setDrawnSignature(null);
              }}
              className={`rounded-lg border px-4 py-2 text-sm font-semibold ${method === option ? 'border-brand-blue-600 bg-brand-blue-50 text-brand-blue-800' : 'border-slate-300 text-slate-700'}`}
            >
              {option === 'checkbox' ? 'Acknowledge' : option === 'typed' ? 'Type signature' : 'Draw signature'}
            </button>
          ))}
        </div>

        {method === 'typed' ? (
          <input
            aria-label="Typed signature"
            value={typedName}
            onChange={(event) => setTypedName(event.target.value)}
            placeholder="Type your signature"
            className="w-full max-w-md rounded-lg border border-slate-300 px-3 py-3 text-xl"
          />
        ) : null}

        {method === 'drawn' ? (
          <div className="max-w-md">
            <canvas ref={canvasRef} width={520} height={150} className="h-36 w-full rounded-lg border border-slate-300 bg-white" />
            <button
              type="button"
              onClick={() => {
                padRef.current?.clear();
                setDrawnSignature(null);
              }}
              className="mt-2 text-sm font-semibold text-brand-blue-700"
            >
              Clear signature
            </button>
          </div>
        ) : null}

        <label className="flex max-w-2xl items-start gap-3 rounded-xl bg-slate-50 p-4 text-sm text-slate-700">
          <input type="checkbox" checked={acknowledged} onChange={(event) => setAcknowledged(event.target.checked)} className="mt-1" />
          I have read and understand this agreement and consent to use this electronic signature.
        </label>

        <button
          type="button"
          onClick={() => void handleSign()}
          disabled={!valid || submitting}
          className="inline-flex items-center gap-2 rounded-xl bg-brand-blue-700 px-6 py-3 font-bold text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
          {buttonLabel}
        </button>
        <p className="flex items-center gap-1 text-xs text-slate-500"><Lock className="h-3 w-3" /> Secure electronic signature</p>
      </div>
    </section>
  );
}
