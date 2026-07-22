import { redirect } from 'next/navigation';
import { Metadata } from 'next';

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function BarberRedirect() {
  redirect('/programs/barber-apprenticeship');
}
