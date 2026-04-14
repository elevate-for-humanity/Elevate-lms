import { apiRequireAdmin } from '@/lib/admin/guards';
import { NextResponse } from 'next/server';

import { createClient } from '@/lib/supabase/server';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';
export const runtime = 'nodejs';
export const maxDuration = 60;

export const dynamic = 'force-dynamic';

async function _GET(request: Request) {
  const auth = await apiRequireAdmin(request);
  if (auth.error) return auth.error;

  try {
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;

    const supabase = await createClient();

    const { data: templates, error } = await supabase
      .from('campaign_templates')
      .select('*')
      .eq('is_active', true)
      .order('category', { ascending: true });

    if (error) {
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }

    return NextResponse.json({ templates: templates || [] });
  } catch (error) { 
    return NextResponse.json(
      {
        error:
          'Internal server error',
      },
      { status: 500 }
    );
  }
}
export const GET = withApiAudit('/api/crm/templates', _GET);
