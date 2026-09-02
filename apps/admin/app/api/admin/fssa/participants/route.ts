import { requireAdminRole } from '@/lib/api/requireAdminRole';
import { retiredFssaResponse } from '@/lib/api/retired-fssa-route';

export const dynamic = 'force-dynamic';

const retiredParticipants = async () => {
  const authError = await requireAdminRole();
  if (authError) return authError;
  return retiredFssaResponse();
};

export const GET = retiredParticipants;
export const POST = retiredParticipants;
export const PATCH = retiredParticipants;
