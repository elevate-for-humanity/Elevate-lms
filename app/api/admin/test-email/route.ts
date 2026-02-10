
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { Resend } from 'resend';

function getResend() {
  const key = process.env.RESEND_API_KEY;
  if (!key) throw new Error('RESEND_API_KEY not configured');
  return new Resend(key);
}

export async function POST(req: NextRequest) {
  // Block in production — this endpoint is for development/testing only
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  try {
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check admin role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, email')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'admin' && profile?.role !== 'super_admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { email_type } = await req.json();

    let result;

    switch (email_type) {
      case 'welcome':
        result = await getResend().emails.send({
          from: process.env.EMAIL_FROM || 'noreply@www.elevateforhumanity.org',
          to: profile.email,
          subject: 'Test: Welcome Email - Elevate for Humanity',
          text: `
Hello!

This is a test welcome email from Elevate for Humanity.

If you're receiving this, the email system is working correctly!

— Elevate for Humanity Team
          `,
        });
        break;

      case 'reminder':
        result = await getResend().emails.send({
          from: process.env.EMAIL_FROM || 'noreply@www.elevateforhumanity.org',
          to: profile.email,
          subject: 'Test: Reminder Email - Elevate for Humanity',
          text: `
Hello!

This is a test reminder email.

Action Required:
• Complete your profile
• Upload required documents
• Review your dashboard

— Elevate for Humanity Team
          `,
        });
        break;

      case 'notification':
        result = await getResend().emails.send({
          from: process.env.EMAIL_FROM || 'noreply@www.elevateforhumanity.org',
          to: profile.email,
          subject: 'Test: Notification Email - Elevate for Humanity',
          text: `
Hello!

This is a test notification email.

Recent Activity:
• New student enrolled
• Hours submitted for approval
• Document uploaded

— Elevate for Humanity Team
          `,
        });
        break;

      default:
        return NextResponse.json(
          { error: 'Invalid email type' },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      message: `Test ${email_type} email sent successfully`,
      email_id: result.data?.id,
      sent_to: profile.email,
    });
  } catch (err: any) {
    // Error: $1
    return NextResponse.json(
      { error: (err as Error).message || 'Failed to send test email' },
      { status: 500 }
    );
  }
}
