import type { Metadata } from 'next';
import { permanentRedirect } from 'next/navigation';

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function LegacyTeamMemberRoute({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  permanentRedirect(`/about/team/${encodeURIComponent(slug)}`);
}
