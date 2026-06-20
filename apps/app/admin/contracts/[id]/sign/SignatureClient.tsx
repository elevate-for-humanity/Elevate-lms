'use client';

import { useRef, useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, PenLine, Type, CheckCircle2, AlertTriangle, Loader2, ChevronRight } from 'lucide-react';

export default function SignatureClient({
  contractId,
  contractTitle,
  agencyName,
  runId,
  runStatus,
  missingCount,
  existingSignature,
  defaultSignerName,
  defaultSignerEmail,
}: {
  contractId: string;
  contractTitle: string;
  agencyName: string | null;
  runId: string;
  runStatus: string;
  missingCount: number;
  existingSignature: { id: string; signer_name: string | null; signer_title: string | null; signed_at: string | null } | null;
  defaultSignerName: string;
  defaultSignerEmail: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [mode, setMode] = useState<'draw' | 'typed'>('typed');
  const [signerName, setSignerName]   = useState(defaultSignerName);
  const [signerTitle, setSignerTitle] = useState('');
  const [signerEmail, setSignerEmail] = useState(defaultSignerEmail);
  const [typedName, setTypedName]     = useState(defaultSignerName);
  const [drawing, setDrawing]         = useState(false);
  const [hasDrawing, setHasDrawing]   = useState(false);
  const [saving, setSaving]           = useState(false);
  const [error, setError]             = useState<string | null>(null);
  const [signed, setSigned]           = useState(!!existingSignature?.signed_at);
  const [signedAt, setSignedAt]       = useState(existingSignature?.signed_at ?? null);

  // Canvas drawing
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  }, [mode]);

  function startDraw(e: React.MouseEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    ctx.beginPath();
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
    setDrawing(true);
  }

  function draw(e: React.MouseEvent<HTMLCanvasElement>) {
    if (!drawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx.stroke();
    setHasDrawing(true);
  }

  function stopDraw() { setDrawing(false); }

  function clearCanvas() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawing(false);
  }

  async function submitSignature() {
    if (!signerName.trim()) { setError('Signer name is required'); return; }
    if (mode === 'draw' && !hasDrawing) { setError('Please draw your signature'); return; }
    if (mode === 'typed' && !typedName.trim()) { setError('Please type your name'); return; }

    setSaving(true);
    setError(null);

    let signatureData: string | undefined;
    if (mode === 'draw') {
      signatureData = canvasRef.current?.toDataURL('image/png');
    }

    try {
      const res = await fetch('/api/admin/contracts/sign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contract_id: contractId,
          run_id: runId,
          signer_name: signerName.trim(),
          signer_title: signerTitle.trim() || undefined,
          signer_email: signerEmail.trim() || undefined,
          signature_type: mode,
          signature_data: signatureData,
          typed_name: mode === 'typed' ? typedName.trim() : undefined,
          page_number: 1,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? `HTTP ${res.status}`);
      setSigned(true);
      setSignedAt(data.signed_at);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Signature failed');
    } finally {
      setSaving(false);
    }
  }

  if (signed) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center space-y-6">
        <div className="flex justify-center">
          <CheckCircle2 className="w-16 h-16 text-green-500" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900">Document Signed</h1>
        <p className="text-slate-500">
          Signed by <strong>{signerName}</strong>
          {signerTitle && <> ({signerTitle})</>}
          {signedAt && <> on {new Date(signedAt).toLocaleString()}</>}.
        </p>
        <p className="text-sm text-slate-400">
          This signature is recorded in the audit log. Export the final document to generate the signed PDF.
        </p>
        <div className="flex justify-center gap-3">
          <Link
            href={`/admin/contracts/${contractId}/export?run=${runId}`}
            className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-700 transition-colors"
          >
            Export document <ChevronRight className="w-4 h-4" />
          </Link>
          <Link
            href={`/admin/contracts/${contractId}`}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
          >
            Back to contract
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
      <div>
        <nav className="flex items-center gap-1.5 text-xs text-slate-500 mb-2">
          <Link href={`/admin/contracts/${contractId}`} className="hover:text-slate-700 flex items-center gap-1">
            <ArrowLeft className="w-3 h-3" /> {contractTitle}
          </Link>
          <ChevronRight className="w-3 h-3" />
          <span className="text-slate-900">Sign</span>
        </nav>
        <h1 className="text-2xl font-bold text-slate-900">Sign Document</h1>
        {agencyName && <p className="text-sm text-slate-500 mt-1">{agencyName}</p>}
      </div>

      {missingCount > 0 && (
        <div className="rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-amber-800">
              {missingCount} field{missingCount !== 1 ? 's' : ''} still need admin input
            </p>
            <p className="text-xs text-amber-700 mt-0.5">
              You can sign now, but the exported document will have blank fields.{' '}
              <Link href={`/admin/contracts/${contractId}/prefill?run=${runId}`} className="underline">
                Review fields first
              </Link>
            </p>
          </div>
        </div>
      )}

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-6 space-y-5">
        {/* Signer info */}
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="text-sm font-medium text-slate-700">Full name <span className="text-red-500">*</span></span>
            <input value={signerName} onChange={e => setSignerName(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-300" />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-slate-700">Title</span>
            <input value={signerTitle} onChange={e => setSignerTitle(e.target.value)}
              placeholder="e.g. Executive Director"
              className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-300" />
          </label>
          <label className="block sm:col-span-2">
            <span className="text-sm font-medium text-slate-700">Email</span>
            <input value={signerEmail} onChange={e => setSignerEmail(e.target.value)} type="email"
              className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-300" />
          </label>
        </div>

        {/* Mode toggle */}
        <div className="flex rounded-xl border border-slate-200 overflow-hidden">
          {(['typed', 'draw'] as const).map(m => (
            <button key={m} onClick={() => setMode(m)}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-semibold transition-colors ${
                mode === m ? 'bg-slate-900 text-white' : 'bg-white text-slate-600 hover:bg-slate-50'
              }`}>
              {m === 'typed' ? <><Type className="w-4 h-4" /> Type name</> : <><PenLine className="w-4 h-4" /> Draw signature</>}
            </button>
          ))}
        </div>

        {/* Signature input */}
        {mode === 'typed' ? (
          <div>
            <label className="block">
              <span className="text-sm font-medium text-slate-700">Type your full name</span>
              <input
                value={typedName}
                onChange={e => setTypedName(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-300 px-4 py-3 text-2xl outline-none focus:ring-2 focus:ring-slate-300"
                style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic' }}
                placeholder="Your name"
              />
            </label>
            <p className="mt-1 text-xs text-slate-400">
              By typing your name, you are applying your electronic signature to this document.
            </p>
          </div>
        ) : (
          <div>
            <p className="text-sm font-medium text-slate-700 mb-2">Draw your signature</p>
            <div className="rounded-xl border-2 border-dashed border-slate-300 overflow-hidden bg-slate-50">
              <canvas
                ref={canvasRef}
                width={560}
                height={140}
                className="w-full cursor-crosshair touch-none"
                onMouseDown={startDraw}
                onMouseMove={draw}
                onMouseUp={stopDraw}
                onMouseLeave={stopDraw}
              />
            </div>
            <button onClick={clearCanvas} className="mt-2 text-xs text-slate-500 hover:text-slate-700 underline">
              Clear
            </button>
          </div>
        )}

        {/* Legal notice */}
        <div className="rounded-xl bg-slate-50 border border-slate-200 px-4 py-3 text-xs text-slate-500">
          By signing, you confirm that you are authorized to sign on behalf of {signerName || 'your organization'} and that all information in this document is accurate to the best of your knowledge.
          This signature is recorded with a timestamp and IP address for audit purposes.
          <strong className="text-slate-700"> This document will not be submitted automatically.</strong>
        </div>

        {error && (
          <p className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{error}</p>
        )}

        <div className="flex gap-3">
          <button
            onClick={submitSignature}
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-700 disabled:opacity-50 transition-colors"
          >
            {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</> : <><PenLine className="w-4 h-4" /> Apply signature</>}
          </button>
          <Link href={`/admin/contracts/${contractId}/prefill?run=${runId}`}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors">
            Back to review
          </Link>
        </div>
      </div>
    </div>
  );
}
