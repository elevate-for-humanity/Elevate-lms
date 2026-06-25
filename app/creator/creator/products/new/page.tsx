import { redirect } from 'next/navigation';
import { Metadata } from 'next';


export const metadata: Metadata = {
  title: 'New',
  alternates: { canonical: 'https://www.elevateforhumanity.org/creator/products/new' },
};

export default function Page() {
  redirect('/store');
}
