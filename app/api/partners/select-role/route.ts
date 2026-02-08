export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

import { NextRequest, NextResponse } from 'next/server';
import { parseBody, getErrorMessage } from '@/lib/api-helpers';
import { createClient } from '@/utils/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await parseBody<Record<string, any>>(request);
    const { role } = body;

    if (
      !role ||
      !['PROGRAM_HOLDER', 'WORKSITE_ONLY', 'SITE_COORDINATOR'].includes(role)
    ) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
    }

    // Check if user already has a partner profile
    const { data: existingProfile } = await supabase
      .from('partner_profiles')
      .select('id, role, status')
      .eq('user_id', user.id)
      .single();

    if (existingProfile) {
      return NextResponse.json(
        { error: 'You already have a partner profile' },
        { status: 400 }
      );
    }

    // Create partner profile
    const { error: profileError } = await supabase
      .from('partner_profiles')
      .insert({
        user_id: user.id,
        role: role,
        status: 'pending',
      });

    if (profileError) {
      return NextResponse.json(
        { error: 'Failed to create partner profile' },
        { status: 500 }
      );
    }

    // Initiate onboarding
    const { error: onboardingError } = await supabase.rpc(
      'initiate_onboarding',
      {
        p_user_id: user.id,
        p_role: role,
      }
    );

    if (onboardingError) {
      // Don't fail the request, onboarding can be initiated later
    }

    // Log audit trail
    await supabase.from('audit_log').insert({
      actor_user_id: user.id,
      action: 'partner_role_selected',
      entity: 'partner_profiles',
      changes: { role },
      ip_address:
        request.headers.get('x-forwarded-for') ||
        request.headers.get('x-real-ip'),
      user_agent: request.headers.get('user-agent'),
    });

    return NextResponse.json({
      success: true,
      role,
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        err:
          (err instanceof Error ? err.message : String(err)) ||
          'Internal server err',
      },
      { status: 500 }
    );
  }
}
