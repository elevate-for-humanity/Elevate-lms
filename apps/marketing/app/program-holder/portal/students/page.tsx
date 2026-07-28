import { redirect } from 'next/navigation';
import { Metadata } from 'next';

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

// Legacy portal redirect — students section
export default function PortalStudentsPage() {
  redirect('/program-holder/dashboard');
}
