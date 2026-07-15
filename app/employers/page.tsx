import { redirect } from 'next/navigation';
import { Metadata } from 'next';

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function EmployersPage() {
  // Redirect to the marketing employers page
  redirect('/for-employers');
}
