import { NextRequest } from 'next/server';
import { handleLogHours } from '@/lib/api/apprentice-hours-handler';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  return handleLogHours(request, 'nail-tech');
}
