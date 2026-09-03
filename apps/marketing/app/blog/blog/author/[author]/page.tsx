import { permanentRedirect } from 'next/navigation';

export const metadata = { robots: { index: false, follow: false } };

export default async function LegacyDuplicateRoute({ params }: { params: Promise<{ author: string }> }) {
  const { author } = await params;
  permanentRedirect(`/blog/author/${encodeURIComponent(author)}`);
}
