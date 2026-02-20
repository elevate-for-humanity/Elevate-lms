import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const name = formData.get('name') as string;
    const email = formData.get('email') as string;
    const status = formData.get('status') as string;

    if (!name || !email) {
      return NextResponse.redirect(new URL('/community?error=missing-fields', request.url));
    }

    const supabase = await createClient();
    await supabase.from('community_members').insert({
      full_name: name,
      email,
      status: status || 'prospective',
    });

    return NextResponse.redirect(new URL('/community?success=joined', request.url));
  } catch {
    return NextResponse.redirect(new URL('/community?error=server-error', request.url));
  }
}
