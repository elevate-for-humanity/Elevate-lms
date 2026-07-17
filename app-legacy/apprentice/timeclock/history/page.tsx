import { Metadata } from 'next';
import { redirect } from 'next/navigation';

export const metadata: Metadata = {
  title: 'Time Clock History | Apprentice',
  description: 'View your time clock history.',
};

export default function TimeClockHistoryPage() {
  redirect('/apprentice/hours');
}
