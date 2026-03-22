import { redirect } from 'next/navigation';

// Barber program now served by the generic partner/programs/[slug] route.
export default function BarberProgramRedirect() {
  redirect('/partner/programs/barber-apprenticeship');
}
