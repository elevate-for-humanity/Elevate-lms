import { Metadata } from 'next';
import { requireRole } from '@/lib/auth/require-role';
import ContractsClient from './ContractsClient';

export const dynamic = 'force-dynamic';
export const revalidate = 60;

export const metadata: Metadata = {
  title: 'Contract Automation | Admin | Elevate For Humanity',
  description: 'Upload, extract, prefill, sign, and export state contracts and grant templates.',
};

export default async function ContractsPage() {
  await requireRole(['admin', 'staff']);
  return <ContractsClient />;
}
