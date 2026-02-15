import { logger } from '@/lib/logger';
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { applyRateLimit } from '@/lib/api/withRateLimit';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || !['admin', 'super_admin'].includes(profile.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // List storage buckets
    const { data: buckets, error } = await supabase.storage.listBuckets();

    if (error) {
      logger.error('Buckets error:', error);
      // Return default buckets for demo
      return NextResponse.json({
        buckets: [
          { id: 'documents', name: 'documents', public: false },
          { id: 'avatars', name: 'avatars', public: true },
          { id: 'course-content', name: 'course-content', public: false },
          { id: 'certificates', name: 'certificates', public: false },
        ],
      });
    }

    return NextResponse.json({ buckets: buckets || [] });
  } catch (error) {
    logger.error('Buckets error:', error);
    return NextResponse.json({
      buckets: [
        { id: 'documents', name: 'documents', public: false },
        { id: 'avatars', name: 'avatars', public: true },
      ],
    });
  }
}
