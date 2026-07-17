export const dynamic = 'force-dynamic';
import { redirect } from 'next/navigation';

// /store/licenses/checkout is canonical. This path is a legacy alias.
export default function LicensingCheckoutRedirect({ params }: { params: { slug: string } }) {
  redirect(`/store/licenses/checkout/${params.slug}`);
}
