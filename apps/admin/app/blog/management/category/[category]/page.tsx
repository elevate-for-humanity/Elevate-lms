import type { Metadata } from 'next';
import { permanentRedirect } from 'next/navigation';

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function LegacyAdminBlogCategory({ params }: { params: Promise<{ category: string }> }) {
  const { category } = await params;
  permanentRedirect(`https://www.elevateforhumanity.org/blog/category/${encodeURIComponent(category)}`);
}
