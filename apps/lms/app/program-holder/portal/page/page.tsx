import { redirect } from 'next/navigation';
import { Metadata } from 'next';

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

// Legacy portal redirect — main portal page
export default function PortalPage() {
  redirect('/program-holder/dashboard');
}
