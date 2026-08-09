import { redirect } from 'next/navigation';

/**
 * Compatibility route for historical Barber Host Shop links.
 * The application is universal across Barber, Cosmetology, Esthetics, and Nail.
 */
export default function LegacyBarberHostShopApplyPage() {
  redirect('/partners/host-shop/apply?program=barber');
}
