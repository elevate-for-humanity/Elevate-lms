import { redirect } from 'next/navigation';

/** Compatibility entry; prices and checkout live in the shared enrollment flow. */
export default async function EnrollmentPaymentPage({ searchParams }: {
  searchParams: Promise<{ program?: string }>;
}) {
  const { program } = await searchParams;
  if (!program || !/^[a-z0-9-]{2,100}$/.test(program)) redirect('/apply');
  redirect(`/enroll/${encodeURIComponent(program)}`);
}
