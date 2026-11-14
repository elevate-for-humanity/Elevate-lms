import { requireCommunicationActor } from '@/lib/communications/actor';
import { requireProgramHolder } from '@/lib/auth/require-program-holder';
import type { Metadata } from 'next';
import { ProgramHolderPhone } from '@/components/program-holder/ProgramHolderPhone';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = {
  title: 'Phone | Program Holder',
  robots: { index: false },
};

export default async function ProgramHolderPhonePage() {
  await requireProgramHolder({ allowPendingApproval: true });
  await requireCommunicationActor({ assignedPhone: true });
  return <ProgramHolderPhone calendarHref="/program-holder/meetings" emailHref="/program-holder/email" />;
}
