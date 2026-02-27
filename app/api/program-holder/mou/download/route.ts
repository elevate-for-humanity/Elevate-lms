import { cookies } from 'next/headers';
import { createAdminClient } from '@/lib/supabase/admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;
import { createRouteHandlerClient } from '@/lib/auth';
import { logger } from '@/lib/logger';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';

async function _GET(request: Request) {
  
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;
const supabase = await createRouteHandlerClient({ cookies });
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return new Response('Unauthorized', { status: 401 });
  }

  // Get user's program holder ID
  const { data: prof } = await supabase
    .from('user_profiles')
    .select('program_holder_id')
    .eq('user_id', user.id)
    .single();

  if (!prof?.program_holder_id) {
    return new Response('No program holder assigned', { status: 404 });
  }

  // Get program holder's final PDF URL
  const { data: ph } = await supabase
    .from('program_holders')
    .select('mou_final_pdf_url, name')
    .eq('id', prof.program_holder_id)
    .single();

  if (!ph?.mou_final_pdf_url) {
    return new Response('No signed MOU available', { status: 404 });
  }

  // Download from storage
  const { data, error }: any = await supabase.storage
    .from('agreements')
    .download(ph.mou_final_pdf_url);

  if (error || !data) {
    logger.error('Download error:', error);
    return new Response('File not found', { status: 404 });
  }

  const filename = `${ph.name.replace(/[^a-zA-Z0-9]/g, '_')}_MOU_Signed.pdf`;

  // Return PDF
  return new Response(data, {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  });
}
export const GET = withApiAudit('/api/program-holder/mou/download', _GET);
