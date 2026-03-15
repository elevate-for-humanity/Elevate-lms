'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
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
  Shield,
  Lock,
  ClipboardList,
  BookOpen,
  Users,
  Briefcase,
  UserCheck,
  Handshake,
} from 'lucide-react';

interface Agreement {
  type: string;
  version: string;
  title: string;
  description: string;
  documentUrl: string;
}

const AGREEMENT_DEFINITIONS: Record<string, Omit<Agreement, 'type' | 'version'> & { img: string; icon: any }> = {
  enrollment: {
    title: 'Enrollment Agreement',
    description: 'Terms and conditions of your enrollment in the training program, including program requirements, attendance policies, and completion standards.',
    documentUrl: '/legal/enrollment-agreement',
    img: '/images/pages/enrollment-agreement.jpg',
    icon: ClipboardList,
  },
  handbook: {
    title: 'Student Handbook Acknowledgment',
    description: 'Acknowledgment of student handbook policies and procedures, including code of conduct, grievance procedures, and student rights.',
    documentUrl: '/legal/student-handbook',
    img: '/images/pages/onboarding-page-1.jpg',
    icon: BookOpen,
  },
  data_sharing: {
    title: 'Data Sharing Consent',
    description: 'Authorization for sharing data with workforce agencies and employers as required for WIOA, JRI, and other funded program reporting.',
    documentUrl: '/legal/data-sharing',
    img: '/images/pages/admin-governance-legal-hero.jpg',
    icon: Shield,
  },
  program_holder_mou: {
    title: 'Program Holder MOU',
    description: 'Memorandum of Understanding for program delivery partnership, outlining responsibilities, reporting requirements, and compliance obligations.',
    documentUrl: '/legal/program-holder-mou',
    img: '/images/pages/programs-admin-signmou-hero.jpg',
    icon: Handshake,
  },
  employer_agreement: {
    title: 'Employer Partnership Agreement',
    description: 'Terms for employer participation in workforce programs, including OJT supervision requirements and apprenticeship obligations.',
    documentUrl: '/legal/employer-agreement',
    img: '/images/pages/admin-employers-onboarding-hero.jpg',
    icon: Briefcase,
  },
  staff_agreement: {
    title: 'Staff Agreement',
    description: 'Terms of employment and confidentiality obligations for Elevate for Humanity staff and contractors.',
    documentUrl: '/legal/staff-agreement',
    img: '/images/pages/admin-signatures-hero.jpg',
    icon: UserCheck,
  },
  mou: {
    title: 'Partner MOU',
    description: 'Memorandum of Understanding for partnership, defining scope, responsibilities, and compliance requirements.',
    documentUrl: '/legal/partner-mou',
    img: '/images/pages/programs-admin-signmou-hero.jpg',
    icon: Users,
  },
  ferpa: {
    title: 'FERPA Consent',
    description: 'Authorization for release of educational records to authorized parties as permitted under the Family Educational Rights and Privacy Act.',
    documentUrl: '/legal/ferpa-consent',
    img: '/images/pages/admin-governance-legal-hero.jpg',
    icon: Lock,
  },
  participation: {
    title: 'Participation Agreement',
    description: 'Program participation requirements and expectations, including attendance, conduct, and completion milestones.',
    documentUrl: '/legal/participation-agreement',
    img: '/images/pages/enrollment-agreement-page-1.jpg',
    icon: ClipboardList,
  },
};

type SignatureMethod = 'checkbox' | 'typed' | 'drawn';

function LegalAgreementsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [signaturePad, setSignaturePad] = useState<SignatureCanvas | null>(null);

  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [missingAgreements, setMissingAgreements] = useState<Agreement[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [signedTypes, setSignedTypes] = useState<Set<string>>(new Set());

  const [signatureMethod, setSignatureMethod] = useState<SignatureMethod>('checkbox');
  const [signerName, setSignerName] = useState('');
  const [typedSignature, setTypedSignature] = useState('');
  const [drawnSignature, setDrawnSignature] = useState<string | null>(null);
  const [acknowledged, setAcknowledged] = useState(false);

  const nextUrl = searchParams.get('next') || '/lms/dashboard';

  useEffect(() => {
    const supabase = createClient();
    supabase?.auth.getUser().then(async ({ data, error }) => {
      if (error || !data?.user) {
        router.push('/login?next=/legal/agreements');
        return;
      }
      setUser(data.user);

      const { data: profileData } = await supabase
        .from('profiles').select('*').eq('id', data.user.id).single();

      setSignerName(profileData?.full_name || '');

      const role = profileData?.role || 'student';
      const requiredByRole: Record<string, Array<{ type: string; version: string }>> = {
        student: [{ type: 'enrollment', version: '1.0' }, { type: 'handbook', version: '1.0' }],
        program_holder: [{ type: 'program_holder_mou', version: '1.0' }],
        employer: [{ type: 'employer_agreement', version: '1.0' }],
        staff: [{ type: 'staff_agreement', version: '1.0' }],
        admin: [{ type: 'staff_agreement', version: '1.0' }],
        super_admin: [{ type: 'staff_agreement', version: '1.0' }],
        partner: [{ type: 'program_holder_mou', version: '1.0' }],
      };

      const required = requiredByRole[role] || requiredByRole.student;

      const { data: signed } = await supabase
        .from('license_agreement_acceptances')
        .select('agreement_type, document_version')
        .eq('user_id', data.user.id);

      const signedSet = new Set((signed || []).map((s) => `${s.agreement_type}:${s.document_version}`));

      const missing = required
        .filter((req) => !signedSet.has(`${req.type}:${req.version}`))
        .map((req) => ({
          type: req.type,
          version: req.version,
          ...(AGREEMENT_DEFINITIONS[req.type] || {
            title: req.type.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
            description: 'Please review and sign this agreement.',
            documentUrl: `/legal/${req.type}`,
            img: '/images/pages/enrollment-agreement.jpg',
            icon: FileText,
          }),
        }));

      setMissingAgreements(missing);
      setSignedTypes(new Set((signed || []).map((s) => s.agreement_type)));

      if (missing.length === 0) {
        router.push(nextUrl);
        return;
      }
      setLoading(false);
    });
  }, [router, nextUrl]);

  useEffect(() => {
    if (signatureMethod === 'drawn' && canvasRef.current && !signaturePad) {
      const pad = new SignatureCanvas(canvasRef.current, {
        backgroundColor: 'rgb(255, 255, 255)',
        penColor: 'rgb(0, 0, 0)',
      });
      pad.addEventListener('endStroke', () => {
        if (!pad.isEmpty()) setDrawnSignature(pad.toDataURL('image/png'));
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
      return () => { window.removeEventListener('resize', handleResize); pad.off(); };
    }
  }, [signatureMethod, signaturePad]);

  const currentAgreement = missingAgreements[currentIndex];
  const currentDef = currentAgreement ? (AGREEMENT_DEFINITIONS[currentAgreement.type] || null) : null;
  const AgreementIcon = currentDef?.icon || FileText;

  const isFormValid = () => {
    if (!signerName.trim() || !acknowledged) return false;
    if (signatureMethod === 'typed') return typedSignature.trim().length > 0;
    if (signatureMethod === 'drawn') return drawnSignature !== null;
    return true;
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
      setSignedTypes((prev) => new Set([...prev, currentAgreement.type]));
      setAcknowledged(false);
      setTypedSignature('');
      setDrawnSignature(null);
      if (signaturePad) signaturePad.clear();
      if (currentIndex < missingAgreements.length - 1) {
        setCurrentIndex(currentIndex + 1);
      } else {
        router.push(nextUrl);
      }
    } catch {
      setError('Failed to process agreement. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-brand-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-slate-600">Loading agreements...</p>
        </div>
      </div>
    );
  }

  if (missingAgreements.length === 0) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-brand-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check className="w-8 h-8 text-brand-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">All Agreements Signed</h1>
          <p className="text-slate-600">Redirecting you to your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">

      {/* Hero */}
      <section className="relative h-[240px] sm:h-[320px] overflow-hidden bg-white">
        <Image
          src="/images/pages/enrollment-agreement.jpg"
          alt="Legal agreements"
          fill
          sizes="100vw"
          className="object-cover opacity-40"
          priority
        />
        
        <div className="relative h-full flex items-end pb-8">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 w-full">
            <p className="text-brand-blue-300 text-xs font-bold uppercase tracking-widest mb-2">Onboarding</p>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mb-2">Required Agreements</h1>
            <p className="text-slate-600 text-sm sm:text-base">
              Please review and sign the following agreements to complete your enrollment.
            </p>
          </div>
        </div>
      </section>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">

        {/* Progress tracker */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 mb-6">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-semibold text-slate-700">Your Progress</span>
            <span className="text-sm text-slate-500 font-medium">
              {currentIndex + 1} of {missingAgreements.length} agreement{missingAgreements.length > 1 ? 's' : ''}
            </span>
          </div>
          <div className="flex gap-2 mb-4">
            {missingAgreements.map((_, index) => (
              <div
                key={index}
                className={`flex-1 h-2 rounded-full transition-colors ${
                  index < currentIndex ? 'bg-brand-green-500'
                  : index === currentIndex ? 'bg-brand-blue-500'
                  : 'bg-slate-200'
                }`}
              />
            ))}
          </div>
          {/* Agreement thumbnails */}
          <div className="flex gap-3 flex-wrap">
            {missingAgreements.map((agr, index) => {
              const def = AGREEMENT_DEFINITIONS[agr.type];
              const Icon = def?.icon || FileText;
              const isSigned = index < currentIndex;
              const isCurrent = index === currentIndex;
              return (
                <div
                  key={agr.type}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium border transition-colors ${
                    isSigned ? 'bg-brand-green-50 border-brand-green-200 text-brand-green-700'
                    : isCurrent ? 'bg-brand-blue-50 border-brand-blue-300 text-brand-blue-700'
                    : 'bg-white border-slate-200 text-slate-500'
                  }`}
                >
                  {isSigned
                    ? <Check className="w-3.5 h-3.5" />
                    : <Icon className="w-3.5 h-3.5" />
                  }
                  {agr.title}
                </div>
              );
            })}
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-brand-red-50 border border-brand-red-200 rounded-xl p-4 mb-6 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-brand-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-brand-red-700 text-sm">{error}</p>
          </div>
        )}

        {/* Current Agreement Card */}
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">

          {/* Agreement image header */}
          <div className="relative h-48 sm:h-56 overflow-hidden">
            <Image
              src={currentDef?.img || '/images/pages/enrollment-agreement.jpg'}
              alt={currentAgreement.title}
              fill
              sizes="(max-width: 768px) 100vw, 672px"
              className="object-cover"
            />
            
            <div className="absolute bottom-0 left-0 right-0 p-5 flex items-end gap-4">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center flex-shrink-0 border border-white/30">
                <AgreementIcon className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-brand-blue-300 text-xs font-bold uppercase tracking-wider mb-0.5">
                  Agreement {currentIndex + 1} of {missingAgreements.length}
                </p>
                <h2 className="text-xl font-bold text-slate-900 leading-tight">{currentAgreement.title}</h2>
              </div>
            </div>
          </div>

          {/* Description + document link */}
          <div className="p-6 border-b border-slate-100">
            <p className="text-slate-600 text-sm leading-relaxed mb-4">{currentAgreement.description}</p>
            <Link
              href={currentAgreement.documentUrl}
              target="_blank"
              className="inline-flex items-center gap-2 text-brand-blue-600 hover:text-brand-blue-700 text-sm font-semibold hover:underline"
            >
              <FileText className="w-4 h-4" />
              View Full Agreement Document
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Signature section */}
          <div className="p-6 space-y-6">

            {/* Signer name */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                Full Legal Name <span className="text-brand-red-500">*</span>
              </label>
              <input
                type="text"
                value={signerName}
                onChange={(e) => setSignerName(e.target.value)}
                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-brand-blue-500 text-sm"
                placeholder="Enter your full legal name"
              />
            </div>

            {/* Signature method */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Signature Method
              </label>
              <div className="grid grid-cols-3 gap-3">
                {([
                  { method: 'checkbox' as SignatureMethod, icon: CheckSquare, label: 'Checkbox' },
                  { method: 'typed' as SignatureMethod, icon: Type, label: 'Type' },
                  { method: 'drawn' as SignatureMethod, icon: Pen, label: 'Draw' },
                ]).map(({ method, icon: Icon, label }) => (
                  <button
                    key={method}
                    type="button"
                    onClick={() => setSignatureMethod(method)}
                    className={`relative p-4 border-2 rounded-xl text-center transition-all overflow-hidden ${
                      signatureMethod === method
                        ? 'border-brand-blue-600 bg-brand-blue-50'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <Icon className={`w-5 h-5 mx-auto mb-1.5 ${
                      signatureMethod === method ? 'text-brand-blue-600' : 'text-slate-400'
                    }`} />
                    <span className={`text-sm font-medium ${
                      signatureMethod === method ? 'text-brand-blue-700' : 'text-slate-600'
                    }`}>{label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Typed signature */}
            {signatureMethod === 'typed' && (
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                  Type Your Signature <span className="text-brand-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={typedSignature}
                  onChange={(e) => setTypedSignature(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500 text-2xl"
                  style={{ fontFamily: "'Brush Script MT', cursive" }}
                  placeholder="Type your full name"
                />
              </div>
            )}

            {/* Drawn signature */}
            {signatureMethod === 'drawn' && (
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                  Draw Your Signature <span className="text-brand-red-500">*</span>
                </label>
                <div className="border-2 border-slate-300 rounded-xl overflow-hidden bg-white">
                  <canvas
                    ref={canvasRef}
                    style={{ width: '100%', height: '160px', touchAction: 'none' }}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => { signaturePad?.clear(); setDrawnSignature(null); }}
                  className="text-sm text-brand-blue-600 hover:underline mt-2"
                >
                  Clear signature
                </button>
              </div>
            )}

            {/* Acknowledgment */}
            <label className="flex items-start gap-3 cursor-pointer p-4 bg-white rounded-xl border border-slate-200 hover:bg-white transition-colors">
              <input
                type="checkbox"
                checked={acknowledged}
                onChange={(e) => setAcknowledged(e.target.checked)}
                className="mt-0.5 w-5 h-5 text-brand-blue-600 border-slate-300 rounded focus:ring-brand-blue-500"
              />
              <span className="text-sm text-slate-700 leading-relaxed">
                I have read and agree to the terms of this agreement. I understand this constitutes a legally binding electronic signature.
              </span>
            </label>

            {/* Submit */}
            <button
              onClick={handleSign}
              disabled={!isFormValid() || submitting}
              className={`w-full py-3.5 px-4 rounded-xl font-semibold text-base transition-colors ${
                isFormValid() && !submitting
                  ? 'bg-brand-blue-600 text-white hover:bg-brand-blue-700'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              }`}
            >
              {submitting ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Signing...
                </span>
              ) : currentIndex < missingAgreements.length - 1 ? (
                <span className="flex items-center justify-center gap-2">
                  Sign & Continue <ChevronRight className="w-5 h-5" />
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <Check className="w-5 h-5" /> Sign & Complete Enrollment
                </span>
              )}
            </button>

            <p className="text-xs text-slate-500 text-center flex items-center justify-center gap-1.5">
              <Lock className="w-3 h-3" />
              Your signature, IP address, and timestamp are recorded securely.
            </p>
          </div>
        </div>

        {/* Trust badges */}
        <div className="mt-6 grid grid-cols-3 gap-4">
          {[
            { img: '/images/pages/admin-governance-legal-hero.jpg', label: 'FERPA Compliant' },
            { img: '/images/pages/admin-signatures-hero.jpg', label: 'Secure E-Signature' },
            { img: '/images/pages/onboarding-page-2.jpg', label: 'DOL Registered' },
          ].map((badge) => (
            <div key={badge.label} className="relative rounded-xl overflow-hidden border border-slate-200">
              <div className="relative h-20">
                <Image src={badge.img} alt={badge.label} fill sizes="33vw" className="object-cover" />
                
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-white text-xs font-bold text-center px-2 leading-tight">{badge.label}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}

export default function LegalAgreementsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-brand-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-slate-600">Loading...</p>
        </div>
      </div>
    }>
      <LegalAgreementsContent />
    </Suspense>
  );
}
