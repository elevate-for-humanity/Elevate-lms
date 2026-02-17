'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import SignatureCanvas from 'signature_pad';
import {
  FileText,
  Check,
  ChevronRight,
  AlertCircle,
  Loader2,
  Pen,
  Type,
  CheckSquare,
} from 'lucide-react';

interface Agreement {
  type: string;
  version: string;
  title: string;
  description: string;
  documentUrl: string;
}

// Agreement definitions
const AGREEMENT_DEFINITIONS: Record<string, Omit<Agreement, 'type' | 'version'>> = {
  enrollment: {
    title: 'Enrollment Agreement',
    description: 'Terms and conditions of your enrollment in the training program',
    documentUrl: '/legal/enrollment-agreement',
  },
  handbook: {
    title: 'Student Handbook Acknowledgment',
    description: 'Acknowledgment of student handbook policies and procedures',
    documentUrl: '/legal/student-handbook',
  },
  data_sharing: {
    title: 'Data Sharing Consent',
    description: 'Authorization for sharing data with workforce agencies and employers',
    documentUrl: '/legal/data-sharing',
  },
  program_holder_mou: {
    title: 'Program Holder MOU',
    description: 'Memorandum of Understanding for program delivery partnership',
    documentUrl: '/legal/program-holder-mou',
  },
  employer_agreement: {
    title: 'Employer Partnership Agreement',
    description: 'Terms for employer participation in workforce programs',
    documentUrl: '/legal/employer-agreement',
  },
  staff_agreement: {
    title: 'Staff Agreement',
    description: 'Terms of employment and confidentiality obligations',
    documentUrl: '/legal/staff-agreement',
  },
  mou: {
    title: 'Partner MOU',
    description: 'Memorandum of Understanding for partnership',
    documentUrl: '/legal/partner-mou',
  },
  ferpa: {
    title: 'FERPA Consent',
    description: 'Authorization for release of educational records',
    documentUrl: '/legal/ferpa-consent',
  },
  participation: {
    title: 'Participation Agreement',
    description: 'Program participation requirements and expectations',
    documentUrl: '/legal/participation-agreement',
  },
};

type SignatureMethod = 'checkbox' | 'typed' | 'drawn';

function LegalAgreementsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [signaturePad, setSignaturePad] = useState<SignatureCanvas | null>(null);

  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [missingAgreements, setMissingAgreements] = useState<Agreement[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [signedTypes, setSignedTypes] = useState<Set<string>>(new Set());

  // Form state
  const [signatureMethod, setSignatureMethod] = useState<SignatureMethod>('checkbox');
  const [signerName, setSignerName] = useState('');
  const [typedSignature, setTypedSignature] = useState('');
  const [drawnSignature, setDrawnSignature] = useState<string | null>(null);
  const [acknowledged, setAcknowledged] = useState(false);

  const nextUrl = searchParams.get('next') || '/lms/dashboard';
  const missingParam = searchParams.get('missing');

  useEffect(() => {
    const supabase = createClient();

    supabase?.auth.getUser().then(async ({ data, error }) => {
      if (error || !data?.user) {
        router.push('/login?next=/legal/agreements');
        return;
      }

      setUser(data.user);

      // Get profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.user.id)
        .single();

      setProfile(profileData);
      setSignerName(profileData?.full_name || '');

      // Determine missing agreements
      // Valid enum values: enrollment, handbook, program_holder_mou, employer_agreement, staff_agreement, license
      const role = profileData?.role || 'student';
      const requiredByRole: Record<string, Array<{ type: string; version: string }>> = {
        student: [
          { type: 'enrollment', version: '1.0' },
          { type: 'handbook', version: '1.0' },
        ],
        program_holder: [
          { type: 'program_holder_mou', version: '1.0' },
        ],
        employer: [
          { type: 'employer_agreement', version: '1.0' },
        ],
        staff: [{ type: 'staff_agreement', version: '1.0' }],
        admin: [{ type: 'staff_agreement', version: '1.0' }],
        super_admin: [{ type: 'staff_agreement', version: '1.0' }],
        partner: [
          { type: 'program_holder_mou', version: '1.0' },
        ],
      };

      const required = requiredByRole[role] || requiredByRole.student;

      // Get already signed
      const { data: signed } = await supabase
        .from('license_agreement_acceptances')
        .select('agreement_type, document_version')
        .eq('user_id', data.user.id);

      const signedSet = new Set(
        (signed || []).map((s) => `${s.agreement_type}:${s.document_version}`)
      );

      // Filter to missing
      const missing = required
        .filter((req) => !signedSet.has(`${req.type}:${req.version}`))
        .map((req) => ({
          type: req.type,
          version: req.version,
          ...(AGREEMENT_DEFINITIONS[req.type] || {
            title: req.type.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
            description: 'Please review and sign this agreement',
            documentUrl: `/legal/${req.type}`,
          }),
        }));

      setMissingAgreements(missing);
      setSignedTypes(new Set((signed || []).map((s) => s.agreement_type)));

      if (missing.length === 0) {
        // All signed, redirect to destination
        router.push(nextUrl);
        return;
      }

      setLoading(false);
    });
  }, [router, nextUrl]);

  // Initialize signature pad
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

  const currentAgreement = missingAgreements[currentIndex];

  const isFormValid = () => {
    if (!signerName.trim()) return false;
    if (!acknowledged) return false;

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

  const handleSign = async () => {
    if (!isFormValid() || !user || !currentAgreement) return;

    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/legal/sign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agreements: [currentAgreement.type],
          signer_name: signerName.trim(),
          signer_email: user.email,
          signature_method: signatureMethod,
          signature_typed: signatureMethod === 'typed' ? typedSignature.trim() : undefined,
          signature_data: signatureMethod === 'drawn' ? drawnSignature : undefined,
          context: 'onboarding',
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to sign agreement');
      }

      // Mark as signed
      setSignedTypes((prev) => new Set([...prev, currentAgreement.type]));

      // Reset form for next agreement
      setAcknowledged(false);
      setTypedSignature('');
      setDrawnSignature(null);
      if (signaturePad) signaturePad.clear();

      // Move to next or complete
      if (currentIndex < missingAgreements.length - 1) {
        setCurrentIndex(currentIndex + 1);
      } else {
        // All done - redirect
        router.push(nextUrl);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-slate-600">Loading agreements...</p>
        </div>
      </div>
    );
  }

  if (missingAgreements.length === 0) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <Check className="w-12 h-12 text-green-600 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-slate-900 mb-2">All Agreements Signed</h1>
          <p className="text-slate-600 mb-4">Redirecting...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-12">
      <div className="max-w-3xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">
            Required Agreements
          </h1>
          <p className="text-slate-600">
            Please review and sign the following agreements to continue.
          </p>
        </div>

        {/* Progress */}
        <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-slate-700">Progress</span>
            <span className="text-sm text-slate-500">
              {currentIndex + 1} of {missingAgreements.length}
            </span>
          </div>
          <div className="flex gap-2">
            {missingAgreements.map((_, index) => (
              <div
                key={index}
                className={`flex-1 h-2 rounded-full ${
                  index < currentIndex
                    ? 'bg-green-500'
                    : index === currentIndex
                    ? 'bg-blue-500'
                    : 'bg-slate-200'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {/* Current Agreement */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          {/* Agreement Header */}
          <div className="bg-slate-50 border-b border-slate-200 p-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <FileText className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  {currentAgreement.title}
                </h2>
                <p className="text-slate-600 mt-1">{currentAgreement.description}</p>
                <p className="text-sm text-slate-500 mt-2">
                  Version {currentAgreement.version}
                </p>
              </div>
            </div>
          </div>

          {/* Agreement Content Link */}
          <div className="p-6 border-b border-slate-200">
            <Link
              href={currentAgreement.documentUrl}
              target="_blank"
              className="inline-flex items-center gap-2 text-blue-600 hover:underline"
            >
              View Full Agreement Document
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Signature Section */}
          <div className="p-6 space-y-6">
            {/* Signer Name */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Full Legal Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={signerName}
                onChange={(e) => setSignerName(e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter your full legal name"
              />
            </div>

            {/* Signature Method */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Signature Method
              </label>
              <div className="grid grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => setSignatureMethod('checkbox')}
                  className={`p-3 border-2 rounded-lg text-center transition-colors ${
                    signatureMethod === 'checkbox'
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <CheckSquare className={`w-5 h-5 mx-auto mb-1 ${
                    signatureMethod === 'checkbox' ? 'text-blue-600' : 'text-slate-400'
                  }`} />
                  <span className="text-sm">Checkbox</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSignatureMethod('typed')}
                  className={`p-3 border-2 rounded-lg text-center transition-colors ${
                    signatureMethod === 'typed'
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <Type className={`w-5 h-5 mx-auto mb-1 ${
                    signatureMethod === 'typed' ? 'text-blue-600' : 'text-slate-400'
                  }`} />
                  <span className="text-sm">Type</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSignatureMethod('drawn')}
                  className={`p-3 border-2 rounded-lg text-center transition-colors ${
                    signatureMethod === 'drawn'
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <Pen className={`w-5 h-5 mx-auto mb-1 ${
                    signatureMethod === 'drawn' ? 'text-blue-600' : 'text-slate-400'
                  }`} />
                  <span className="text-sm">Draw</span>
                </button>
              </div>
            </div>

            {/* Typed Signature */}
            {signatureMethod === 'typed' && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Type Your Signature <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={typedSignature}
                  onChange={(e) => setTypedSignature(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-xl"
                  style={{ fontFamily: "'Brush Script MT', cursive" }}
                  placeholder="Type your full name"
                />
              </div>
            )}

            {/* Drawn Signature */}
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
                <button
                  type="button"
                  onClick={() => {
                    signaturePad?.clear();
                    setDrawnSignature(null);
                  }}
                  className="text-sm text-blue-600 hover:underline mt-2"
                >
                  Clear
                </button>
              </div>
            )}

            {/* Acknowledgment */}
            <label className="flex items-start gap-3 cursor-pointer p-4 bg-slate-50 rounded-lg">
              <input
                type="checkbox"
                checked={acknowledged}
                onChange={(e) => setAcknowledged(e.target.checked)}
                className="mt-1 w-5 h-5 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
              />
              <span className="text-sm text-slate-700">
                I have read and agree to the terms of this agreement. I understand this
                constitutes a legally binding electronic signature.
              </span>
            </label>

            {/* Submit */}
            <button
              onClick={handleSign}
              disabled={!isFormValid() || submitting}
              className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
                isFormValid() && !submitting
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-slate-300 text-slate-500 cursor-not-allowed'
              }`}
            >
              {submitting ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Signing...
                </span>
              ) : currentIndex < missingAgreements.length - 1 ? (
                'Sign & Continue'
              ) : (
                'Sign & Complete'
              )}
            </button>

            <p className="text-xs text-slate-500 text-center">
              Your signature, IP address, and timestamp will be recorded.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LegalAgreementsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-slate-600">Loading...</p>
        </div>
      </div>
    }>
      <LegalAgreementsContent />
    </Suspense>
  );
}
