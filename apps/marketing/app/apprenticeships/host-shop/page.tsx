import { Suspense } from 'react';
import BrowseHostShopsClient from './BrowseHostShopsClient';

export const metadata = {
  title: 'Find a Host Barber Shop',
  description:
    'Browse approved barber apprenticeship host shops in Indianapolis. Apply to work and train as a barber apprentice with hands-on experience at licensed barbershops.',
};

export default function BrowseHostShopsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-brand-red-600" />
        </div>
      }
    >
      <BrowseHostShopsClient />
    </Suspense>
  );
}
