import { redirect } from 'next/navigation';
import { Metadata } from 'next';


export const metadata: Metadata = {
  title: 'Instructors',
  alternates: { canonical: 'https://www.elevateforhumanity.org/help/instructors' },
};

export default function Page() {
  redirect('/support');
}
