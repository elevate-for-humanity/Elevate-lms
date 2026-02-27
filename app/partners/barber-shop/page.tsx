import { redirect } from 'next/navigation';

// Redirect to the main barbershop apprenticeship partner page
// to avoid duplicate content and ensure a single partner flow.
export default function BarberShopPartnerPage() {
  redirect('/partners/barbershop-apprenticeship');
}
