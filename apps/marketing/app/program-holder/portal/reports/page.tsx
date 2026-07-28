import { redirect } from 'next/navigation';
import { Metadata } from 'next';

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

// Legacy portal redirect — reports section
export default function PortalReportsPage() {
  redirect('/program-holder/dashboard');
}
