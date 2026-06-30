import { Metadata } from 'next';
import { requireProgramHolder } from '@/lib/auth/require-program-holder';
import { ProgramHolderHoursClient } from './ProgramHolderHoursClient';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Hour Approvals | Program Holder',
  robots: { index: false },
};

export default async function ProgramHolderHoursPage() {
  await requireProgramHolder();
  return <ProgramHolderHoursClient />;
}
