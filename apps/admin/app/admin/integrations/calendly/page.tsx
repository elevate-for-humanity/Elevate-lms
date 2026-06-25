import { Metadata } from 'next';
import { requireRole } from '@/lib/auth/require-role';
import CalendlyClient from './CalendlyClient';

export const dynamic = 'force-dynamic';
export const revalidate = 60;

export const metadata: Metadata = {
  title: 'Calendly Integration | Admin | Elevate For Humanity',
};

export default async function CalendlyIntegrationPage() {
  await requireRole(['admin']);
  return <CalendlyClient />;
}
