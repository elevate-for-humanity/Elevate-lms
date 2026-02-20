import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.redirect(new URL('/login', request.url));
    }

    const formData = await request.formData();
    const preferences: Record<string, boolean> = {};

    for (const [key, value] of formData.entries()) {
      if (key.startsWith('notify_')) {
        preferences[key] = value === 'on' || value === 'true';
      }
    }

    await supabase
      .from('notification_preferences')
      .upsert({
        user_id: user.id,
        preferences,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' });

    return NextResponse.redirect(new URL('/account/settings/notifications?success=saved', request.url));
  } catch {
    return NextResponse.redirect(new URL('/account/settings/notifications?error=server-error', request.url));
  }
}
