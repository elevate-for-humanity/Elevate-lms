

import { NextRequest, NextResponse } from 'next/server';
import { requestDataPortability } from '@/lib/gdpr';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';
export const runtime = 'nodejs';
export const maxDuration = 60;

export const dynamic = 'force-dynamic';

async function _POST(request: NextRequest) {
  try {
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { format = 'json' } = await request.json();
    const result = await requestDataPortability(user.id, format);

    if (result.success === false) {
      return NextResponse.json(
        { error: 'error' in result ? result.error : 'Export failed' },
        { status: 500 }
      );
    }

    // Use 'in' operator to safely narrow the union
    return new NextResponse('data' in result ? result.data : '', {
      headers: {
        'Content-Type':
          'contentType' in result ? result.contentType : 'application/json',
        'Content-Disposition': `attachment; filename="${'filename' in result ? result.filename : 'export.json'}"`,
      },
    });
  } catch (error) { 
    logger.error('Error exporting user data:', error);
    return NextResponse.json(
      { error: 'Failed to export data' },
      { status: 500 }
    );
  }
}
export const POST = withApiAudit('/api/gdpr/export', _POST);
