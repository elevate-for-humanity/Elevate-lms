import { redirect } from 'next/navigation';

export default function BarberEnrollRedirect() {
  redirect('/programs/barber-apprenticeship/apply');
}
