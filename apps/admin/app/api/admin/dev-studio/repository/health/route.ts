import { NextRequest } from 'next/server';
import { getRepositoryHealth } from '@/lib/devstudio/repository-health';
import { capabilityHealthResponse } from '@/lib/devstudio/health-response';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  return capabilityHealthResponse(request, getRepositoryHealth);
}
