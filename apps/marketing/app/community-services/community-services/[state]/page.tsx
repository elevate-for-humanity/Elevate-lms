import { permanentRedirect } from 'next/navigation';

export const metadata = { robots: { index: false, follow: false } };

export default async function LegacyRepeatedRoute({ params }: { params: Promise<{ state: string }> }) {
  const { state } = await params;
  permanentRedirect(`/community-services/${encodeURIComponent(state)}`);
}
