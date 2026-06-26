// AUTH: Enforced inside handler (createClient + getUser check)
import { NextRequest } from 'next/server';
import { handleDashboard } from '@/lib/api/apprentice-dashboard-handler';
export const dynamic = 'force-dynamic';
export async function GET(request: NextRequest) {
  return handleDashboard(request, 'esthetician');
}
