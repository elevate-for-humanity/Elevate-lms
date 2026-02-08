export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

// app/api/employee/me/route.ts
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';
import { toError, toErrorMessage } from '@/lib/safe';

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get employee record for current user
    const { data: employee, error } = await supabase
      .from('employees')
      .select(
        `
        *,
        profile:profiles(*),
        department:departments(*),
        position:positions(*)
      `
      )
      .eq('profile_id', user.id)
      .single();

    if (error) {
      return NextResponse.json(
        { error: toErrorMessage(error) },
        { status: 404 }
      );
    }

    return NextResponse.json({ employee });
  } catch (error) { /* Error handled silently */ 
    logger.error(
      'Error fetching employee:',
      error instanceof Error ? error : new Error(String(error))
    );
    return NextResponse.json(
      { error: toErrorMessage(error) || 'Failed to fetch employee data' },
      { status: 500 }
    );
  }
}
