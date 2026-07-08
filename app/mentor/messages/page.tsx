import { redirect } from 'next/navigation';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Mentor Messages',
  robots: { index: false, follow: false },
};

export default function MentorMessagesPage() {
  redirect('/mentor/dashboard');
}
