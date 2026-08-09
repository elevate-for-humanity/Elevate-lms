import EnrollmentBookingPage from './EnrollmentClient';
import { loadApplyProgramOptions } from '@/lib/programs/public-program-list';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function Page() {
  const { options } = await loadApplyProgramOptions();
  const programs = options.map((o) => ({ id: o.id, title: o.title, slug: o.slug }));
  return <EnrollmentBookingPage programs={programs} />;
}
