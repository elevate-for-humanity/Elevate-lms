export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/auth';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { logger } from '@/lib/logger';

export async function POST(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;

  const auth = await requireAdmin();
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const body = await request.json();
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const { data, error } = await supabase
      .from('crm_deals')
      .insert({
        title: body.title,
        company_name: body.company_name,
        contact_id: body.contact_id || null,
        value: body.value || 0,
        stage: body.stage || 'lead',
        probability: body.probability || 50,
        expected_close_date: body.expected_close_date || null,
        assigned_to: user?.id,
        notes: body.notes || null,
      })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    logger.error('CRM deal creation failed', error as Error);
    return NextResponse.json({ error: 'Failed to create deal' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;

  const auth = await requireAdmin();
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('crm_deals')
    .select('*, contact:crm_contacts(id, first_name, last_name, company)')
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) {
    return NextResponse.json({ error: 'Failed to fetch deals' }, { status: 500 });
  }

  return NextResponse.json({ data });
}
