import { Metadata } from 'next';
import { redirect } from 'next/navigation';

export const metadata: Metadata = {
  title: 'Apprentice Profile',
  description: 'Your apprentice profile.',
};

export default function ApprenticeProfilePage() {
  redirect('/apprentice');
}
