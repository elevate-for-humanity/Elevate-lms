import { redirect } from 'next/navigation';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'ACT WorkKeys / NCRC',
  robots: { index: false, follow: false },
};

// Redirect to the canonical testing provider route
redirect('/testing/workkeys');
