import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default function BarberApprenticeshipShortcut() {
  redirect('/lms/courses/barber-apprenticeship');
}
