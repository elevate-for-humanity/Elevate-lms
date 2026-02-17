/**
 * Programs API - List All Programs
 * Example route showing Supabase integration with error handling
 */

import { NextRequest, NextResponse } from 'next/server';
import { withErrorHandling, APIErrors } from '@/lib/api';
import { createClient } from '@/lib/supabase/server';

export const GET = withErrorHandling(async (request: NextRequest) => {
  const supabase = await createClient();

  // Optional: Check authentication
  const { data: { user } } = await supabase.auth.getUser();
  
  // Query programs table
  const { data: programs, error } = await supabase
    .from('programs')
    .select('*')
    .order('id', { ascending: true });

  if (error) {
    throw APIErrors.database('Failed to fetch programs');
  }

  return NextResponse.json({
    success: true,
    programs: programs || [],
    count: programs?.length || 0,
    authenticated: !!user,
  });
});

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;
