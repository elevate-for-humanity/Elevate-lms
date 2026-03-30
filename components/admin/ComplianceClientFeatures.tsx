'use client';
import dynamic from 'next/dynamic';

const BlockchainCredentialVerification = dynamic(() => import('@/components/BlockchainCredentialVerification'), { ssr: false });

export default function ComplianceClientFeatures() {
  return (
    <>
      <BlockchainCredentialVerification />
    </>
  );
}
