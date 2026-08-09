import { permanentRedirect } from 'next/navigation';

export const metadata = { robots: { index: false, follow: false } };

export default async function LegacyDuplicateRoute({ params }: { params: Promise<{ category: string }> }) {
  const { category } = await params;
  permanentRedirect(`/blog/category/${encodeURIComponent(category)}`);
}
