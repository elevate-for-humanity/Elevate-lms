import { redirect } from 'next/navigation';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Mentor Mentees',
  robots: { index: false, follow: false },
};

export default function MentorMenteesPage() {
  redirect('/mentor/dashboard');
}
