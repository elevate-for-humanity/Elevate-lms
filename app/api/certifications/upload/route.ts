// Upload a certification document (PDF, image) for a learner's certification record.
// Called by CertificationTracker when a learner uploads proof of an external cert.
// Stores the file in the `documents` bucket and updates the certifications row.
import { logger } from '@/lib/logger';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';

export const runtime = 'nodejs';

async function _POST(request: NextRequest) {
  try {
    const rateLimited = await applyRateLimit(request, 'contact');
    if (rateLimited) return rateLimited;

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const certificationId = formData.get('certificationId') as string | null;

    if (!file || !certificationId) {
      return NextResponse.json({ error: 'file and certificationId are required' }, { status: 400 });
    }

    // Verify the certification belongs to this user
    const { data: cert } = await supabase
      .from('certifications')
      .select('id, user_id')
      .eq('id', certificationId)
      .eq('user_id', user.id)
      .maybeSingle();

    if (!cert) {
      return NextResponse.json({ error: 'Certification not found' }, { status: 404 });
    }

    const fileExt = file.name.split('.').pop();
    const filePath = `${user.id}/certifications/${certificationId}-${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('documents')
      .upload(filePath, file, { cacheControl: '3600', upsert: false });

    if (uploadError) {
      logger.error('Certification upload error:', uploadError);
      return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
    }

    const { data: urlData } = supabase.storage.from('documents').getPublicUrl(filePath);

    const { error: updateError } = await supabase
      .from('certifications')
      .update({
        document_url: urlData.publicUrl,
        status: 'pending_review',
        updated_at: new Date().toISOString(),
      })
      .eq('id', certificationId)
      .eq('user_id', user.id);

    if (updateError) {
      logger.error('Certification record update error:', updateError);
      return NextResponse.json({ error: 'Failed to update certification record' }, { status: 500 });
    }

    return NextResponse.json({ success: true, url: urlData.publicUrl });
  } catch (err) {
    logger.error('Certification upload handler error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export const POST = withApiAudit('/api/certifications/upload', _POST);
