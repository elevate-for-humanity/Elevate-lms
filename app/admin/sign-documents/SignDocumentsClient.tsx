'use client';

import { useState } from 'react';
import SignaturePad from '@/components/SignaturePad';
import { FileText, CheckCircle, Loader2, Send, RotateCcw } from 'lucide-react';

type Step = 'draw' | 'preview' | 'sending' | 'done' | 'error';

const DOCUMENTS = [
  {
    id: 'w9',
    label: 'IRS Form W-9',
    description: 'Pre-filled with EIN 88-2609728 for 2Exclusive LLC-S DBA Elevate for Humanity',
  },
  {
    id: 'ach',
    label: 'APM ACH Enrollment Form',
    description: 'Sunrise Banks — Routing 091017138 / Account 692101663981',
  },
];

export function SignDocumentsClient() {
  const [step, setStep] = useState<Step>('draw');
  const [signatureDataUrl, setSignatureDataUrl] = useState<string | null>(null);
  const [selected, setSelected] = useState<string[]>(['w9', 'ach']);
  const [resultMsg, setResultMsg] = useState('');

  const handleSave = (dataUrl: string) => {
    setSignatureDataUrl(dataUrl);
    setStep('preview');
  };

  const toggleDoc = (id: string) => {
    setSelected(prev =>
      prev.includes(id) ? prev.filter(d => d !== id) : [...prev, id]
    );
  };

  const handleSend = async () => {
    if (!signatureDataUrl || selected.length === 0) return;
    setStep('sending');
    try {
      const res = await fetch('/api/admin/sign-documents/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ signatureDataUrl, documents: selected }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Send failed');
      setResultMsg(data.message || 'Sent successfully');
      setStep('done');
    } catch (err: unknown) {
      setResultMsg(err instanceof Error ? err.message : 'Unknown error');
      setStep('error');
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Sign Documents</h1>
        <p className="text-gray-500 mt-1 text-sm">
          Draw your signature below. It will be embedded into the selected documents and emailed to you.
        </p>
      </div>

      {/* Step: Draw */}
      {(step === 'draw' || step === 'preview') && (
        <div className="space-y-8">
          {/* Signature pad */}
          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
            <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">
              Your Signature
            </h2>
            {step === 'draw' ? (
              <SignaturePad onSave={handleSave} height={160} />
            ) : (
              <div className="space-y-4">
                {/* Preview */}
                <div className="border-2 border-green-200 rounded-lg bg-green-50 p-4 flex items-center justify-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={signatureDataUrl!}
                    alt="Your signature"
                    className="max-h-24 object-contain"
                  />
                </div>
                <button
                  onClick={() => { setSignatureDataUrl(null); setStep('draw'); }}
                  className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700"
                >
                  <RotateCcw className="w-4 h-4" /> Redraw signature
                </button>
              </div>
            )}
          </div>

          {/* Document selection */}
          {step === 'preview' && (
            <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
              <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">
                Select Documents to Sign
              </h2>
              <div className="space-y-3">
                {DOCUMENTS.map(doc => (
                  <label
                    key={doc.id}
                    className={`flex items-start gap-4 p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                      selected.includes(doc.id)
                        ? 'border-red-500 bg-red-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selected.includes(doc.id)}
                      onChange={() => toggleDoc(doc.id)}
                      className="mt-0.5 accent-red-600"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-red-600" />
                        <span className="font-medium text-gray-900 text-sm">{doc.label}</span>
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">{doc.description}</p>
                    </div>
                  </label>
                ))}
              </div>

              <div className="mt-6 pt-4 border-t border-gray-100">
                <p className="text-xs text-gray-400 mb-4">
                  Signed PDFs will be emailed to <strong>Elevate4humanityedu@gmail.com</strong>
                </p>
                <button
                  onClick={handleSend}
                  disabled={selected.length === 0}
                  className="w-full flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
                >
                  <Send className="w-4 h-4" />
                  Sign &amp; Send {selected.length} Document{selected.length !== 1 ? 's' : ''}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Step: Sending */}
      {step === 'sending' && (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <Loader2 className="w-10 h-10 text-red-600 animate-spin" />
          <p className="text-gray-600 font-medium">Embedding signature and sending PDFs…</p>
        </div>
      )}

      {/* Step: Done */}
      {step === 'done' && (
        <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
          <CheckCircle className="w-14 h-14 text-green-500" />
          <h2 className="text-xl font-bold text-gray-900">Documents Sent</h2>
          <p className="text-gray-500 text-sm max-w-sm">{resultMsg}</p>
          <button
            onClick={() => { setStep('draw'); setSignatureDataUrl(null); setSelected(['w9', 'ach']); }}
            className="mt-4 text-sm text-red-600 hover:underline"
          >
            Sign another document
          </button>
        </div>
      )}

      {/* Step: Error */}
      {step === 'error' && (
        <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
          <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center">
            <span className="text-2xl">✗</span>
          </div>
          <h2 className="text-xl font-bold text-gray-900">Send Failed</h2>
          <p className="text-red-500 text-sm max-w-sm">{resultMsg}</p>
          <button
            onClick={() => setStep('preview')}
            className="mt-4 text-sm text-red-600 hover:underline"
          >
            Try again
          </button>
        </div>
      )}
    </div>
  );
}
