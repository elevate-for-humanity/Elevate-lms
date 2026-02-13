import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

interface SaveTaxReturnBody {
  taxReturn: Record<string, unknown>;
  currentStep: number;
}

export async function POST(request: NextRequest) {
  try {
    const { taxReturn, currentStep }: SaveTaxReturnBody = await request.json();
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Save progress to database
    const { error } = await supabase
      .from('tax_return_drafts')
      .upsert({
        email: taxReturn.email,
        tax_year: 2024,
        current_step: currentStep,
        return_data: taxReturn,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'email,tax_year'
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: 'Failed to save progress' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Progress saved successfully',
    });

  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to save tax return' },
      { status: 500 }
    );
  }
}
