import { notFound } from 'next/navigation';

interface PageProps {
  params: Promise<{ path: string[] }>;
}

export default async function CaseManagerCatchAll({ params }: PageProps) {
  const { path: pathSegments } = await params;
  const path = pathSegments?.join('/') || '';
  
  // Dynamic routing handled by individual pages
  // This catchall handles any unmatched /case-manager/* routes
  
  notFound();
}
