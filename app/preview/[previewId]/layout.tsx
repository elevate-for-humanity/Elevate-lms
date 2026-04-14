import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

// Inherits robots: noindex from parent /preview/layout.tsx.
// Explicit here for clarity — this is an internal sales/demo shell.
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default async function Layout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ previewId: string }>;
}) {
  const { previewId } = await params;
  const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!UUID.test(previewId)) notFound();

  return children;
}
