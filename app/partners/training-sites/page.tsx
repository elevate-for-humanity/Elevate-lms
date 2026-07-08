import { redirect } from 'next/navigation';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Training Sites | Partners',
  robots: { index: false, follow: false },
};

export default function PartnersTrainingSitesPage() {
  redirect('/partners');
}
