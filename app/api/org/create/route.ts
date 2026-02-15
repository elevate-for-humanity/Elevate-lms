import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;
import { createClient } from '@/lib/supabase/server';
import { bindUserToOrg } from '@/lib/org/bindUserToOrg';
import { applyRateLimit } from '@/lib/api/withRateLimit';

export async function POST(req: NextRequest) {
  try {
    const rateLimited = await applyRateLimit(req, 'api');
    if (rateLimited) return rateLimited;

    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { name, slug, type } = body;

    if (!name || !slug) {
      return NextResponse.json(
        { error: 'Missing required fields: name, slug' },
        { status: 400 }
      );
    }

    // Validate slug format (lowercase, alphanumeric, hyphens only)
    if (!/^[a-z0-9-]+$/.test(slug)) {
      return NextResponse.json(
        { error: 'Slug must be lowercase alphanumeric with hyphens only' },
        { status: 400 }
      );
    }

    // Create organization
    const { data: org, error: orgError } = await supabase
      .from('organizations')
      .insert({
        name,
        slug,
        type: type ?? 'training_provider',
        status: 'active',
      })
      .select()
      .single();

    if (orgError) {
      if (orgError.code === '23505') {
        return NextResponse.json(
          { error: 'Organization slug already exists' },
          { status: 409 }
        );
      }
      throw orgError;
    }

    // Seed default settings
    const { error: settingsError } = await supabase
      .from('organization_settings')
      .insert({
        organization_id: org.id,
      });

    if (settingsError) {
      throw settingsError;
    }

    // Assign creator as org_admin
    const { error: memberError } = await supabase
      .from('organization_users')
      .insert({
        organization_id: org.id,
        user_id: user.id,
        role: 'org_admin',
      });

    if (memberError) {
      throw memberError;
    }

    // Bind user profile to org
    await bindUserToOrg(supabase, user.id, org.id);

    return NextResponse.json({
      organization: org,
      message: 'Organization created successfully',
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        err:
          ('Internal server error') ||
          'Failed to create organization',
      },
      { status: 500 }
    );
  }
}
