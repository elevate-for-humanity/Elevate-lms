
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET() {
  return NextResponse.json({
    message: 'Use POST to test insert',
    example: {
      firstName: 'Test',
      lastName: 'User',
      email: 'test@example.com',
      phone: '3175551234',
      program: 'barber',
    },
  });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const supabase = createAdminClient();

    // Try to insert test data
    const { data, error }: any = await supabase
      .from('applications')
      .insert({
        first_name: body.firstName || 'Test',
        last_name: body.lastName || 'User',
        phone: body.phone || '3175551234',
        email: body.email || 'test@example.com',
        program_id: body.program || 'test-program',
        notes: 'Test insert from diagnostic endpoint',
        status: 'pending',
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({
        success: false,
        error: {
          code: (error as any)?.code || "UNKNOWN",
          message: error instanceof Error ? error.message : String(error),
          details: error.details,
          hint: error.hint,
          full: error,
        },
      });
    }

    // Delete the test record
    await supabase.from('applications').delete().eq('id', data.id);

    return NextResponse.json({
      success: true,
      message: 'Insert test successful (record deleted)',
      insertedId: data.id,
    });
  } catch (error) { /* Error handled silently */ 
    return NextResponse.json({
      success: false,
      error: (err as Error).message,
      stack: err.stack,
    });
  }
}
