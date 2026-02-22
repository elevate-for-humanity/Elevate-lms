import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const name = formData.get('name') as string;
    const email = formData.get('email') as string;
    const message = formData.get('message') as string;

    if (!name || !email) {
      return NextResponse.redirect(new URL('/community?error=missing-fields', request.url));
    }

    const supabase = await createClient();
  const _admin = createAdminClient(); const db = _admin || supabase;
    await db.from('inquiries').insert({
      name,
      email,
      message: message || '',
      source: 'community-page',
    });

    return NextResponse.redirect(new URL('/community?success=sent', request.url));
  } catch {
    return NextResponse.redirect(new URL('/community?error=server-error', request.url));
  }
}
