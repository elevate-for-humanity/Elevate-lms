'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { AgreementSignature } from '@/components/compliance/AgreementSignature';
import { updateOnboardingProgress, getCurrentAgreementVersions } from '@/lib/compliance/enforcement';
import {
  FileText,
  Check,
  ChevronLeft,
  ChevronRight,
  Shield,
  Users,
  BookOpen,
} from 'lucide-react';

interface Agreement {
  type: string;
  title: string;
  description: string;
  icon: React.ElementType;
  documentUrl: string;
  version: string;
}

const REQUIRED_AGREEMENTS: Agreement[] = [
  {
    type: 'enrollment',
    title: 'Enrollment Agreement',
    description: 'Terms and conditions of your enrollment in the program',
    icon: FileText,
    documentUrl: '/legal/enrollment-agreement',
    version: '1.0',
  },
  {
    type: 'participation',
    title: 'Participation Agreement',
    description: 'Program participation requirements and expectations',
    icon: Users,
    documentUrl: '/legal/participation-agreement',
    version: '1.0',
  },
  {
    type: 'ferpa',
    title: 'FERPA Consent',
    description: 'Authorization for release of educational records',
    icon: Shield,
    documentUrl: '/legal/ferpa-consent',
    version: '1.0',
  },
];

export default function OnboardingAgreementsPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [currentAgreementIndex, setCurrentAgreementIndex] = useState(0);
  const [signedAgreements, setSignedAgreements] = useState<Set<string>>(new Set());
  const [versions, setVersions] = useState<Record<string, { version: string; url: string }>>({});

  useEffect(() => {
    const supabase = createClient();

    supabase?.auth.getUser().then(async ({ data, error }) => {
      if (error || !data?.user) {
        router.push('/login?next=/student-portal/onboarding/agreements');
        return;
      }

      setUser(data.user);

      // Get current agreement versions
      const agreementVersions = await getCurrentAgreementVersions();
      setVersions(agreementVersions);

      // Check which agreements are already signed
      const { data: acceptances } = await supabase
        .from('license_agreement_acceptances')
        .select('agreement_type')
        .eq('user_id', data.user.id);

      const signed = new Set(acceptances?.map((a) => a.agreement_type) || []);
      setSignedAgreements(signed);

      // Find first unsigned agreement
      const firstUnsigned = REQUIRED_AGREEMENTS.findIndex(
        (a) => !signed.has(a.type)
      );
      if (firstUnsigned >= 0) {
        setCurrentAgreementIndex(firstUnsigned);
      }

      setLoading(false);
    });
  }, [router]);

  const currentAgreement = REQUIRED_AGREEMENTS[currentAgreementIndex];
  const allSigned = REQUIRED_AGREEMENTS.every((a) => signedAgreements.has(a.type));

  const handleSignatureSuccess = async (acceptanceId: string) => {
    const newSigned = new Set(signedAgreements);
    newSigned.add(currentAgreement.type);
    setSignedAgreements(newSigned);

    // Check if all agreements are now signed
    const allNowSigned = REQUIRED_AGREEMENTS.every((a) => newSigned.has(a.type));

    if (allNowSigned && user) {
      // Update onboarding progress
      await updateOnboardingProgress(user.id, 'agreements', true);

      // Redirect to next step after short delay
      setTimeout(() => {
        router.push('/student-portal/onboarding');
      }, 1500);
    } else {
      // Move to next unsigned agreement
      const nextUnsigned = REQUIRED_AGREEMENTS.findIndex(
        (a, i) => i > currentAgreementIndex && !newSigned.has(a.type)
      );
      if (nextUnsigned >= 0) {
        setTimeout(() => {
          setCurrentAgreementIndex(nextUnsigned);
        }, 1500);
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600">Loading agreements...</p>
        </div>
      </div>
    );
  }

  if (allSigned) {
    return (
      <div className="min-h-screen bg-slate-50 py-12">
        <div className="max-w-2xl mx-auto px-4">
          <div className="bg-white rounded-xl shadow-sm p-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="w-8 h-8 text-green-600" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 mb-2">
              All Agreements Signed
            </h1>
            <p className="text-slate-600 mb-6">
              You have successfully signed all required agreements.
            </p>
            <Link
              href="/student-portal/onboarding"
              className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              Continue Onboarding
              <ChevronRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-12">
      <div className="max-w-3xl mx-auto px-4">
        {/* Back Link */}
        <Link
          href="/student-portal/onboarding"
          className="inline-flex items-center gap-1 text-slate-600 hover:text-slate-900 mb-6"
        >
          <ChevronLeft className="w-4 h-4" />
          Back to Onboarding
        </Link>

        {/* Progress Indicator */}
        <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-slate-700">
              Agreement Progress
            </span>
            <span className="text-sm text-slate-500">
              {signedAgreements.size} of {REQUIRED_AGREEMENTS.length} signed
            </span>
          </div>
          <div className="flex gap-2">
            {REQUIRED_AGREEMENTS.map((agreement, index) => (
              <div
                key={agreement.type}
                className={`flex-1 h-2 rounded-full ${
                  signedAgreements.has(agreement.type)
                    ? 'bg-green-500'
                    : index === currentAgreementIndex
                    ? 'bg-blue-500'
                    : 'bg-slate-200'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Agreement Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {REQUIRED_AGREEMENTS.map((agreement, index) => {
            const Icon = agreement.icon;
            const isSigned = signedAgreements.has(agreement.type);
            const isCurrent = index === currentAgreementIndex;

            return (
              <button
                key={agreement.type}
                onClick={() => !isSigned && setCurrentAgreementIndex(index)}
                disabled={isSigned}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${
                  isSigned
                    ? 'bg-green-100 text-green-700'
                    : isCurrent
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-slate-600 hover:bg-slate-100'
                }`}
              >
                {isSigned ? (
                  <Check className="w-4 h-4" />
                ) : (
                  <Icon className="w-4 h-4" />
                )}
                <span className="text-sm font-medium">{agreement.title}</span>
              </button>
            );
          })}
        </div>

        {/* Current Agreement */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          {/* Agreement Header */}
          <div className="bg-slate-50 border-b border-slate-200 p-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                {(() => {
                  const Icon = currentAgreement.icon;
                  return <Icon className="w-6 h-6 text-blue-600" />;
                })()}
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900">
                  {currentAgreement.title}
                </h1>
                <p className="text-slate-600 mt-1">
                  {currentAgreement.description}
                </p>
                <p className="text-sm text-slate-500 mt-2">
                  Version {versions[currentAgreement.type]?.version || currentAgreement.version}
                </p>
              </div>
            </div>
          </div>

          {/* Agreement Content Preview */}
          <div className="p-6 border-b border-slate-200">
            <div className="bg-slate-50 rounded-lg p-4 max-h-64 overflow-y-auto">
              <h3 className="font-semibold text-slate-900 mb-2">
                Agreement Summary
              </h3>
              {currentAgreement.type === 'enrollment' && (
                <div className="text-sm text-slate-600 space-y-2">
                  <p>This Enrollment Agreement outlines the terms and conditions of your enrollment in the training program, including:</p>
                  <ul className="list-disc list-inside space-y-1 ml-2">
                    <li>Program duration and schedule</li>
                    <li>Tuition and payment terms</li>
                    <li>Attendance requirements</li>
                    <li>Academic standards and grading policies</li>
                    <li>Withdrawal and refund policies</li>
                    <li>Student rights and responsibilities</li>
                  </ul>
                </div>
              )}
              {currentAgreement.type === 'participation' && (
                <div className="text-sm text-slate-600 space-y-2">
                  <p>This Participation Agreement establishes expectations for your active participation in the program:</p>
                  <ul className="list-disc list-inside space-y-1 ml-2">
                    <li>Code of conduct and professional behavior</li>
                    <li>Attendance and punctuality requirements</li>
                    <li>Assignment completion expectations</li>
                    <li>Communication guidelines</li>
                    <li>Equipment and resource usage policies</li>
                    <li>Safety protocols and procedures</li>
                  </ul>
                </div>
              )}
              {currentAgreement.type === 'ferpa' && (
                <div className="text-sm text-slate-600 space-y-2">
                  <p>The Family Educational Rights and Privacy Act (FERPA) consent authorizes:</p>
                  <ul className="list-disc list-inside space-y-1 ml-2">
                    <li>Release of educational records to authorized parties</li>
                    <li>Sharing of progress information with funding agencies</li>
                    <li>Communication with employers for job placement</li>
                    <li>Verification of enrollment and completion status</li>
                  </ul>
                  <p className="mt-2">You may revoke this consent at any time by submitting a written request.</p>
                </div>
              )}
              <Link
                href={currentAgreement.documentUrl}
                target="_blank"
                className="inline-flex items-center gap-1 text-blue-600 hover:underline mt-4 text-sm"
              >
                View Full Document
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {/* Signature Section */}
          <div className="p-6">
            <AgreementSignature
              agreementType={currentAgreement.type}
              documentVersion={versions[currentAgreement.type]?.version || currentAgreement.version}
              documentUrl={currentAgreement.documentUrl}
              acceptanceContext="onboarding"
              onSuccess={handleSignatureSuccess}
              onError={(error) => console.error('Signature error:', error)}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
