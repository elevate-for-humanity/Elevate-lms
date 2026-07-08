import { redirect } from 'next/navigation';

export default function CosmetologyHostShopDashboard() {
  // Cosmetology host shops use the main host shop dashboard
  redirect('/host-shop/dashboard');
}
