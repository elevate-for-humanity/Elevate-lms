'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { SignatureCanvas } from '@/components/SignatureCanvas';
import { CheckCircle, Circle, AlertTriangle, FileText, Pen } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface Agreement {
  type: string;
  label: string;
  url: string;
  required: boolean;
}

interface Props {
  userId: string;
  organizationId?: string;
  agreements: Agreement[];
  acceptedAgreements?: string[];
  signerName?: string;
  signerEmail?: string;
  signerTitle?: string;
  context: 'checkout' | 'first_login' | 'upgrade' | 'renewal' | 'onboarding';
  onComplete?: () => void;
  redirectTo?: string;
}

type SignatureMethod = 'checkbox' | 'typed' | 'drawn';

// Hook to load and save agreement signatures
function useAgreementDB(userId: string) {
  const supabase = createClient();

  const loadPreviousSignatures = async () => {
    const { data } = await supabase
      .from('agreement_signatures')
      .select('agreement_type, signed_at, signature_method')
      .eq('user_id', userId);
    return data || [];
  };

  const saveSignature = async (agreementType: string, signatureData: any, method: SignatureMethod) => {
    await supabase
      .from('agreement_signatures')
      .insert({
        user_id: userId,
        agreement_type: agreementType,
        signature_data: signatureData,
        signature_method: method,
        signed_at: new Date().toISOString(),
        ip_address: null, // Set server-side
        user_agent: navigator.userAgent
      });
  };

  return { loadPreviousSignatures, saveSignature };
}

export default function AgreementSigningForm({
  userId,
  organizationId,
  agreements,
  acceptedAgreements = [],
  signerName: initialName = '',
  signerEmail: initialEmail = '',
  signerTitle: initialTitle = '',
  context,
  onComplete,
  redirectTo,
}: Props) {
  const router = useRouter();
  const [step, setStep] = useState<'review' | 'sign'>('review');
  const [signatureMethod, setSignatureMethod] = useState<SignatureMethod>('typed');
  const [signerName, setSignerName] = useState(initialName);
  const [signerEmail, setSignerEmail] = useState(initialEmail);
  const [signerTitle, setSignerTitle] = useState(initialTitle);
  const [typedSignature, setTypedSignature] = useState('');
  const [drawnSignature, setDrawnSignature] = useState('');
  const [acknowledged, setAcknowledged] = useState(false);
  const [reviewedAgreements, setReviewedAgreements] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const pendingAgreements = agreements.filter(
    (a) => a.required && !acceptedAgreements.includes(a.type)
  );
  const allReviewed = pendingAgreements.every((a) => reviewedAgreements.includes(a.type));

  const markAsReviewed = (type: string) => {
    if (!reviewedAgreements.includes(type)) {
      setReviewedAgreements([...reviewedAgreements, type]);
    }
  };

  const hasValidSignature = () => {
    if (signatureMethod === 'typed') {
      return typedSignature.trim().length >= 2;
    }
    if (signatureMethod === 'drawn') {
      return drawnSignature.length > 0;
    }
    return true; // checkbox method
  };

  const canSubmit = () => {
    return (
      signerName.trim().length >= 2 &&
      signerEmail.includes('@') &&
      acknowledged &&
      hasValidSignature() &&
      allReviewed
    );
  };

  const handleSubmit = async () => {
    if (!canSubmit()) return;

    setSubmitting(true);
    setError('');

    try {
      const response = await fetch('/api/legal/sign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agreements: pendingAgreements.map((a) => a.type),
          signer_name: signerName,
          signer_email: signerEmail,
          signer_title: signerTitle || null,
          signature_method: signatureMethod,
          signature_typed: signatureMethod === 'typed' ? typedSignature : null,
          signature_data: signatureMethod === 'drawn' ? drawnSignature : null,
          context,
          organization_id: organizationId,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to record signature');
      }

      if (onComplete) {
        onComplete();
      } else if (redirectTo) {
        router.push(redirectTo);
      } else {
        router.refresh();
      }
    } catch (err: any) {
      setError('Failed to sign agreement');
    } finally {
      setSubmitting(false);
    }
  };

  if (pendingAgreements.length === 0) {
    return (
      <div className="text-center py-8">
        <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
        <h3 className="text-xl font-bold text-gray-900 mb-2">All Agreements Signed</h3>
        <p className="text-gray-600">You have already accepted all required agreements.</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {step === 'review' && (
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Review Required Agreements</h2>
            <p className="text-gray-600">
              Please review each agreement before signing. Click on each agreement to read it.
            </p>
          </div>

          <div className="space-y-3">
            {pendingAgreements.map((agreement) => {
              const isReviewed = reviewedAgreements.includes(agreement.type);
              return (
                <div
                  key={agreement.type}
                  className={`flex items-center justify-between p-4 rounded-lg border-2 transition ${
                    isReviewed
                      ? 'bg-green-50 border-green-200'
                      : 'bg-gray-50 border-gray-200'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {isReviewed ? (
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    ) : (
                      <Circle className="w-5 h-5 text-gray-400" />
                    )}
                    <span className="font-medium text-gray-900">{agreement.label}</span>
                  </div>
                  <Link
                    href={agreement.url}
                    target="_blank"
                    onClick={() => markAsReviewed(agreement.type)}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-brand-blue-600 hover:text-brand-blue-700 hover:bg-brand-blue-50 rounded-lg transition"
                  >
                    <FileText className="w-4 h-4" />
                    Read Agreement
                  </Link>
                </div>
              );
            })}
          </div>

          {!allReviewed && (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-amber-800 text-sm">
                Please click "Read Agreement" for each document above before proceeding.
              </p>
            </div>
          )}

          <button
            onClick={() => setStep('sign')}
            disabled={!allReviewed}
            className="w-full py-3 bg-brand-blue-600 text-white font-semibold rounded-lg hover:bg-brand-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition"
          >
            Continue to Sign
          </button>
        </div>
      )}

      {step === 'sign' && (
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Sign Agreements</h2>
            <p className="text-gray-600">
              Complete the information below to digitally sign the agreements.
            </p>
          </div>

          {/* Signer Information */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Full Legal Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={signerName}
                onChange={(e) => setSignerName(e.target.value)}
                placeholder="Enter your full legal name"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-brand-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email Address <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                value={signerEmail}
                onChange={(e) => setSignerEmail(e.target.value)}
                placeholder="Enter your email address"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-brand-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Title/Position (if signing on behalf of an organization)
              </label>
              <input
                type="text"
                value={signerTitle}
                onChange={(e) => setSignerTitle(e.target.value)}
                placeholder="e.g., CEO, Director, Owner"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-brand-blue-500"
              />
            </div>
          </div>

          {/* Signature Method Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Signature Method
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setSignatureMethod('typed')}
                className={`flex-1 py-2 px-4 rounded-lg border-2 font-medium transition ${
                  signatureMethod === 'typed'
                    ? 'border-brand-blue-600 bg-brand-blue-50 text-brand-blue-700'
                    : 'border-gray-200 text-gray-600 hover:border-gray-300'
                }`}
              >
                Type Signature
              </button>
              <button
                type="button"
                onClick={() => setSignatureMethod('drawn')}
                className={`flex-1 py-2 px-4 rounded-lg border-2 font-medium transition ${
                  signatureMethod === 'drawn'
                    ? 'border-brand-blue-600 bg-brand-blue-50 text-brand-blue-700'
                    : 'border-gray-200 text-gray-600 hover:border-gray-300'
                }`}
              >
                Draw Signature
              </button>
            </div>
          </div>

          {/* Signature Input */}
          {signatureMethod === 'typed' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Type Your Signature <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={typedSignature}
                onChange={(e) => setTypedSignature(e.target.value)}
                placeholder="Type your full name as signature"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-brand-blue-500 font-signature text-2xl"
                style={{ fontFamily: "'Brush Script MT', cursive" }}
              />
              {typedSignature && (
                <div className="mt-3 p-4 bg-gray-50 border border-gray-200 rounded-lg">
                  <p className="text-sm text-gray-500 mb-1">Signature Preview:</p>
                  <p
                    className="text-3xl text-gray-900"
                    style={{ fontFamily: "'Brush Script MT', cursive" }}
                  >
                    {typedSignature}
                  </p>
                </div>
              )}
            </div>
          )}

          {signatureMethod === 'drawn' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Draw Your Signature <span className="text-red-500">*</span>
              </label>
              <SignatureCanvas
                onSignatureChange={setDrawnSignature}
                width={500}
                height={150}
              />
            </div>
          )}

          {/* Legal Acknowledgment */}
          <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={acknowledged}
                onChange={(e) => setAcknowledged(e.target.checked)}
                className="mt-1 w-5 h-5 text-brand-blue-600 rounded border-gray-300 focus:ring-brand-blue-500"
              />
              <span className="text-sm text-gray-700">
                I confirm that I have read and understand all agreements listed above. I agree to
                be legally bound by these agreements. I understand that this electronic signature
                has the same legal effect as a handwritten signature. I am authorized to sign on
                behalf of the organization (if applicable).
              </span>
            </label>
          </div>

          {/* Agreements Being Signed */}
          <div className="p-4 bg-brand-blue-50 border border-brand-blue-200 rounded-lg">
            <p className="text-sm font-medium text-brand-blue-900 mb-2">
              You are signing the following agreements:
            </p>
            <ul className="text-sm text-brand-blue-800 space-y-1">
              {pendingAgreements.map((a) => (
                <li key={a.type} className="flex items-center gap-2">
                  <Pen className="w-3 h-3" />
                  {a.label}
                </li>
              ))}
            </ul>
          </div>

          {/* Submit Buttons */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setStep('review')}
              className="px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition"
            >
              Back
            </button>
            <button
              onClick={handleSubmit}
              disabled={!canSubmit() || submitting}
              className="flex-1 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition"
            >
              {submitting ? 'Processing...' : 'Sign Agreements'}
            </button>
          </div>

          <p className="text-xs text-gray-500 text-center">
            By clicking "Sign Agreements", you agree that your electronic signature is the legal
            equivalent of your manual signature on these agreements. Timestamp and IP address will
            be recorded.
          </p>
        </div>
      )}
    </div>
  );
}
