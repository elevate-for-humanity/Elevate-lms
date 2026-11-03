import type { ReactNode } from 'react';
import { MeriStoreMusic } from '@/components/tenant/MeriStoreMusic';

export default async function StoreLayout({ children, params }: {
  children: ReactNode;
  params: Promise<{ subdomain: string }>;
}) {
  const { subdomain } = await params;
  return subdomain === 'meri-gold-round' ? <MeriStoreMusic>{children}</MeriStoreMusic> : children;
}
