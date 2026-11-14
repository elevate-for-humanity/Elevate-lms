import { requireRole } from '@/lib/auth/require-role';
import { PHONE_MANAGER_ROLES } from '@/lib/phone/access';
import { ProgramHolderPhone } from '@/components/program-holder/ProgramHolderPhone';
export const dynamic = 'force-dynamic';
export default async function AdminDialPad() {
  await requireRole(PHONE_MANAGER_ROLES);
  return <ProgramHolderPhone roleLabel="Administrator" calendarHref="/phone/meetings" emailHref="/phone/email" textsHref="/phone/texts" />;
}
