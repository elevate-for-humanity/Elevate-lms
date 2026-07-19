import { redirect } from 'next/navigation';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'HiSET Testing',
  robots: { index: false, follow: false },
};

export default function Page() {
  redirect('/testing');
}


