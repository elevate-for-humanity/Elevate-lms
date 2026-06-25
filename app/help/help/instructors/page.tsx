import { redirect } from 'next/navigation';
import { Metadata } from 'next';


export const metadata: Metadata = {
  title: 'Redirect',
  robots: { index: false, follow: false },
  alternates: { canonical: 'https://www.elevateforhumanity.org/help/instructors' },
};

export default function Page() {
  redirect('/support');
}
