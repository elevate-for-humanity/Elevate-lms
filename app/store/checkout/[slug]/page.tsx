import { redirect } from 'next/navigation';

// Canonical checkout is /store/licenses/checkout/[slug]
export default async function StoreCheckoutSlugRedirect({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  redirect(`/store/licenses/checkout/${slug}`);
}
