import { redirect } from 'next/navigation';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Hours Export | Admin',
  robots: { index: false, follow: false },
};

export default function AdminHoursExportPage() {
  redirect('/');
}
