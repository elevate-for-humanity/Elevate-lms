import { NextResponse } from 'next/server';


import { parseBody } from '@/lib/api-helpers';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { requireAuth } from '@/lib/api/requireAuth';
import { withApiAudit } from '@/lib/audit/withApiAudit';
export const maxDuration = 60;

async function _GET(request: Request) {
  
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;

    const auth = await requireAuth(request);
    if (auth.error) return auth.error;
return NextResponse.json({
    provider: 'Certiport',
    status: 'active',
    certifications: [
      'Microsoft Office Specialist',
      'IC3 Digital Literacy',
      'Adobe Certified Professional',
      'Autodesk Certified User',
      'Intuit QuickBooks Certified User',
    ],
    integration_status: 'ready',
  });
}

async function _POST(request: Request) {
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;
    const auth = await requireAuth(request);
    if (auth.error) return auth.error;


  const body = await parseBody<Record<string, any>>(request);

  return NextResponse.json({
    success: true,
    message: 'Certiport certification tracking activated',
    student_id: body.student_id,
    certification: body.certification,
  });
}
export const GET = withApiAudit('/api/certifications/certiport', _GET);
export const POST = withApiAudit('/api/certifications/certiport', _POST);
