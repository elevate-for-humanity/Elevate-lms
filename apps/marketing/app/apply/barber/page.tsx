import { redirect } from 'next/navigation';

export default function ApplyBarberRedirect() {
  redirect('/partners/barber-host-shop/apply');
}

export const metadata = {
  title: 'Apply - Redirect',
  robots: { index: false, follow: false },
};
