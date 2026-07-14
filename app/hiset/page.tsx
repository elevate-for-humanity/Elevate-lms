import { redirect } from 'next/navigation';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'HiSET Testing',
  robots: { index: false, follow: false },
};

// HiSET testing is available through our main testing center
redirect('/testing');

