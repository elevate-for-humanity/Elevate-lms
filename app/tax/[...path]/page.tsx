import { redirect } from 'next/navigation';
import { Metadata } from 'next';

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

interface PageProps {
  params: { path: string[] };
}

export default function TaxCatchAll({ params }: PageProps) {
  // Redirect tax routes to main tax page
  redirect('/');
}
