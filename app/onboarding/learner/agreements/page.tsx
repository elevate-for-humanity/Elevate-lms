'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { ArrowLeft, CheckCircle2, FileText, Shield, Users } from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { AgreementSignature } from '@/components/compliance/AgreementSignature';

interface AgreementDef {
  type: string;
  title: string;
  description: string;
  documentUrl: string;
  icon: any;
  version: string;
}

const REQUIRED_AGREEMENTS: AgreementDef[] = [
  {
    type: 'enrollment',
    title: 'Enrollment Agreement',
    description: 'This agreement outlines the terms and conditions of your enrollment, including program details, tuition and fees, refund policy, attendance requirements, and your obligations as a student at Elevate for Humanity Career & Technical Institute.',
    documentUrl: '/legal/enrollment-agreement',
    icon: FileText,
    version: '2025.1',
  },
  {
    type: 'participation',
    title: 'Participation Agreement',
    description: 'This agreement confirms that you understand and agree to follow all program policies including the student code of conduct, attendance requirements (80% minimum), dress code, safety protocols, drug and alcohol policy, and academic integrity standards.',
    documentUrl: '/legal/participation-agreement',
    icon: Users,
    version: '2025.1',
  },
  {
    type: 'ferpa',
    title: 'FERPA Consent Form',
    description: 'The Family Educational Rights and Privacy Act (FERPA) protects your educational records. This consent authorizes Elevate for Humanity to share your enrollment status, attendance, grades, and progress with your funding source (WorkOne, employer sponsor, or other agency). You may revoke this consent at any time in writing.',
    documentUrl: '/legal/ferpa-consent',
    icon: Shield,
    version: '2025.1',
  },
];

export default function AgreementsPage() {
  const router = useRouter();
  const [signedTypes, setSignedTypes] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [activeAgreement, setActiveAgreement] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    if (!supabase) { router.push('/login'); return; }

    supabase.auth.getUser().then(({ data, error }) => {
      if (error || !data?.user) { router.push('/login'); return; }

      fetch('/api/compliance/record?type=agreements')
        .then(res => res.json())
        .then(result => {
          const types = new Set((result.data || []).map((a: any) => a.agreement_type));
          setSignedTypes(types);

          // Auto-open first unsigned agreement
          const firstUnsigned = REQUIRED_AGREEMENTS.find(a => !types.has(a.type));
          if (firstUnsigned) setActiveAgreement(firstUnsigned.type);

          setLoading(false);
        })
        .catch(() => setLoading(false));
    });
  }, [router]);

  const allSigned = REQUIRED_AGREEMENTS.every(a => signedTypes.has(a.type));

  const handleSuccess = (type: string) => {
    const updated = new Set(signedTypes);
    updated.add(type);
    setSignedTypes(updated);
    setActiveAgreement(null);

    // Auto-open next unsigned
    const nextUnsigned = REQUIRED_AGREEMENTS.find(a => !updated.has(a.type));
    if (nextUnsigned) {
      setTimeout(() => setActiveAgreement(nextUnsigned.type), 500);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-brand-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-slate-50 border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[
            { label: 'Onboarding', href: '/onboarding/learner' },
            { label: 'Sign Agreements' },
          ]} />
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8">
        <Link href="/onboarding/learner" className="text-sm text-brand-blue-600 flex items-center gap-1 mb-6">
          <ArrowLeft className="w-4 h-4" /> Back to Onboarding
        </Link>

        <h1 className="text-2xl font-bold text-gray-900 mb-2">Sign Required Agreements</h1>
        <p className="text-gray-600 mb-6">
          Review and digitally sign each agreement below. Your signature is legally binding under the
          E-SIGN Act and UETA. Each signature is recorded with your IP address and timestamp for audit purposes.
        </p>

        {/* Progress */}
        <div className="bg-white border rounded-lg p-4 mb-6">
          <div className="flex justify-between text-sm mb-2">
            <span className="font-medium text-gray-700">Agreements Signed</span>
            <span className="text-gray-500">{signedTypes.size} of {REQUIRED_AGREEMENTS.length}</span>
          </div>
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-brand-green-500 rounded-full transition-all duration-500"
              style={{ width: `${(signedTypes.size / REQUIRED_AGREEMENTS.length) * 100}%` }}
            />
          </div>
        </div>

        {allSigned && (
          <div className="bg-brand-green-50 border border-brand-green-200 rounded-lg p-6 mb-6 text-center">
            <CheckCircle2 className="w-12 h-12 text-brand-green-600 mx-auto mb-3" />
            <h2 className="text-xl font-bold text-brand-green-900 mb-2">All Agreements Signed</h2>
            <p className="text-brand-green-700 mb-4">You have signed all required agreements. Continue with your onboarding.</p>
            <Link href="/onboarding/learner" className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-green-600 text-white rounded-lg font-medium hover:bg-brand-green-700">
              Continue Onboarding <ArrowLeft className="w-4 h-4 rotate-180" />
            </Link>
          </div>
        )}

        {/* Agreement Cards */}
        <div className="space-y-4">
          {REQUIRED_AGREEMENTS.map((agreement) => {
            const isSigned = signedTypes.has(agreement.type);
            const isActive = activeAgreement === agreement.type;
            const Icon = agreement.icon;

            return (
              <div key={agreement.type} className={`bg-white border rounded-xl overflow-hidden ${isSigned ? 'border-brand-green-200' : 'border-gray-200'}`}>
                {/* Header */}
                <button
                  type="button"
                  onClick={() => !isSigned && setActiveAgreement(isActive ? null : agreement.type)}
                  className={`w-full p-5 flex items-start gap-4 text-left ${!isSigned ? 'cursor-pointer hover:bg-gray-50' : ''}`}
                  disabled={isSigned}
                >
                  <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${isSigned ? 'bg-brand-green-100' : 'bg-gray-100'}`}>
                    {isSigned ? <CheckCircle2 className="w-5 h-5 text-brand-green-600" /> : <Icon className="w-5 h-5 text-gray-500" />}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className={`font-semibold ${isSigned ? 'text-brand-green-900' : 'text-gray-900'}`}>{agreement.title}</h3>
                      {isSigned && <span className="text-xs bg-brand-green-100 text-brand-green-700 px-2 py-0.5 rounded font-medium">Signed</span>}
                    </div>
                    <p className="text-gray-600 text-sm mt-1">{agreement.description}</p>
                    {!isSigned && (
                      <a
                        href={agreement.documentUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-brand-blue-600 text-sm hover:underline mt-2 inline-block"
                        onClick={(e) => e.stopPropagation()}
                      >
                        Read full document →
                      </a>
                    )}
                  </div>
                </button>

                {/* Signature Form */}
                {isActive && !isSigned && (
                  <div className="border-t border-gray-200 p-5 bg-gray-50">
                    <AgreementSignature
                      agreementType={agreement.type}
                      documentVersion={agreement.version}
                      documentUrl={agreement.documentUrl}
                      acceptanceContext="learner-onboarding"
                      onSuccess={() => handleSuccess(agreement.type)}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
