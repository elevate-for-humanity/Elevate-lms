import { requireAdminRole } from '@/lib/api/requireAdminRole';
import { retiredFssaResponse } from '@/lib/api/retired-fssa-route';

export const dynamic = 'force-dynamic';

const retiredPlanComponents = async () => {
  const authError = await requireAdminRole();
  if (authError) return authError;
  return retiredFssaResponse();
};

export const GET = retiredPlanComponents;
export const POST = retiredPlanComponents;
export const PATCH = retiredPlanComponents;
