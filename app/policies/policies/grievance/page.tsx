import { redirect } from 'next/navigation';
import { Metadata } from 'next';


export const metadata: Metadata = {
  title: 'Grievance',
  alternates: { canonical: 'https://www.elevateforhumanity.org/policies/grievance' },
};

export default function Page() {
  redirect('/legal');
}
