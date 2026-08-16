import type { Metadata } from 'next';
import DevStudioHealthPanel from '@/components/studio/DevStudioHealthPanel';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { robots: { index: false, follow: false } };

export default function StudioHealthPage() {
  return <main className="p-4 lg:p-6"><DevStudioHealthPanel /></main>;
}
