export const dynamic = 'force-dynamic';
import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

/**
 * QMA (Qualified Medication Aide) application.
 * Routes through the standard intake form with program pre-selected.
 */
export default function QmaApplyPage() {
  redirect('/apply?program=qma&program_name=Qualified+Medication+Aide');
}
