import { requireAdmin } from '@/lib/auth';
import { cookies } from 'next/headers';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;
import { createRouteHandlerClient } from '@/lib/auth';
import { withAuth } from '@/lib/with-auth';
import { logger } from '@/lib/logger';
import { withApiAudit } from '@/lib/audit/withApiAudit';

const _GET = withAuth(
  async (req, context) => {
    const { user } = context;
    const supabase = await createRouteHandlerClient({ cookies });
      const { searchParams } = new URL(req.url);
    const filename = searchParams.get('filename');

    if (!filename) {
      return new Response('Filename required', { status: 400 });
    }

    // Download from storage
    const { data, error }: any = await supabase.storage
      .from('mous')
      .download(filename);

    if (error || !data) {
      logger.error('Download error:', error);
      return new Response('File not found', { status: 404 });
    }

    // Return PDF
    return new Response(data, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });

    },
    { roles: ['admin', 'super_admin'] }
);
export const GET = withApiAudit('/api/admin/program-holders/signed-mou', _GET);
