import { notFound } from 'next/navigation';

interface PageProps {
  params: { path: string[] };
}

export default function CaseManagerCatchAll({ params }: PageProps) {
  const path = params.path?.join('/') || '';
  
  // Dynamic routing handled by individual pages
  // This catchall handles any unmatched /case-manager/* routes
  
  notFound();
}
