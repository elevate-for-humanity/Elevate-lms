import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { withApiAudit } from '@/lib/audit/withApiAudit';

async function _GET() {
  try {
    const supabase = await createClient();
      const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { data: files } = await db.storage.from('media').list('', {
      limit: 100,
      sortBy: { column: 'created_at', order: 'desc' },
    });

    return NextResponse.json({ files: files || [] });
  } catch {
    return NextResponse.json({ files: [] });
  }
}
export const GET = withApiAudit('/api/media/files', _GET);
