import { Metadata } from 'next';
import DeploymentsClient from './DeploymentsClient';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Deployments | Dev Studio' };

export default function DeploymentsPage() {
  return <DeploymentsClient />;
}
