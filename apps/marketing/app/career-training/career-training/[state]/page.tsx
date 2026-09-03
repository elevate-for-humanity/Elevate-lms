import type { Metadata } from 'next';
import { permanentRedirect } from 'next/navigation';

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function LegacyCareerTrainingStateRoute({ params }: { params: Promise<{ state: string }> }) {
  const { state } = await params;
  permanentRedirect(`/career-training/${encodeURIComponent(state)}`);
}
