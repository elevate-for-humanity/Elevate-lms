'use client';

import { useState } from 'react';
import { SignatureCanvas } from '@/components/SignatureCanvas';
import { CheckCircle, AlertCircle, Download } from 'lucide-react';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

export default function EmployerMOUSignForm({ programs }: { programs: string[] }) {
  const [step, setStep] = useState<'form' | 'sign' | 'done'>('form');

  // Form fields
  const [employerName, setEmployerName] = useState('');
  const [signerName, setSignerName] = useState('');
  const [signerTitle, setSignerTitle] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [city, setCity] = useState('');
  const [selectedPrograms, setSelectedPrograms] = useState<string[]>([]);

  // Signature
  const [signatureData, setSignatureData] = useState('');
  const [agreed, setAgreed] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [pdfUrl, setPdfUrl] = useState('');

  const toggleProgram = (p: string) =>
    setSelectedPrograms((prev) =>
      prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p],
    );

  const handleFormNext = (e: React.FormEvent) => {
    e.preventDefault();
    if (!employerName.trim() || !signerName.trim() || !signerTitle.trim()) {
      setError('Organization name, signer name, and title are required.');
      return;
    }
    if (selectedPrograms.length === 0) {
      setError('Please select at least one program.');
      return;
    }
    setError('');
    setStep('sign');
  };

  const handleSign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signatureData) { setError('Please draw your signature.'); return; }
    if (!agreed) { setError('You must agree to the terms to proceed.'); return; }

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/mou/employer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employer_name: employerName,
          signer_name: signerName,
          signer_title: signerTitle,
          contact_email: contactEmail || undefined,
          contact_phone: contactPhone || undefined,
          city: city || undefined,
          state: 'IN',
          programs: selectedPrograms,
          signed_at: new Date().toISOString(),
          signature_data: signatureData,
          mou_version: '2025-employer-01',
          create_partner: true,
        }),
      });

      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        setError(d.error ?? `Failed to generate MOU. Please try again or call ${PLATFORM_DEFAULTS.supportPhone}.`);
        return;
      }

      // Response is a PDF blob
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      setPdfUrl(url);
      setStep('done');
    } catch {
      setError(`Network error. Please try again or call ${PLATFORM_DEFAULTS.supportPhone}.`);
    } finally {
      setLoading(false);
    }
  };

  const inputCls = "w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500";
  const labelCls = "block text-sm font-medium text-slate-700 mb-1";

  if (step === 'done') {
    return (
      <div className="text-center py-10 space-y-6">
        <CheckCircle className="w-16 h-16 text-emerald-500 mx-auto" />
        <div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">MOU Signed</h2>
          <p className="text-slate-600 max-w-md mx-auto">
            Thank you, <strong>{signerName}</strong>. Your Memorandum of Understanding with
            {PLATFORM_DEFAULTS.orgName} has been executed. A copy has been sent to Elizabeth Greene.
          </p>
        </div>
        {pdfUrl && (
          <a
            href={pdfUrl}
            download={`Elevate-MOU-${employerName.replace(/\s+/g, '-')}.pdf`}
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition"
          >
            <Download className="w-4 h-4" />
            Download Your Signed MOU
          </a>
        )}
        <p className="text-sm text-slate-400">
          Questions? Call Elizabeth directly at {PLATFORM_DEFAULTS.supportPhone} or email{' '}
          <a href="mailto:elevate4humanityedu@gmail.com" className="text-blue-600 hover:underline">
            elevate4humanityedu@gmail.com
          </a>
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 p-3">
          <AlertCircle className="w-4 h-4 text-rose-600 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-rose-700">{error}</p>
        </div>
      )}

      {/* Step 1 — Organization info */}
      {step === 'form' && (
        <form onSubmit={handleFormNext} className="space-y-6">
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-slate-800">Your Organization</h2>
            <div>
              <label className={labelCls}>Organization / Company Name <span className="text-rose-500">*</span></label>
              <input className={inputCls} value={employerName} onChange={e => setEmployerName(e.target.value)} placeholder="e.g. Guiding Angels Care" required />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Your Full Name <span className="text-rose-500">*</span></label>
                <input className={inputCls} value={signerName} onChange={e => setSignerName(e.target.value)} placeholder="First Last" required />
              </div>
              <div>
                <label className={labelCls}>Your Title <span className="text-rose-500">*</span></label>
                <input className={inputCls} value={signerTitle} onChange={e => setSignerTitle(e.target.value)} placeholder="e.g. Owner, Director" required />
              </div>
              <div>
                <label className={labelCls}>Email</label>
                <input type="email" className={inputCls} value={contactEmail} onChange={e => setContactEmail(e.target.value)} />
              </div>
              <div>
                <label className={labelCls}>Phone</label>
                <input type="tel" className={inputCls} value={contactPhone} onChange={e => setContactPhone(e.target.value)} />
              </div>
              <div>
                <label className={labelCls}>City</label>
                <input className={inputCls} value={city} onChange={e => setCity(e.target.value)} placeholder="Indianapolis" />
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <h2 className="text-lg font-semibold text-slate-800">Programs Covered <span className="text-rose-500">*</span></h2>
            <p className="text-sm text-slate-500">Select all programs relevant to your hiring needs.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {programs.map((p) => (
                <label key={p} className="flex items-center gap-3 text-sm text-slate-700 cursor-pointer p-2 rounded-lg hover:bg-slate-50 border border-transparent hover:border-slate-200 transition">
                  <input
                    type="checkbox"
                    checked={selectedPrograms.includes(p)}
                    onChange={() => toggleProgram(p)}
                    className="rounded border-slate-300 text-blue-600 w-4 h-4"
                  />
                  {p}
                </label>
              ))}
            </div>
          </div>

          <button type="submit" className="w-full py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition">
            Continue to Sign →
          </button>
        </form>
      )}

      {/* Step 2 — Sign */}
      {step === 'sign' && (
        <form onSubmit={handleSign} className="space-y-6">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-5 text-sm text-slate-700 space-y-2">
            <p><strong>Organization:</strong> {employerName}</p>
            <p><strong>Signer:</strong> {signerName}, {signerTitle}</p>
            <p><strong>Programs:</strong> {selectedPrograms.join(', ')}</p>
          </div>

          <div className="rounded-xl border border-slate-200 p-5 text-sm text-slate-600 space-y-3 max-h-48 overflow-y-auto">
            <p className="font-semibold text-slate-800">Memorandum of Understanding — Summary</p>
            <p>This MOU establishes {employerName} as an official employer partner of {PLATFORM_DEFAULTS.orgLegalName}. As a partner, you agree to consider qualified Elevate graduates for open positions, participate in career events when available, and share relevant job openings with our network.</p>
            <p>There is <strong>no financial obligation</strong>. This is a hiring partnership only. The MOU is effective for one year and renews automatically. Either party may terminate with 30 days written notice.</p>
            <p>Student personally identifiable information is protected under FERPA and applicable Indiana law.</p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Draw Your Signature <span className="text-rose-500">*</span></label>
            <SignatureCanvas onSignature={setSignatureData} />
          </div>

          <label className="flex items-start gap-3 text-sm text-slate-700 cursor-pointer">
            <input
              type="checkbox"
              checked={agreed}
              onChange={e => setAgreed(e.target.checked)}
              className="rounded border-slate-300 text-blue-600 w-4 h-4 mt-0.5"
            />
            <span>
              I have read and agree to the terms of this Memorandum of Understanding on behalf of <strong>{employerName}</strong>. I confirm I am authorized to sign on behalf of this organization.
            </span>
          </label>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => { setStep('form'); setError(''); }}
              className="px-5 py-3 border border-slate-200 text-slate-600 rounded-lg text-sm font-medium hover:bg-slate-50 transition"
            >
              ← Back
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              {loading ? 'Generating MOU...' : 'Sign & Download MOU'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
