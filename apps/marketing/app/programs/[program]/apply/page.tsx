import { redirect } from 'next/navigation';

/** All program application aliases share the two-stage admissions flow. */
export default async function ProgramApplicationPage({ params }: {
  params: Promise<{ program: string }>;
}) {
  const { program } = await params;
  redirect(`/apply/student?program=${encodeURIComponent(program)}&intent=inquiry`);
}
