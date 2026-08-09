import type { Metadata } from 'next';

import { requireAdmin } from '@/lib/authGuards';
import PageClient from '../../../admin/studio/workflows/new/PageClient';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = { title: 'New Workflow | Dev Studio' };

/** Canonical workflow creation page for the Admin-owned Studio. */
export default async function NewWorkflowPage() {
  await requireAdmin();
  return <PageClient />;
}
