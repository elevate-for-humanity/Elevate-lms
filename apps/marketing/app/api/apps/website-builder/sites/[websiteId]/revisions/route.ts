import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireAdminClient } from '@/lib/supabase/admin';
import { getWebsiteBuilderAccess } from '@/lib/apps/website-builder-access';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function authorize(websiteId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.id) return { supabase, user: null, site: null, response: NextResponse.json({ error: 'Authentication required' }, { status: 401 }) };

  const access = await getWebsiteBuilderAccess(user.id, supabase);
  if (!access.allowed) {
    return {
      supabase,
      user,
      site: null,
      response: NextResponse.json({ error: 'Website Builder subscription or active trial required' }, { status: 403 }),
    };
  }

  const admin = await requireAdminClient();
  const { data: site, error } = await admin
    .from('user_websites')
    .select('id, user_id, site_name, subdomain, site_config, is_published')
    .eq('id', websiteId)
    .maybeSingle();
  if (error) return { supabase, user, site: null, response: NextResponse.json({ error: error.message }, { status: 500 }) };
  if (!site || site.user_id !== user.id) {
    return { supabase, user, site: null, response: NextResponse.json({ error: 'Website not found' }, { status: 404 }) };
  }
  return { supabase: admin, user, site, response: null };
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ websiteId: string }> },
) {
  const { websiteId } = await params;
  const auth = await authorize(websiteId);
  if (auth.response) return auth.response;
  if (!auth.user || !auth.site) return NextResponse.json({ error: 'Website authorization failed' }, { status: 500 });

  const { data, error } = await auth.supabase
    .from('website_revisions')
    .select('id, site_name, subdomain, is_published, reason, created_at')
    .eq('website_id', websiteId)
    .eq('user_id', auth.user.id)
    .order('created_at', { ascending: false })
    .limit(30);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ revisions: data || [] });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ websiteId: string }> },
) {
  const { websiteId } = await params;
  const auth = await authorize(websiteId);
  if (auth.response) return auth.response;
  if (!auth.user || !auth.site) return NextResponse.json({ error: 'Website authorization failed' }, { status: 500 });

  const body = await request.json().catch(() => ({}));
  const revisionId = typeof body.revisionId === 'string' ? body.revisionId : '';
  if (!revisionId) return NextResponse.json({ error: 'revisionId is required' }, { status: 400 });

  const { data: revision, error: revisionError } = await auth.supabase
    .from('website_revisions')
    .select('id, site_name, subdomain, site_config, is_published')
    .eq('id', revisionId)
    .eq('website_id', websiteId)
    .eq('user_id', auth.user.id)
    .maybeSingle();

  if (revisionError) return NextResponse.json({ error: revisionError.message }, { status: 500 });
  if (!revision) return NextResponse.json({ error: 'Revision not found' }, { status: 404 });

  await auth.supabase.from('website_revisions').insert({
    website_id: websiteId,
    user_id: auth.user.id,
    site_name: auth.site.site_name,
    subdomain: auth.site.subdomain,
    site_config: auth.site.site_config || {},
    is_published: Boolean(auth.site.is_published),
    reason: 'before_restore',
  });

  const { data: restored, error: restoreError } = await auth.supabase
    .from('user_websites')
    .update({
      site_name: revision.site_name,
      subdomain: revision.subdomain,
      site_config: revision.site_config,
      is_published: revision.is_published,
      status: revision.is_published ? 'published' : 'draft',
      updated_at: new Date().toISOString(),
    })
    .eq('id', websiteId)
    .eq('user_id', auth.user.id)
    .select('id, site_name, subdomain, site_config, is_published')
    .maybeSingle();

  if (restoreError || !restored) {
    return NextResponse.json({ error: restoreError?.message || 'Could not restore revision' }, { status: 500 });
  }

  const publicUrl = restored.subdomain && restored.is_published
    ? `https://${restored.subdomain}.app.elevateforhumanity.org`
    : null;
  return NextResponse.json({ website: restored, publicUrl });
}
