import { redirect } from 'next/navigation';

export default function ApplyBarberRedirect() {
  redirect('/partners/host-shop/apply?program=barber');
}

export const metadata = {
  title: 'Apply - Redirect',
  robots: { index: false, follow: false },
};
