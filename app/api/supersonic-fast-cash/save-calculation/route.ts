import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { applyRateLimit } from '@/lib/api/withRateLimit';

/**
 * Save tax calculation to database
 */
export async function POST(request: NextRequest) {
  try {
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;

    const body = await request.json();
    const supabase = await createClient();
  const _admin = createAdminClient(); const db = _admin || supabase;

    // Get user if authenticated, otherwise use email
    const { data: { user } } = await supabase.auth.getUser();

    // Save calculation
    const { data, error }: any = await db
      .from('tax_calculations')
      .insert({
        user_id: user?.id || null,
        user_email: body.email || user?.email,
        tax_year: body.taxReturn.tax_year || 2024,
        filing_status: body.taxReturn.filing_status,
        total_income: body.calculation.total_income,
        adjusted_gross_income: body.calculation.adjusted_gross_income,
        taxable_income: body.calculation.taxable_income,
        federal_tax: body.calculation.federal_tax,
        total_tax: body.calculation.total_tax,
        federal_withholding: body.federalWithholding,
        estimated_refund: body.refundResult.refund_or_owed,
        is_refund: body.refundResult.is_refund,
        calculation_data: body.taxReturn,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: 'Failed to save calculation', details: 'Internal server error' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      calculation: data,
      message: 'Calculation saved successfully',
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Get user's saved calculations
 */
export async function GET(request: NextRequest) {
  try {
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;

    const supabase = await createClient();
  const _admin = createAdminClient(); const db = _admin || supabase;
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { data, error }: any = await db
      .from('tax_calculations')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json(
        { error: 'Failed to fetch calculations' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      calculations: data,
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
