import { redirect } from 'next/navigation';

export const metadata = { robots: { index: false } };

// Redirect to correct admin route
export default function BarbershopsPage() {
  redirect('/barber-shop-applications');
}
