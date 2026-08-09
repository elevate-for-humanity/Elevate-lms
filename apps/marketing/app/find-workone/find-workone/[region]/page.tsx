import { permanentRedirect } from 'next/navigation';

export const metadata = { robots: { index: false, follow: false } };

export default async function LegacyRepeatedRoute({ params }: { params: Promise<{ region: string }> }) {
  const { region } = await params;
  permanentRedirect(`/find-workone/${encodeURIComponent(region)}`);
}
