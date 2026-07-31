import type { Metadata } from 'next';
import { requireAdmin } from '@/lib/authGuards';
import PageClient from './PageClient';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = { title: 'New Workflow | Dev Studio' };

export default async function NewWorkflowPage() {
  await requireAdmin();
  return <PageClient />;
}
