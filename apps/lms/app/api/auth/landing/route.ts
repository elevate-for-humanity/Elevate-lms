import { withApiAudit } from '@/lib/audit/withApiAudit';
import { getAuthLanding } from '@/lib/api/auth/shared-route-handlers';

export const runtime = 'nodejs';
export const maxDuration = 60;
export const dynamic = 'force-dynamic';
export const GET = withApiAudit('/api/auth/landing', getAuthLanding);
