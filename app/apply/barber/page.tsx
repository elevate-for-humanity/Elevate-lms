import { redirect } from 'next/navigation';

// Barber Apprenticeship has a dedicated partner application flow.
// Redirect to keep inbound links working.
export default function ApplyBarberPage() {
  redirect('/partners/barbershop-apprenticeship/apply');
}
