import { redirect } from 'next/navigation';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Mentor Resources',
  robots: { index: false, follow: false },
};

export default function MentorResourcesPage() {
  redirect('/mentor/dashboard');
}
