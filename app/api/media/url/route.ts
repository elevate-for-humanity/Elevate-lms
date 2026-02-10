import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const maxDuration = 60;
import { toError, toErrorMessage } from '@/lib/safe';
import { apiAuthGuard } from '@/lib/authGuards';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
    const authResult = await apiAuthGuard({ requireAuth: true });
    if (!authResult.authorized) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  const path = new URL(req.url).searchParams.get('path');

  if (!path) {
    return Response.json({ error: 'No path provided' }, { status: 400 });
  }

  const supabase = await createClient();
  const { data, error }: any = await supabase.storage
    .from('media')
    .createSignedUrl(path, 3600);

  if (error) {
    return Response.json({ error: toErrorMessage(error) }, { status: 500 });
  }

  return Response.json(data);
}
