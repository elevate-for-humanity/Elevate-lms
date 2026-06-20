import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/require-admin';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdmin();
    const supabase = await createClient();

    const body = await request.json();
    const {
      user_id,
      hours,
      date,
      host_shop_id,
      payment_amount,
      payment_type = 'cash',
      notes,
    } = body;

    if (!user_id || !hours) {
      return NextResponse.json(
        { error: 'user_id and hours are required' },
        { status: 400 }
      );
    }

    const logDate = date || new Date().toISOString().split('T')[0];
    const results: string[] = [];

    // 1. Log OJT hours
    const { data: ojtLog, error: ojtError } = await supabase
      .from('ojt_hours')
      .insert({
        user_id,
        hours: Number(hours),
        log_date: logDate,
        host_shop_id: host_shop_id || null,
        notes: notes || null,
        status: 'approved',
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (ojtError) {
      console.error('OJT hours insert error:', ojtError);
      return NextResponse.json(
        { error: `Failed to log OJT hours: ${ojtError.message}` },
        { status: 500 }
      );
    }

    results.push(`Added ${hours} OJT hours for user ${user_id}`);

    // 2. Record payment if amount provided
    if (payment_amount) {
      const { data: payLog, error: payError } = await supabase
        .from('apprentice_payroll')
        .insert({
          student_id: user_id,
          pay_period_start: logDate,
          pay_period_end: logDate,
          total_hours: Number(hours),
          hourly_rate: Number(payment_amount) / Number(hours),
          gross_pay: Number(payment_amount),
          status: 'paid',
          paid_at: new Date().toISOString(),
          notes: `Cash payment: $${payment_amount} for ${hours} hours - ${notes || ''}`,
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (payError) {
        console.error('Payroll insert error:', payError);
        // Don't fail the whole request, just note it
      } else {
        results.push(`Recorded $${payment_amount} cash payment`);
      }
    }

    return NextResponse.json({
      success: true,
      message: results.join('. '),
      ojt_log_id: ojtLog?.id,
    });
  } catch (error) {
    console.error('Error in admin OJT hours API:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}