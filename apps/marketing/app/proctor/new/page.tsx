import { redirect } from 'next/navigation';
import { Metadata } from 'next';

export const metadata: Metadata = {
  robots: { index: false },
  title: 'New Proctor Session',
};

export default function ProctorNewPage() {
  redirect('/proctor');
}
