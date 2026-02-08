
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 10;

import { NextRequest, NextResponse } from 'next/server';
import { parseBody, getErrorMessage } from '@/lib/api-helpers';
import { createClient } from '@/lib/supabase/server';

// Simple in-memory rate limiting (per IP)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_WINDOW = 60000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 10; // Max 10 logs per minute per IP

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(ip);
  
  if (!record || now > record.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW });
    return true;
  }
  
  if (record.count >= MAX_REQUESTS_PER_WINDOW) {
    return false; // Rate limited
  }
  
  record.count++;
  return true;
}

export async function POST(request: NextRequest) {
  try {
    const ip = request.ip || request.headers.get('x-forwarded-for') || 'unknown';
    
    // Rate limit check
    if (!checkRateLimit(ip)) {
      return NextResponse.json({ success: true }, { status: 200 }); // Fail-open
    }
    
    const body = await parseBody<Record<string, any>>(request);
    
    // Validate required fields
    if (!body.type || !body.timestamp) {
      return NextResponse.json({ success: true }, { status: 200 }); // Fail-open
    }
    
    // Fast response - don't wait for DB
    const responsePromise = NextResponse.json({ success: true });
    
    // Background logging (fire-and-forget)
    Promise.resolve().then(async () => {
      try {
        const supabase = await createClient();
        await supabase.from('security_logs').insert({
          event_type: body.type,
          timestamp: body.timestamp,
          url: body.url,
          user_agent: body.userAgent,
          ip_address: ip,
          data: body.data,
          severity: getSeverity(body.type as string),
        });

        // Send alerts for critical events (non-blocking)
        if (isCriticalEvent(body.type as string)) {
          sendSecurityAlert(body).catch(() => {});
        }
      } catch (error) {
        // Silent fail - logging should never break the app
        console.error('[Security Log] Background error:', error);
      }
    });

    return responsePromise;
  } catch (error) { /* Error handled silently */ 
    // Fail-open - always return 200 so client doesn't retry
    console.error('[Security Log] Request error:', error);
    return NextResponse.json({ success: true }, { status: 200 });
  }
}

function getSeverity(eventType: string): string {
  const criticalEvents = [
    'AUTOMATION_DETECTED',
    'IFRAME_EMBEDDING_DETECTED',
    'DEVTOOLS_OPENED',
  ];
  const highEvents = ['RAPID_NAVIGATION', 'CONSOLE_ACCESS'];

  if (criticalEvents.includes(eventType)) return 'critical';
  if (highEvents.includes(eventType)) return 'high';
  return 'medium';
}

function isCriticalEvent(eventType: string): boolean {
  return ['AUTOMATION_DETECTED', 'IFRAME_EMBEDDING_DETECTED'].includes(
    eventType
  );
}

async function sendSecurityAlert(data: Record<string, any>) {
  // Send email/SMS/Slack notification for critical events
  console.warn('[CRITICAL SECURITY EVENT]', data);

  // Example: Send to admin email (disabled for now)
  // Uncomment when notification service is configured
  /*
  try {
    await fetch('/api/notifications/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'security_alert',
        subject: `Security Alert: ${data.type}`,
        message: `Critical security event detected:\n\nType: ${data.type}\nURL: ${data.url}\nTime: ${data.timestamp}\n\nData: ${JSON.stringify(data.data, null, 2)}`,
      }),
    });
  } catch (error) {
    console.error('[Security Alert] Failed to send:', error);
  }
  */
}
