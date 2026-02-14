'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import SignatureCanvas from 'signature_pad';
import { createClient } from '@/lib/supabase/client';
import { recordAgreementAcceptance } from '@/lib/compliance/enforcement';
import { AlertCircle, Check, Pen, Type, CheckSquare } from 'lucide-react';

interface AgreementSignatureProps {
  agreementType: string;
  documentVersion: string;
  documentUrl?: string;
  acceptanceContext?: string;
  programId?: string;
  tenantId?: string;
  organizationId?: string;
  onSuccess?: (acceptanceId: string) => void;
  onError?: (error: string) => void;
  redirectOnSuccess?: string;
}

type SignatureMethod = 'checkbox' | 'typed' | 'drawn';

/**
 * AgreementSignature - Legally binding signature capture component
 * 
 * Features:
 * - Three signature methods: checkbox, typed, drawn
 * - Email validation against authenticated user
 * - Full audit trail capture (IP, user agent, timestamp)
 * - Intent statement acknowledgment
 */
export function AgreementSignature({
  agreementType,
  documentVersion,
  documentUrl,
  acceptanceContext,
  programId,
  tenantId,
  organizationId,
  onSuccess,
  onError,
  redirectOnSuccess,
}: AgreementSignatureProps) {
  const router = useRouter();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [signaturePad, setSignaturePad] = useState<SignatureCanvas | null>(null);

  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Form state
  const [signatureMethod, setSignatureMethod] = useState<SignatureMethod>('checkbox');
  const [signerName, setSignerName] = useState('');
  const [signerEmail, setSignerEmail] = useState('');
  const [typedSignature, setTypedSignature] = useState('');
  const [drawnSignature, setDrawnSignature] = useState<string | null>(null);
  const [acknowledged, setAcknowledged] = useState(false);
  const [intentAcknowledged, setIntentAcknowledged] = useState(false);

  // Email validation
  const [emailMismatch, setEmailMismatch] = useState(false);

  const INTENT_STATEMENT = `By signing below, I acknowledge that I have read, understand, and agree to be bound by the terms of this agreement. I understand this constitutes a legally binding electronic signature under the Electronic Signatures in Global and National Commerce Act (E-SIGN Act) and the Uniform Electronic Transactions Act (UETA).`;

  const [existingAgreements, setExistingAgreements] = useState<any[]>([]);

  useEffect(() => {
    const supabase = createClient();

    supabase?.auth.getUser().then(({ data, error }) => {
      if (error || !data?.user) {
        router.push('/login');
        return;
      }

      setUser(data.user);
      setSignerEmail(data.user.email || '');
      setLoading(false);

      // Load existing agreements for this user and type from DB
      supabase
        .from('agreement_acceptances')
        .select('id, agreement_type, document_version, signed_at, signature_method')
        .eq('user_id', data.user.id)
        .eq('agreement_type', agreementType)
        .order('signed_at', { ascending: false })
        .then(({ data: agreements }) => {
          if (agreements) setExistingAgreements(agreements);
        });
    });
  }, [router, agreementType]);

  // Initialize signature pad when method changes to 'drawn'
  useEffect(() => {
    if (signatureMethod === 'drawn' && canvasRef.current && !signaturePad) {
      const pad = new SignatureCanvas(canvasRef.current, {
        backgroundColor: 'rgb(255, 255, 255)',
        penColor: 'rgb(0, 0, 0)',
      });

      pad.addEventListener('endStroke', () => {
        if (!pad.isEmpty()) {
          setDrawnSignature(pad.toDataURL('image/png'));
        }
      });

      setSignaturePad(pad);

      // Handle resize
      const handleResize = () => {
        if (canvasRef.current && pad) {
          const ratio = Math.max(window.devicePixelRatio || 1, 1);
          canvasRef.current.width = canvasRef.current.offsetWidth * ratio;
          canvasRef.current.height = canvasRef.current.offsetHeight * ratio;
          canvasRef.current.getContext('2d')?.scale(ratio, ratio);
          pad.clear();
          setDrawnSignature(null);
        }
      };

      handleResize();
      window.addEventListener('resize', handleResize);

      return () => {
        window.removeEventListener('resize', handleResize);
        pad.off();
      };
    }
  }, [signatureMethod, signaturePad]);

  // Validate email match
  useEffect(() => {
    if (user && signerEmail) {
      setEmailMismatch(signerEmail.toLowerCase() !== user.email?.toLowerCase());
    }
  }, [signerEmail, user]);

  const clearDrawnSignature = () => {
    if (signaturePad) {
      signaturePad.clear();
      setDrawnSignature(null);
    }
  };

  const isFormValid = () => {
    if (!signerName.trim()) return false;
    if (!signerEmail.trim()) return false;
    if (emailMismatch) return false;
    if (!acknowledged) return false;
    if (!intentAcknowledged) return false;

    switch (signatureMethod) {
      case 'checkbox':
        return true;
      case 'typed':
        return typedSignature.trim().length > 0;
      case 'drawn':
        return drawnSignature !== null;
      default:
        return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isFormValid() || !user) {
      setError('Please complete all required fields');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const result = await recordAgreementAcceptance({
        userId: user.id,
        agreementType,
        documentVersion,
        signerName: signerName.trim(),
        signerEmail: signerEmail.trim(),
        authEmail: user.email,
        signatureMethod,
        signatureData: signatureMethod === 'drawn' ? drawnSignature || undefined : undefined,
        signatureTyped: signatureMethod === 'typed' ? typedSignature.trim() : undefined,
        acceptanceContext,
        programId,
        tenantId,
        organizationId,
      });

      if (!result.success) {
        throw new Error(result.error || 'Failed to record agreement acceptance');
      }

      setSuccess(true);
      onSuccess?.(result.id!);

      if (redirectOnSuccess) {
        setTimeout(() => {
          router.push(redirectOnSuccess);
        }, 1500);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMessage);
      onError?.(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="w-8 h-8 border-4 border-brand-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
        <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Check className="w-6 h-6 text-green-600" />
        </div>
        <h3 className="text-lg font-semibold text-green-900 mb-2">
          Agreement Signed Successfully
        </h3>
        <p className="text-green-700">
          Your signature has been recorded. A copy has been saved to your account.
        </p>
        {redirectOnSuccess && (
          <p className="text-sm text-green-600 mt-2">Redirecting...</p>
        )}
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-red-800 font-medium">Error</p>
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        </div>
      )}

      {/* Signer Information */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-slate-900">Signer Information</h3>
        
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Full Legal Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={signerName}
            onChange={(e) => setSignerName(e.target.value)}
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-brand-blue-500"
            placeholder="Enter your full legal name"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Email Address <span className="text-red-500">*</span>
          </label>
          <input
            type="email"
            value={signerEmail}
            onChange={(e) => setSignerEmail(e.target.value)}
            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-brand-blue-500 ${
              emailMismatch ? 'border-red-500 bg-red-50' : 'border-slate-300'
            }`}
            placeholder="Enter your email address"
            required
          />
          {emailMismatch && (
            <p className="text-red-600 text-sm mt-1 flex items-center gap-1">
              <AlertCircle className="w-4 h-4" />
              Email must match your account email ({user?.email})
            </p>
          )}
        </div>
      </div>

      {/* Signature Method Selection */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-slate-900">Signature Method</h3>
        
        <div className="grid grid-cols-3 gap-3">
          <button
            type="button"
            onClick={() => setSignatureMethod('checkbox')}
            className={`p-4 border-2 rounded-lg text-center transition-colors ${
              signatureMethod === 'checkbox'
                ? 'border-brand-blue-600 bg-brand-blue-50'
                : 'border-slate-200 hover:border-slate-300'
            }`}
          >
            <CheckSquare className={`w-6 h-6 mx-auto mb-2 ${
              signatureMethod === 'checkbox' ? 'text-brand-blue-600' : 'text-slate-400'
            }`} />
            <span className={`text-sm font-medium ${
              signatureMethod === 'checkbox' ? 'text-brand-blue-900' : 'text-slate-600'
            }`}>
              Checkbox
            </span>
          </button>

          <button
            type="button"
            onClick={() => setSignatureMethod('typed')}
            className={`p-4 border-2 rounded-lg text-center transition-colors ${
              signatureMethod === 'typed'
                ? 'border-brand-blue-600 bg-brand-blue-50'
                : 'border-slate-200 hover:border-slate-300'
            }`}
          >
            <Type className={`w-6 h-6 mx-auto mb-2 ${
              signatureMethod === 'typed' ? 'text-brand-blue-600' : 'text-slate-400'
            }`} />
            <span className={`text-sm font-medium ${
              signatureMethod === 'typed' ? 'text-brand-blue-900' : 'text-slate-600'
            }`}>
              Type Name
            </span>
          </button>

          <button
            type="button"
            onClick={() => setSignatureMethod('drawn')}
            className={`p-4 border-2 rounded-lg text-center transition-colors ${
              signatureMethod === 'drawn'
                ? 'border-brand-blue-600 bg-brand-blue-50'
                : 'border-slate-200 hover:border-slate-300'
            }`}
          >
            <Pen className={`w-6 h-6 mx-auto mb-2 ${
              signatureMethod === 'drawn' ? 'text-brand-blue-600' : 'text-slate-400'
            }`} />
            <span className={`text-sm font-medium ${
              signatureMethod === 'drawn' ? 'text-brand-blue-900' : 'text-slate-600'
            }`}>
              Draw
            </span>
          </button>
        </div>

        {/* Typed Signature Input */}
        {signatureMethod === 'typed' && (
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Type Your Signature <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={typedSignature}
              onChange={(e) => setTypedSignature(e.target.value)}
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-brand-blue-500 font-signature text-xl"
              placeholder="Type your full name"
              style={{ fontFamily: "'Brush Script MT', cursive" }}
            />
          </div>
        )}

        {/* Drawn Signature Canvas */}
        {signatureMethod === 'drawn' && (
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Draw Your Signature <span className="text-red-500">*</span>
            </label>
            <div className="border-2 border-slate-300 rounded-lg overflow-hidden bg-white">
              <canvas
                ref={canvasRef}
                style={{ width: '100%', height: '150px', touchAction: 'none' }}
              />
            </div>
            <div className="flex justify-between items-center mt-2">
              <p className="text-sm text-slate-500">
                Sign above using your mouse, trackpad, or touch screen
              </p>
              <button
                type="button"
                onClick={clearDrawnSignature}
                className="text-sm text-brand-blue-600 hover:text-brand-blue-800"
              >
                Clear
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Intent Statement */}
      <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
        <h4 className="font-medium text-slate-900 mb-2">Legal Acknowledgment</h4>
        <p className="text-sm text-slate-600 mb-4">{INTENT_STATEMENT}</p>
        
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={intentAcknowledged}
            onChange={(e) => setIntentAcknowledged(e.target.checked)}
            className="mt-1 w-4 h-4 text-brand-blue-600 border-slate-300 rounded focus:ring-brand-blue-500"
          />
          <span className="text-sm text-slate-700">
            I understand and agree to the above statement <span className="text-red-500">*</span>
          </span>
        </label>
      </div>

      {/* Agreement Acknowledgment */}
      <label className="flex items-start gap-3 cursor-pointer">
        <input
          type="checkbox"
          checked={acknowledged}
          onChange={(e) => setAcknowledged(e.target.checked)}
          className="mt-1 w-4 h-4 text-brand-blue-600 border-slate-300 rounded focus:ring-brand-blue-500"
        />
        <span className="text-sm text-slate-700">
          I have read and agree to the terms of this {agreementType.replace(/_/g, ' ')} agreement{' '}
          {documentUrl && (
            <a href={documentUrl} target="_blank" rel="noopener noreferrer" className="text-brand-blue-600 hover:underline">
              (view document)
            </a>
          )}
          <span className="text-red-500"> *</span>
        </span>
      </label>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={!isFormValid() || submitting}
        className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
          isFormValid() && !submitting
            ? 'bg-brand-blue-600 text-white hover:bg-brand-blue-700'
            : 'bg-slate-300 text-slate-500 cursor-not-allowed'
        }`}
      >
        {submitting ? (
          <span className="flex items-center justify-center gap-2">
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            Processing...
          </span>
        ) : (
          'Sign Agreement'
        )}
      </button>

      {/* Audit Notice */}
      <p className="text-xs text-slate-500 text-center">
        Your signature, IP address, and timestamp will be recorded for audit purposes.
        This record cannot be modified or deleted.
      </p>
    </form>
  );
}
