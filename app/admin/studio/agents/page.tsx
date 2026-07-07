import { Metadata } from 'next';
import AgentsClient from './AgentsClient';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'AI Agents | Dev Studio' };

export default function AgentsPage() {
  return <AgentsClient />;
}
