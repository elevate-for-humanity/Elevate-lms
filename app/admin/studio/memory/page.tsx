import { Metadata } from 'next';
import MemoryClient from './MemoryClient';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'AI Memory | Dev Studio' };

export default function MemoryPage() {
  return <MemoryClient />;
}
