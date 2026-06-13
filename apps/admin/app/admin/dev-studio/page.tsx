import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';
import { Metadata } from 'next';
import { Suspense } from 'react';
import DevStudioUnifiedClient from './DevStudioUnifiedClient';

export const dynamic = 'force-dynamic';
export const revalidate = 60;

export const metadata: Metadata = {
  title: `Dev Studio | Admin | ${PLATFORM_DEFAULTS.orgName}`,
};

export default async function DevStudioPage() {
  return (
    <Suspense fallback={null}>
      <DevStudioUnifiedClient isSuperAdmin={true} />
    </Suspense>
  );
}
