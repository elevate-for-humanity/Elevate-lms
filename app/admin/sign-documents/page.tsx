import { Metadata } from 'next';
import { requireAdmin } from '@/lib/authGuards';
import { SignDocumentsClient } from './SignDocumentsClient';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Sign Documents | Elevate for Humanity',
  description: 'Draw and save your signature, then apply it to W-9 and ACH enrollment forms.',
};

export default async function SignDocumentsPage() {
  await requireAdmin();
  return <SignDocumentsClient />;
}
