import dynamic from 'next/dynamic';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';
import type { Metadata } from 'next';

export const dynamic = 'force-dynamic';
export const revalidate = 60;

export const metadata: Metadata = {
  title: `Dev Studio | Admin | ${PLATFORM_DEFAULTS.orgName}`,
  description: 'AI-powered course builder and content management.',
  robots: { index: false, follow: false },
};

// Lazy load the DevStudioUnifiedClient to avoid SSR issues
const DevStudioUnifiedClient = dynamic(
  () => import('./DevStudioUnifiedClient'),
  { 
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-red-600"></div>
      </div>
    )
  }
);

export default async function StudioPage() {
  // Auth disabled - Northflank IP whitelist handles admin auth
  return <DevStudioUnifiedClient />;
}
