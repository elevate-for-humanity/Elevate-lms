export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

import { NextRequest, NextResponse } from 'next/server';
import { parseBody } from '@/lib/api-helpers';
import { createClient } from '@/utils/supabase/server';
import { applyRateLimit } from '@/lib/api/withRateLimit';

export async function POST(request: NextRequest) {
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

    const body = await parseBody<Record<string, any>>(request);
    const { role, paymentType, rate, payoutMethod, taxIdUploaded } = body;

    if (!role || !paymentType || !rate || !payoutMethod) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (!taxIdUploaded) {
      return NextResponse.json(
        { error: 'W-9 tax form must be uploaded' },
        { status: 400 }
      );
    }

    // Validate rate against config
    const { data: rateConfig } = await supabase
      .from('payout_rate_configs')
      .select('min_rate, max_rate')
      .eq('role', role)
      .eq('payment_type', paymentType)
      .eq('is_active', true)
      .single();

    if (rateConfig) {
      const rateNum = parseFloat(rate);
      if (rateNum < rateConfig.min_rate || rateNum > rateConfig.max_rate) {
        return NextResponse.json(
          {
            error: `Rate must be between ${rateConfig.min_rate} and ${rateConfig.max_rate}`,
          },
          { status: 400 }
        );
      }
    }

    // Check if payroll profile already exists
    const { data: existingProfile } = await supabase
      .from('payroll_profiles')
      .select('id, status')
      .eq('user_id', user.id)
      .eq('role', role)
      .single();

    if (existingProfile) {
      // Update existing profile
      const { error: updateError } = await supabase
        .from('payroll_profiles')
        .update({
          payment_type: paymentType,
          rate: parseFloat(rate),
          payout_method: payoutMethod,
          tax_id_uploaded: taxIdUploaded,
          status: 'PENDING',
        })
        .eq('id', existingProfile.id);

      if (updateError) {
        return NextResponse.json(
          { error: 'Failed to update payroll profile' },
          { status: 500 }
        );
      }
    } else {
      // Create new profile
      const { error: insertError } = await supabase
        .from('payroll_profiles')
        .insert({
          user_id: user.id,
          role: role,
          payment_type: paymentType,
          rate: parseFloat(rate),
          payout_method: payoutMethod,
          tax_id_uploaded: taxIdUploaded,
          status: 'PENDING',
        });

      if (insertError) {
        return NextResponse.json(
          { error: 'Failed to create payroll profile' },
          { status: 500 }
        );
      }
    }

    // Complete onboarding step
    await supabase.rpc('complete_onboarding_step', {
      p_user_id: user.id,
      p_role: role,
    });

    // Log audit trail
    await supabase.from('audit_log').insert({
      actor_user_id: user.id,
      action: 'payroll_profile_created',
      entity: 'payroll_profiles',
      changes: { role, paymentType, rate, payoutMethod },
      ip_address:
        request.headers.get('x-forwarded-for') ||
        request.headers.get('x-real-ip'),
      user_agent: request.headers.get('user-agent'),
    });

    return NextResponse.json({
      success: true,
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
