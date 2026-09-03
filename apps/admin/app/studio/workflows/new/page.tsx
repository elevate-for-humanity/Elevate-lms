import type { Metadata } from 'next';
import PageClient from './PageClient';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'New Workflow | Dev Studio',
  robots: { index: false, follow: false },
};

/** Canonical workflow-creation route. */
export default function NewWorkflowPage() {
  return <PageClient />;
}
