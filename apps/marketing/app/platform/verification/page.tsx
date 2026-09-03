import type { Metadata } from 'next';
import { BlockchainCredentialVerification } from '@/components/BlockchainCredentialVerification';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

export const metadata: Metadata = {
  title: `Credential Integrity Verification | ${PLATFORM_DEFAULTS.orgName}`,
  description:
    'Verify a credential against the live canonical certificate registry and its SHA-256 issuance-integrity evidence.',
  alternates: { canonical: 'https://www.elevateforhumanity.org/platform/verification' },
};

export default function VerificationPage() {
  return <BlockchainCredentialVerification />;
}
