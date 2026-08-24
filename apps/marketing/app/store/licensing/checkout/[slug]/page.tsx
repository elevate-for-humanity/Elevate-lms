import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { robots: { index: false, follow: false } };

// /store/licenses/checkout is canonical. This path is a legacy alias.
export default async function LicensingCheckoutRedirect({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  redirect(`/store/licenses/checkout/${slug}`);
}
