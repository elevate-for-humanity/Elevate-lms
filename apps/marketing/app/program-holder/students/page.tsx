import { redirect } from 'next/navigation';
import { Metadata } from 'next';

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

// Students management is handled within the dashboard
export default function StudentsPage() {
  redirect('/program-holder/dashboard');
}
