
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

import { NextResponse } from 'next/server';
import { parseBody } from '@/lib/api-helpers';
import { createServerSupabaseClient, getCurrentUser } from '@/lib/auth';
import miladyConfig from '@/lms-data/milady-rise-integration.json';
import { toErrorMessage } from '@/lib/safe';

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = await createServerSupabaseClient();
    const body = await parseBody<Record<string, any>>(request);

    // Create Milady RISE enrollment record
    const { data, error }: any = await supabase
      .from('milady_rise_enrollments')
      .insert({
        student_id: user.id,
        promo_code: miladyConfig.partner_code,
        enrollment_url: miladyConfig.certification.enrollment_url,
        status: 'enrolled',
        enrolled_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: toErrorMessage(error) },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      enrollment: data,
      next_steps: {
        url: miladyConfig.certification.enrollment_url,
        promo_code: miladyConfig.partner_code,
        instructions: miladyConfig.enrollment_instructions,
      },
    });
  } catch (error) { /* Error handled silently */ 
    return NextResponse.json({ error: toErrorMessage(error) }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    program: miladyConfig.program,
    certification: miladyConfig.certification,
    scholarship: miladyConfig.scholarship_details,
    partner_code: miladyConfig.partner_code,
  });
}
