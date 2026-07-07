import { redirect } from 'next/navigation';

interface PageProps {
  params: { path: string[] };
}

export default function TaxCatchAll({ params }: PageProps) {
  // Redirect tax routes to main tax page
  redirect('/');
}
