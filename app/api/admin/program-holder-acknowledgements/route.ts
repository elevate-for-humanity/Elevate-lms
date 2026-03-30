import { NextResponse } from 'next/server';

import { createClient } from '@/lib/supabase/server';
import { withAuth } from '@/lib/with-auth';
import { logger } from '@/lib/logger';
import { withApiAudit } from '@/lib/audit/withApiAudit';
export const runtime = 'nodejs';
export const maxDuration = 60;

export const dynamic = 'force-dynamic';

const _GET = withAuth(
  async (req, context) => {
    const user = context.user;
    try {
      const supabase = await createClient();

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
export const GET = withApiAudit('/api/admin/program-holder-acknowledgements', _GET);
