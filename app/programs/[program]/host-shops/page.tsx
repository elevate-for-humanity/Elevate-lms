import { redirect } from 'next/navigation';
import type { Metadata } from 'next';

export const dynamic = 'force-dynamic';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ program: string }>;
}): Promise<Metadata> {
  const { program } = await params;
  return {
    title: 'Find a Host Shop',
    description: `Find a licensed host shop for the ${program} apprenticeship program.`,
  };
}

export default async function ProgramHostShopsPage({
  params,
}: {
  params: Promise<{ program: string }>;
}) {
  const { program } = await params;
  
  // Redirect to the main barber & beauty apprenticeships page which has the host shop finder
  // All beauty programs (barber, cosmetology, esthetician, nail tech) share the same host shop ecosystem
  redirect('/barber-and-beauty-apprenticeships#host-shops');
}
