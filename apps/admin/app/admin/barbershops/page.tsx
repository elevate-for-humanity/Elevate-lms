import { redirect } from 'next/navigation';

// Redirect to correct admin route
export default function BarbershopsPage() {
  redirect('/admin/barber-shop-applications');
}
