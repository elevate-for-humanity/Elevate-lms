import { redirect } from 'next/navigation';

export const metadata = {
  title: 'Apprenticeship Programs',
  description: 'Explore Barber, Cosmetology, Esthetician, and Nail Technician apprenticeship programs.',
  robots: { index: false, follow: true },
};

export default function BarberAndBeautyApprenticeshipsPage() {
  redirect('/programs');
}
