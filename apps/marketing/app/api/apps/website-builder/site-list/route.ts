import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getWebsiteBuilderAccess } from '@/lib/apps/website-builder-access';
export const dynamic = 'force-dynamic';
export async function GET() {
  const db = await createClient();
  const { data: { user } } = await db.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  const access = await getWebsiteBuilderAccess(user.id, db);
  if (!access.allowed) return NextResponse.json({ error: 'Website Builder access required' }, { status: 403 });
  const { data, error } = await db.from('user_websites')
    .select('id,site_name').eq('user_id',user.id).order('updated_at',{ascending:false}).limit(50);
  if (error) return NextResponse.json({ error: 'Could not load websites' }, { status: 503 });
  return NextResponse.json({ websites: data || [] }, { headers: { 'Cache-Control': 'no-store' } });
}
