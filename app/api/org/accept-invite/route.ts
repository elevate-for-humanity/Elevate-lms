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
    const { token } = body;

    if (!token) {
      return NextResponse.json({ error: 'Missing token' }, { status: 400 });
    }

    // Fetch invite
    const { data: invite, error: inviteError } = await supabase
      .from('org_invites')
      .select('*')
      .eq('token', token)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (inviteError || !invite) {
      return NextResponse.json(
        { error: 'Invalid or expired invite' },
        { status: 404 }
      );
    }

    // Check if user already member
    const { data: existing } = await supabase
      .from('organization_users')
      .select('id')
      .eq('organization_id', invite.organization_id)
      .eq('user_id', user.id)
      .single();

    if (existing) {
      return NextResponse.json(
        { error: 'Already member of organization' },
        { status: 409 }
      );
    }

    // Add user to organization
    const { error: memberError } = await supabase
      .from('organization_users')
      .insert({
        organization_id: invite.organization_id,
        user_id: user.id,
        role: invite.role,
      });

    if (memberError) {
      throw memberError;
    }

    // Bind user profile to org
    await bindUserToOrg(supabase, user.id, invite.organization_id);

    // Delete invite
    await supabase.from('org_invites').delete().eq('id', invite.id);

    return NextResponse.json({
      message: 'Invite accepted successfully',
      organization_id: invite.organization_id,
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        err:
          (err instanceof Error ? err.message : String(err)) ||
          'Failed to accept invite',
      },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const rateLimited = await applyRateLimit(req, 'api');
    if (rateLimited) return rateLimited;

    const { searchParams } = new URL(req.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json({ error: 'Missing token' }, { status: 400 });
    }

    const supabase = await createClient();

    // Use secure function to fetch invite by token
    const { data: invites, error } = await supabase.rpc('get_invite_by_token', {
      invite_token: token,
    });

    if (error || !invites || invites.length === 0) {
      return NextResponse.json(
        { error: 'Invalid or expired invite' },
        { status: 404 }
      );
    }

    const invite = invites[0];

    return NextResponse.json({
      invite: {
        email: invite.email,
        role: invite.role,
        expires_at: invite.expires_at,
        organization_name: invite.organization_name,
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        err:
          (err instanceof Error ? err.message : String(err)) ||
          'Failed to fetch invite',
      },
      { status: 500 }
    );
  }
}
