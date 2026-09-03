import { Metadata } from 'next';
import BuildsClient from './BuildsClient';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Builds | Dev Studio' };

export default function BuildsPage() {
  return <BuildsClient />;
}
