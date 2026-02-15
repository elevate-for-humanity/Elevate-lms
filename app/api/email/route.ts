import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;
import { parseBody } from '@/lib/api-helpers';
import { createClient } from '@/lib/supabase/server';
import { toErrorMessage } from '@/lib/safe';
import { applyRateLimit } from '@/lib/api/withRateLimit';

export async function GET(request: NextRequest) {
  
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;
const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const folder = request.nextUrl.searchParams.get('folder') || 'inbox';

  const { data: emails, error } = await supabase
    .from('emails')
    .select('*')
    .eq('user_id', user.id)
    .eq('folder', folder)
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: toErrorMessage(error) }, { status: 500 });
  }

  return NextResponse.json(emails);
}

export async function POST(request: NextRequest) {
    const rateLimited = await applyRateLimit(request, 'strict');
    if (rateLimited) return rateLimited;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await parseBody<Record<string, any>>(request);
  const { to, subject, body: emailBody, action } = body;

  if (action === 'send') {
    // Send email
    const { data, error }: any = await supabase
      .from('emails')
      .insert({
        user_id: user.id,
        to,
        from: user.email,
        subject,
        body: emailBody,
        folder: 'sent',
        read: true,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: toErrorMessage(error) }, { status: 500 });
    }

    return NextResponse.json(data);
  }

  if (action === 'star' || action === 'unstar') {
    const { id } = body;
    const { error } = await supabase
      .from('emails')
      .update({ starred: action === 'star' })
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      return NextResponse.json({ error: toErrorMessage(error) }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  }

  if (action === 'mark-read' || action === 'mark-unread') {
    const { id } = body;
    const { error } = await supabase
      .from('emails')
      .update({ read: action === 'mark-read' })
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      return NextResponse.json({ error: toErrorMessage(error) }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  }

  if (action === 'delete') {
    const { id } = body;
    const { error } = await supabase
      .from('emails')
      .update({ folder: 'trash' })
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      return NextResponse.json({ error: toErrorMessage(error) }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
}
