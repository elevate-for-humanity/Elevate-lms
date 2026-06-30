import { redirect } from 'next/navigation';

export default async function PartnerProgramEditRedirect({
  params,
}: {
  params: Promise<{ program: string }>;
}) {
  const { program } = await params;
  redirect(`/partner/courses/create?programId=${encodeURIComponent(program)}`);
}
