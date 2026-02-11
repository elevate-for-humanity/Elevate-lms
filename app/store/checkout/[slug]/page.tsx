import { redirect } from 'next/navigation';

// Canonical checkout is /store/licenses/checkout/[slug]
export default function StoreCheckoutSlugRedirect({ params }: { params: { slug: string } }) {
  redirect(`/store/licenses/checkout/${params.slug}`);
}
