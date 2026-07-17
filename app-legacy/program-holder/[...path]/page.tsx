import { notFound } from 'next/navigation';

interface PageProps {
  params: { path: string[] };
}

export default function ProgramHolderCatchAll({ params }: PageProps) {
  const path = params.path?.join('/') || '';
  
  // This catchall handles any unmatched /program-holder/* routes
  notFound();
}
