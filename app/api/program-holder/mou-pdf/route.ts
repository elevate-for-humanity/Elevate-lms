import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@/lib/auth';
import { logger } from '@/lib/logger';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function _GET(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;

  try {
    const supabase = await createRouteHandlerClient({ cookies });
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Get the user's MOU signature
    const { data: signature, error: sigError } = await supabase
      .from('mou_signatures')
      .select('id, signer_name, signer_title, signed_at')
      .eq('user_id', user.id)
      .maybeSingle();

    if (sigError || !signature) {
      return NextResponse.json({ error: 'No signed MOU found' }, { status: 404 });
    }

    // Get the active MOU template
    const { data: template } = await supabase
      .from('mou_templates')
      .select('id, title, content, version')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    // Return MOU data for client-side PDF generation
    return NextResponse.json({
      success: true,
      mou: {
        signerName: signature.signer_name,
        signerTitle: signature.signer_title,
        signedAt: signature.signed_at,
        templateTitle: template?.title || 'Memorandum of Understanding',
        templateContent: template?.content || null,
        templateVersion: template?.version || '1.0',
      },
    });
  } catch (error) {
    logger.error('MOU PDF generation error', error as Error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
export const GET = withApiAudit('/api/program-holder/mou-pdf', _GET);
