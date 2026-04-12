// Batch file upload for the Content Library admin UI.
// Accepts multipart/form-data with one or more files under the 'files' field.
// Stores each file in the `media` bucket and creates a content_items row.
// Requires admin, super_admin, or staff role.
import { logger } from '@/lib/logger';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';

export const runtime = 'nodejs';

async function _POST(request: NextRequest) {
  try {
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || !['admin', 'super_admin', 'staff'].includes(profile.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const formData = await request.formData();
    const files = formData.getAll('files') as File[];

    if (!files.length) {
      return NextResponse.json({ error: 'No files provided' }, { status: 400 });
    }

    const uploaded: { id: string; title: string; file_url: string }[] = [];

    for (const file of files) {
      if (!(file instanceof File) || file.size === 0) continue;

      const fileExt = file.name.split('.').pop();
      const filePath = `content-library/${user.id}/${Date.now()}-${file.name}`;

      const { error: uploadError } = await supabase.storage
        .from('media')
        .upload(filePath, file, { cacheControl: '3600', upsert: false });

      if (uploadError) {
        logger.error('Content library upload error:', { file: file.name, error: uploadError });
        continue;
      }

      const { data: urlData } = supabase.storage.from('media').getPublicUrl(filePath);

      // Infer content_type from mime type
      const contentType = file.type.startsWith('video/')
        ? 'video'
        : file.type.startsWith('image/')
        ? 'image'
        : file.type === 'application/pdf'
        ? 'document'
        : 'file';

      const { data: item, error: dbError } = await supabase
        .from('content_items')
        .insert({
          title: file.name.replace(/\.[^.]+$/, ''),
          content_type: contentType,
          file_url: urlData.publicUrl,
          created_by: user.id,
          is_active: true,
          tags: [],
        })
        .select('id, title, file_url')
        .single();

      if (dbError) {
        logger.error('Content item insert error:', dbError);
        continue;
      }

      if (item) uploaded.push(item);
    }

    return NextResponse.json({ uploaded });
  } catch (err) {
    logger.error('Content library upload handler error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export const POST = withApiAudit('/api/content-library/upload', _POST);
