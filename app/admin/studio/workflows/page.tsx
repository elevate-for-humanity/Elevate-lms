import { Metadata } from 'next';
import WorkflowsClient from './WorkflowsClient';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Workflows | Dev Studio' };

export default function WorkflowsPage() {
  return <WorkflowsClient />;
}
