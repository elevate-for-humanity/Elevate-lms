import { redirect } from 'next/navigation';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'NHA Certification Testing',
  robots: { index: false, follow: false },
};

// Redirect to the canonical NHA testing route
redirect('/testing/nha');
