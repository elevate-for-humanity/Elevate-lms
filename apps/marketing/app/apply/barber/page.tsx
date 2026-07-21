import { redirect } from 'next/navigation';

export const metadata = {
  title: 'Barber Apprenticeship Application | Elevate for Humanity',
  description: 'Apply for our DOL-registered barber apprenticeship program. Earn while you learn and get your Indiana barber license.',
  robots: { index: false, follow: false },
};

export default function ApplyBarberPage() {
  redirect('/programs/barber-apprenticeship/apply');
}
