import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@/lib/auth';
import { logger } from '@/lib/logger';
import { applyRateLimit } from '@/lib/api/withRateLimit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'strict');
  if (rateLimited) return rateLimited;

  try {
    const supabase = await createRouteHandlerClient({ cookies });
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile?.role || !['admin', 'super_admin', 'staff'].includes(profile.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { document_id } = await request.json();
    if (!document_id) {
      return NextResponse.json({ error: 'document_id required' }, { status: 400 });
    }

    const { data: doc, error: docError } = await supabase
      .from('documents')
      .select('id, document_type, file_url, status')
      .eq('id', document_id)
      .single();

    if (docError || !doc) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    if (doc.status === 'processed') {
      return NextResponse.json({ error: 'Document already processed' }, { status: 409 });
    }

    // Update status to processing
    await supabase
      .from('documents')
      .update({ status: 'processing' })
      .eq('id', document_id);

    // Mark as processed (actual OCR/extraction would be added per document type)
    const { error: updateError } = await supabase
      .from('documents')
      .update({
        status: 'processed',
        processed_at: new Date().toISOString(),
        processed_by: user.id,
      })
      .eq('id', document_id);

    if (updateError) {
      logger.error('Document processing update failed', updateError);
      return NextResponse.json({ error: 'Failed to process document' }, { status: 500 });
    }

    return NextResponse.json({ success: true, document_id, status: 'processed' });
  } catch (error) {
    logger.error('Document processing error', error as Error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
