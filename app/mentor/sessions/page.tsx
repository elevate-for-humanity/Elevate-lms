import { redirect } from 'next/navigation';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Mentor Sessions',
  robots: { index: false, follow: false },
};

export default function MentorSessionsPage() {
  redirect('/mentor/dashboard');
}
