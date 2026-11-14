import { permanentRedirect } from 'next/navigation';

export const metadata = { robots: { index: false, follow: false } };

export default async function LegacyRepeatedRoute({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  permanentRedirect(`/careers/${encodeURIComponent(id)}`);
}
