import { redirect } from 'next/navigation';
import { Metadata } from 'next';


export const metadata: Metadata = {
  title: 'Admin',
  robots: { index: false, follow: false },
};

export default function Page() {
  redirect('/support');
}
