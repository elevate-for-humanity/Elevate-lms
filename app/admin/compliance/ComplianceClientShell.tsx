'use client';

import dynamicImport from 'next/dynamic';

const BlockchainCredentialVerification = dynamicImport(
  () =>
    import('@/components/BlockchainCredentialVerification').then((m) => ({
      default: m.BlockchainCredentialVerification,
    })),
  { ssr: false }
);

export default function ComplianceClientShell() {
  return <BlockchainCredentialVerification />;
}
