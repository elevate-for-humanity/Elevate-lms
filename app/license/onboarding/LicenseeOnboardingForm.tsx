'use client';

import { useRouter } from 'next/navigation';
import { CheckCircle } from 'lucide-react';
import AgreementSigningForm from '@/components/legal/AgreementSigningForm';

interface Props {
  userId: string;
  userEmail?: string;
  userName?: string;
  organizationId?: string;
  requiredAgreements: string[];
  acceptedAgreements: string[];
}

export default function LicenseeOnboardingForm({ 
  userId, 
  userEmail,
  userName,
  organizationId,
  requiredAgreements, 
  acceptedAgreements 
}: Props) {
  const router = useRouter();
  const pendingAgreements = requiredAgreements.filter(a => !acceptedAgreements.includes(a));
  const allAccepted = pendingAgreements.length === 0;

  if (allAccepted) {
    return (
      <div className="text-center py-6">
        <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-3" />
        <p className="text-green-600 font-medium">All agreements signed</p>
      </div>
    );
  }

  // Map agreement types to labels and URLs
  const agreementConfig = requiredAgreements.map(type => {
    const labels: Record<string, string> = {
      eula: 'End User License Agreement',
      tos: 'Terms of Service',
      aup: 'Acceptable Use Policy',
      disclosures: 'Disclosures',
      license: 'Software License Agreement',
    };
    const urls: Record<string, string> = {
      eula: '/legal/eula',
      tos: '/terms-of-service',
      aup: '/legal/acceptable-use',
      disclosures: '/legal/disclosures',
      license: '/legal/license-agreement',
    };
    return {
      type,
      label: labels[type] || type,
      url: urls[type] || `/legal/${type}`,
      required: true,
    };
  });

  return (
    <AgreementSigningForm
      userId={userId}
      organizationId={organizationId}
      agreements={agreementConfig}
      acceptedAgreements={acceptedAgreements}
      signerName={userName}
      signerEmail={userEmail}
      context="onboarding"
      onComplete={() => router.refresh()}
    />
  );
}
