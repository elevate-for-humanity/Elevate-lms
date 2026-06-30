import { redirect } from 'next/navigation';

export const metadata = { robots: { index: false, follow: false } };

export default async function ProgramApplyRedirect({ params }: { params: Promise<{ programId: string }> }) {
  const { programId } = await params;
  redirect(`/apply?program=${encodeURIComponent(programId)}`);
}
