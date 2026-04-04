'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Shield, FileText, CheckCircle, AlertCircle, Lock } from 'lucide-react';

// The exact document text stored as a snapshot on every signed record.
export const CONSENT_DOCUMENT_VERSION = 'v1.0';
export const CONSENT_DOCUMENT_TEXT = `
SUPERSONIC FAST CASH — CLIENT ENGAGEMENT AGREEMENT & CONSENT
Version ${CONSENT_DOCUMENT_VERSION} | Effective: 2025 Tax Season

═══════════════════════════════════════════════════════════════
SECTION A — ENGAGEMENT AGREEMENT
═══════════════════════════════════════════════════════════════

By signing below, you ("Client") are engaging SupersonicFastCash, operated by
2Exclusive LLC-S (DBA: Elevate for Humanity Technical and Career Institute),
PTIN-credentialed tax preparation services ("Preparer") to prepare your federal
and/or state income tax return(s) for the applicable tax year.

SCOPE OF SERVICES
The Preparer will prepare your tax return(s) based solely on information you
provide. Services include: tax return preparation, optional electronic filing
(e-file), and refund advance facilitation where applicable.

NO GUARANTEE OF REFUND
The Preparer makes no guarantee regarding the amount of any refund or tax
liability. Refund amounts are determined solely by the IRS and applicable state
tax authorities based on the information reported.

CLIENT RESPONSIBILITY FOR ACCURACY
You are responsible for the accuracy, completeness, and truthfulness of all
information you provide. The Preparer will rely on your representations without
independent verification. Providing false or incomplete information may result
in penalties, interest, or criminal liability under federal and state law.

PREPARER FEES
Fees are due prior to filing. Accepted payment methods include credit/debit
card and refund-based fee collection where available. Fee schedules are posted
at /supersonic-fast-cash/pricing.

═══════════════════════════════════════════════════════════════
SECTION B — PRIVACY NOTICE & IRC §7216 DISCLOSURE
═══════════════════════════════════════════════════════════════

INTERNAL REVENUE CODE SECTION 7216 NOTICE
Federal law (26 U.S.C. §7216) prohibits tax return preparers from knowingly or
recklessly disclosing or using tax return information for any purpose other than
preparing, assisting in preparing, or obtaining or providing services in
connection with the preparation of a tax return.

HOW WE USE YOUR TAX INFORMATION
Your tax return information is used solely to: (1) prepare your tax return(s);
(2) transmit your return to the IRS and/or state tax authorities; (3) provide
you with copies of your completed return; and (4) comply with applicable law.

THIRD-PARTY SERVICE PROVIDERS
We use the following categories of third-party tools to deliver our services:
• Cloud hosting and infrastructure (data stored in the United States)
• Secure document storage and encryption
• Payment processing (Stripe, Inc.)
• Electronic filing transmission (IRS MeF system)

These providers are contractually prohibited from using your tax information
for any purpose other than providing services to us.

NO SALE OR UNAUTHORIZED DISCLOSURE
We do not sell, rent, or share your tax return information with any third party
for marketing, advertising, or any purpose unrelated to your tax preparation
without your explicit written consent, except as required by law.

YOUR AUTHORIZATION
By signing this agreement, you authorize SupersonicFastCash to use your tax
return information for the purposes described above, including transmission to
the IRS and applicable state tax authorities.

═══════════════════════════════════════════════════════════════
SECTION C — CONSENT TO ELECTRONIC FILING
═══════════════════════════════════════════════════════════════

AUTHORIZATION TO E-FILE
You authorize SupersonicFastCash to electronically file your completed tax
return(s) with the IRS and applicable state tax authorities on your behalf,
after you have reviewed and approved the completed return.

PAPER FILING ALTERNATIVE
If electronic filing is unavailable or not applicable, you authorize
SupersonicFastCash to prepare your return for paper filing. You will be
provided with complete instructions for mailing.

REVIEW BEFORE FILING
No return will be filed without your prior review and approval. You will
receive a copy of your completed return before any submission occurs.

═══════════════════════════════════════════════════════════════
By typing your full legal name and the last 4 digits of your Social Security
Number below, you confirm that you have read, understood, and agree to all
terms in this Engagement Agreement, Privacy Notice, and Consent to E-File.
═══════════════════════════════════════════════════════════════
`.trim();

export default function ConsentPage() {
  const router = useRouter();
  const scrollRef = useRef<HTMLDivElement>(null);

  const [hasScrolled, setHasScrolled] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [fullName, setFullName] = useState('');
  const [ssnLast4, setSsnLast4] = useState('');
  const [signature, setSignature] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  // Track scroll to bottom of agreement
  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 20) {
      setHasScrolled(true);
    }
  };

  const canSubmit =
    (hasScrolled || agreed) &&
    agreed &&
    fullName.trim().length >= 2 &&
    /^\d{4}$/.test(ssnLast4) &&
    signature.trim().length >= 2;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);
    setError('');

    try {
      const res = await fetch('/api/supersonic-fast-cash/consent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: fullName.trim(),
          ssn_last4: ssnLast4,
          signature_text: signature.trim(),
          consent_version: CONSENT_DOCUMENT_VERSION,
          document_snapshot: CONSENT_DOCUMENT_TEXT,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Something went wrong. Please try again.');
        return;
      }

      setDone(true);
      // Redirect to upload-documents after 2 seconds
      setTimeout(() => {
        const next = new URLSearchParams(window.location.search).get('next');
        router.push(next || '/supersonic-fast-cash/upload-documents');
      }, 2000);
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-3">Agreement Signed</h1>
          <p className="text-black">Redirecting you to document upload…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-slate-800 text-white py-8 px-4">
        <div className="max-w-3xl mx-auto flex items-center gap-4">
          <div className="w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center flex-shrink-0">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Client Engagement Agreement</h1>
            <p className="text-white text-sm mt-1">
              SupersonicFastCash · Required before accessing your client portal
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Section badges */}
        <div className="grid grid-cols-3 gap-3 mb-8">
          {[
            { icon: FileText, label: 'Engagement Agreement', color: 'bg-blue-50 text-blue-700 border-blue-200' },
            { icon: Lock, label: 'IRC §7216 Privacy', color: 'bg-purple-50 text-purple-700 border-purple-200' },
            { icon: CheckCircle, label: 'Consent to E-File', color: 'bg-green-50 text-green-700 border-green-200' },
          ].map(({ icon: Icon, label, color }) => (
            <div key={label} className={`border rounded-lg p-3 flex items-center gap-2 text-sm font-medium ${color}`}>
              <Icon className="w-4 h-4 flex-shrink-0" />
              <span>{label}</span>
            </div>
          ))}
        </div>

        {/* Scrollable agreement */}
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden mb-6 shadow-sm">
          <div className="bg-gray-50 border-b border-gray-200 px-5 py-3 flex items-center justify-between">
            <span className="text-sm font-semibold text-gray-700">
              Agreement Document — Version {CONSENT_DOCUMENT_VERSION}
            </span>
            {!hasScrolled && (
              <span className="text-xs text-orange-600 font-medium animate-pulse">
                ↓ Scroll to read
              </span>
            )}
            {hasScrolled && (
              <span className="text-xs text-green-600 font-medium flex items-center gap-1">
                <CheckCircle className="w-3 h-3" /> Read
              </span>
            )}
          </div>
          <div
            ref={scrollRef}
            onScroll={handleScroll}
            className="h-72 overflow-y-auto p-5 font-mono text-xs text-gray-700 leading-relaxed whitespace-pre-wrap bg-white"
          >
            {CONSENT_DOCUMENT_TEXT}
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm space-y-5">
          <h2 className="text-lg font-bold text-gray-900">Sign Below</h2>

          {/* Full legal name */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Full Legal Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={fullName}
              onChange={e => setFullName(e.target.value)}
              placeholder="As it appears on your tax documents"
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
              required
            />
          </div>

          {/* SSN last 4 */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Last 4 Digits of SSN <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={ssnLast4}
              onChange={e => setSsnLast4(e.target.value.replace(/\D/g, '').slice(0, 4))}
              placeholder="XXXX"
              maxLength={4}
              className="w-40 border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 tracking-widest font-mono"
              required
            />
            <p className="text-xs text-black mt-1">Used for identity verification only. Not stored in plain text.</p>
          </div>

          {/* Typed signature */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Electronic Signature — Type Your Full Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={signature}
              onChange={e => setSignature(e.target.value)}
              placeholder="Type your name as your signature"
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm italic font-serif text-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              required
            />
            <p className="text-xs text-black mt-1">
              Typing your name constitutes a legally binding electronic signature under the E-SIGN Act.
            </p>
          </div>

          {/* Date (auto) */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Date</label>
            <div className="w-full border border-gray-100 bg-gray-50 rounded-lg px-4 py-2.5 text-sm text-black">
              {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
              <span className="ml-2 text-xs text-black">(auto)</span>
            </div>
          </div>

          {/* Checkbox */}
          <div className={`border rounded-lg p-4 ${agreed ? 'border-green-400 bg-green-50' : 'border-gray-300 bg-gray-50'}`}>
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={agreed}
                onChange={e => setAgreed(e.target.checked)}
                className="mt-0.5 w-5 h-5 accent-orange-500 flex-shrink-0"
              />
              <span className="text-sm text-gray-700 font-medium">
                I have read and agree to the Engagement Agreement, IRC §7216 Privacy Disclosure, and Consent to Electronic Filing. I understand that providing false information may result in penalties under federal law.
              </span>
            </label>
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={!canSubmit || submitting}
            className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-bold py-3.5 rounded-lg transition-colors text-base"
          >
            {submitting ? 'Saving…' : 'Sign & Continue →'}
          </button>

          {!canSubmit && (
            <p className="text-xs text-center text-black">
              {!hasScrolled && !agreed ? 'Scroll through the agreement or check the box to continue.' : 'Complete all required fields to continue.'}
            </p>
          )}
        </form>

        <p className="text-center text-xs text-black mt-6">
          SupersonicFastCash · 2Exclusive LLC-S · PTIN-credentialed preparers · Indianapolis, IN
        </p>
      </div>
    </div>
  );
}
