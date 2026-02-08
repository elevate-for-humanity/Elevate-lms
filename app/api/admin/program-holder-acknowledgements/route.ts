import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;
import { createClient } from '@/lib/supabase/server';
import { withAuth } from '@/lib/with-auth';
import { logger } from '@/lib/logger';

export const GET = withAuth(
  async (req, context) => {
    const user = context.user;
    try {
      const supabase = await createClient();

      // Note: Add authentication check here
      // const { data: { user } } = await supabase.auth.getUser();
      // if (!user || user.role !== 'admin') {
      //   return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      // }

      const { data, error }: any = await supabase
        .from('program_holder_acknowledgements')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        logger.error('Supabase query error:', error);
        return NextResponse.json(
          { error: 'Failed to fetch acknowledgements' },
          { status: 500 }
        );
      }

      return NextResponse.json({ acknowledgements: data || [] });
    } catch (err: any) {
      logger.error(
        'API error:',
        err instanceof Error ? err : new Error(String(err))
      );
      return NextResponse.json({ error: 'Unexpected error' }, { status: 500 });
    }
  },
  { roles: ['admin', 'super_admin'] }
);
