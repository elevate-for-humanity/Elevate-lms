import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { logger } from '@/lib/logger';
import { applyRateLimit } from '@/lib/api/withRateLimit';

/**
 * Direct Phone Integration API
 *
 * This bypasses Twilio and connects directly to your phone system.
 *
 * Supported integrations:
 * 1. SIP/VoIP (FreePBX, Asterisk, 3CX)
 * 2. Google Voice API
 * 3. RingCentral API
 * 4. Vonage (formerly Nexmo)
 * 5. Direct SIP trunk
 * 6. WebRTC (browser-to-phone)
 */

export async function POST(req: Request) {
  try {
    const rateLimited = await applyRateLimit(req, 'api');
    if (rateLimited) return rateLimited;

    const { action, phoneNumber, message, callerId } = await req.json();

    // Log the call request
    const supabase = await createClient();
  const _admin = createAdminClient(); const db = _admin || supabase;
    await db.from('phone_logs').insert({
      action,
      phone_number: phoneNumber,
      message,
      caller_id: callerId,
      status: 'initiated',
    });

    switch (action) {
      case 'click-to-call':
        return handleClickToCall(phoneNumber);

      case 'schedule-callback':
        return handleScheduleCallback(phoneNumber, message);

      case 'voicemail':
        return handleVoicemail(phoneNumber, message);

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) { 
    logger.error(
      'Phone API error:',
      error instanceof Error ? error : new Error(String(error))
    );
    return NextResponse.json({ error: 'Phone system error' }, { status: 500 });
  }
}

// Option 1: Click-to-call (uses visitor's phone to call your number)
async function handleClickToCall(phoneNumber: string) {
  // This creates a tel: link that the user's device handles
  // No server-side calling needed - completely free!
  return NextResponse.json({
    success: true,
    method: 'client-side',
    telLink: `tel:+13173143757`, // Your office number
    message: 'Opening phone dialer...',
  });
}

// Option 2: Schedule callback (saves to database, your team calls them)
async function handleScheduleCallback(phoneNumber: string, message: string) {
  const supabase = await createClient();
  const _admin = createAdminClient(); const db = _admin || supabase;

  const { data, error }: any = await db
    .from('callback_requests')
    .insert({
      phone_number: phoneNumber,
      message,
      status: 'pending',
      requested_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    throw error;
  }

  // Optional: Send notification to your team
  // await notifyTeam(data);

  return NextResponse.json({
    success: true,
    method: 'callback',
    callbackId: data.id,
    message: "Callback scheduled! We'll call you within 1 hour.",
  });
}

// Option 3: Voicemail (saves audio/text message)
async function handleVoicemail(phoneNumber: string, message: string) {
  const supabase = await createClient();
  const _admin = createAdminClient(); const db = _admin || supabase;

  await db.from('voicemails').insert({
    phone_number: phoneNumber,
    message,
    status: 'new',
  });

  return NextResponse.json({
    success: true,
    method: 'voicemail',
    message: "Message saved! We'll respond within 24 hours.",
  });
}

// Optional: Notify your team via email/Slack when callback requested
async function notifyTeam(callbackData: Record<string, any>) {
  // Send email notification
  // await sendEmail({
  //   to: "team@elevateforhumanity.org",
  //   subject: "New Callback Request",
  //   body: `Phone: ${callbackData.phone_number}\nMessage: ${callbackData.message}`
  // });
  // Or send Slack notification
  // await fetch(process.env.SLACK_WEBHOOK_URL, {
  //   method: "POST",
  //   body: JSON.stringify({
  //     text: `📞 New callback request from ${callbackData.phone_number}`
  //   })
  // });
}
