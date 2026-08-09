import type { Metadata } from 'next';
import { permanentRedirect } from 'next/navigation';

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function LegacyAdminBlogAuthor({ params }: { params: Promise<{ author: string }> }) {
  const { author } = await params;
  permanentRedirect(`https://www.elevateforhumanity.org/blog/author/${encodeURIComponent(author)}`);
}
