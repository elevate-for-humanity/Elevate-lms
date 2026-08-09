import { permanentRedirect } from 'next/navigation';

export const metadata = { robots: { index: false, follow: false } };

export default async function LegacyDuplicateRoute({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  permanentRedirect(`/blog/${encodeURIComponent(slug)}`);
}
