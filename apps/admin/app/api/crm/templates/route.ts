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

    let { data: templates, error } = await supabase
      .from('campaign_templates')
      .select('*')
      .eq('is_active', true)
      .order('category', { ascending: true });

    // Replayed baseline schema stores lifecycle in status and template HTML in
    // content. Retry only a missing-column error, never permissions/outages.
    if (error && ['42703', 'PGRST204'].includes(error.code)) {
      const baseline = await supabase.from('campaign_templates')
        .select('id,name,description,content,status,created_at,updated_at')
        .eq('status', 'active')
        .order('name', { ascending: true });
      templates = baseline.data?.map((template) => ({
        ...template,
        subject: template.name,
        html_content: template.content,
        category: 'general',
        is_active: true,
      })) ?? null;
      error = baseline.error;
    }
    if (error) {
      return NextResponse.json({ error: 'Template data unavailable' }, { status: 503 });
    }

    return NextResponse.json({ templates: templates || [] });
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Internal server error',
      },
      { status: 500 },
    );
  }
}
export const GET = withApiAudit('/api/crm/templates', _GET);
