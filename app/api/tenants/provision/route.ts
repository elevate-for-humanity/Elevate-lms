
import { createAdminClient } from '@/lib/supabase/admin';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

// app/api/tenants/provision/route.ts
import { NextResponse } from 'next/server';
import { requireApiAuth } from '@/lib/auth';
import { createSupabaseClient } from '@/lib/supabase-api';
import { sendSlackMessage } from '@/lib/notifications/slack';
import { applyRateLimit } from '@/lib/api/withRateLimit';

export async function POST(request: Request) {
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;

  const supabase = createSupabaseClient();
  const session = await requireApiAuth();
  if (!(session as string).isAdmin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const {
    name,
    slug,
    primaryDomain,
    maxActiveLearners,
    maxCourses,
    maxStorageGb,
  } = await request.json();

  if (!name || !slug) {
    return NextResponse.json(
      { error: 'name and slug are required' },
      { status: 400 }
    );
  }

  const { data: tenant, error } = await supabase
    .from('tenants')
    .insert({
      name,
      slug,
      primary_domain: primaryDomain || null,
      max_active_learners: maxActiveLearners ?? 100,
      max_courses: maxCourses ?? 20,
      max_storage_gb: maxStorageGb ?? 50,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json(
      { error: 'Failed to create tenant' },
      { status: 500 }
    );
  }

  await sendSlackMessage({
    text: ':building_construction: New tenant provisioned',
    fields: [
      { title: 'Name', value: tenant.name },
      { title: 'Slug', value: tenant.slug },
      { title: 'Max Learners', value: String(tenant.max_active_learners) },
    ],
  });

  return NextResponse.json({ tenant });
}
