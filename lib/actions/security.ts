'use server';

import { logger } from '@/lib/logger';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/server';
import { headers } from 'next/headers';

interface SecurityEvent {
  type: string;
  timestamp: string;
  url: string;
  userAgent: string;
  data: Record<string, unknown>;
}

import { getSeverity, CRITICAL_EVENTS } from '@/lib/security-utils';

export async function logSecurityEventAction(event: SecurityEvent): Promise<void> {
  try {
    if (!isSupabaseConfigured()) {
      return;
    }

    const headersList = await headers();
    const ip =
      headersList.get('x-forwarded-for')?.split(',')[0]?.trim() ??
      headersList.get('x-real-ip') ??
      'unknown';

    const supabase = await createClient();
    await supabase.from('audit_logs').insert({
      action: event.type,
      event_type: 'security',
      ip_address: ip,
      user_agent: event.userAgent,
      details: {
        url: event.url,
        timestamp: event.timestamp,
        data: event.data,
        severity: getSeverity(event.type),
      },
    });

    if (CRITICAL_EVENTS.has(event.type)) {
      logger.warn('[CRITICAL SECURITY EVENT]', { type: event.type, url: event.url, ip });
    }
  } catch (err) {
    // Silent fail — security logging must never break the app
    logger.error('[Security Action] Failed to log event:', err);
  }
}
