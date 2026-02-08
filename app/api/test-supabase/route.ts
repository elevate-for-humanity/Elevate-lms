
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { protectTestEndpoint } from '@/lib/api/protect-test-endpoint';

export const GET = protectTestEndpoint(async () => {
  try {
    // Check environment variables
    const hasUrl = !!process.env.NEXT_PUBLIC_SUPABASE_URL;
    const hasServiceKey = !!process.env.SUPABASE_SERVICE_ROLE_KEY;
    const hasAnonKey = !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    const urlPrefix = process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 30);

    // Try to create admin client
    let clientCreated = false;
    let clientError = null;
    try {
      const supabase = createAdminClient();
      clientCreated = true;

      // Try a simple query
      const { data, error }: any = await supabase
        .from('applications')
        .select('count')
        .limit(1);

      return NextResponse.json({
        status: 'success',
        environment: {
          hasUrl,
          hasServiceKey,
          hasAnonKey,
          urlPrefix,
        },
        client: {
          created: clientCreated,
        },
        database: {
          querySuccess: !error,
          error: error
            ? {
                code: (error as any)?.code || "UNKNOWN",
                message: error instanceof Error ? error.message : String(error),
                details: error.details,
                hint: error.hint,
              }
            : null,
        },
      });
    } catch (error) { /* Error handled silently */ 
      clientError = error instanceof Error ? error.message : String(error);
      return NextResponse.json({
        status: 'error',
        environment: {
          hasUrl,
          hasServiceKey,
          hasAnonKey,
          urlPrefix,
        },
        client: {
          created: false,
          error: clientError,
        },
      });
    }
  } catch (error) { /* Error handled silently */ 
    return NextResponse.json({
      status: 'error',
      message: error instanceof Error ? error.message : String(error),
    });
  }
});
