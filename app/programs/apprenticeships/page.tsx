export const dynamic = 'force-dynamic';
// Canonical apprenticeships page is /apprenticeships.
// This route exists for backward compatibility — redirect permanently.
import { redirect } from 'next/navigation';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function ApprenticeshipsProgramsRedirect() {
  redirect('/apprenticeships');
}
