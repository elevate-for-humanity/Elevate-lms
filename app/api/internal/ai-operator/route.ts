/**
 * POST /api/internal/ai-operator
 *
 * AI triage of unresolved platform events. Runs every 5 minutes alongside
 * the workflow processors.
 *
 * For each batch of unresolved warning/error/critical events, calls aiChat
 * to produce a triage summary and recommended action, then:
 *   1. Writes the recommendation to admin_alerts (type: ai_operator_triage)
 *   2. Marks the platform_events rows as resolved
 *   3. Emits a single ai.operator_triage event summarising the batch
 *
 * Processes up to 20 events per run to stay within AI token limits.
 * Gated by CRON_SECRET via withRuntime({ cron: true }).
 */

import { NextResponse } from 'next/server';
import { requireAdminClient } from '@/lib/supabase/admin';
import { aiChat } from '@/lib/ai/ai-service';
import { emitEvent } from '@/lib/platform/events';
import { logger } from '@/lib/logger';
import { withRuntime } from '@/lib/api/withRuntime';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const BATCH_SIZE = 20;

// Only triage events that are at least 2 minutes old (avoid racing with the emitter)
const MIN_AGE_MINUTES = 2;

export const POST = withRuntime({ cron: true }, async () => {
  const db = await requireAdminClient();

  const ageCutoff = new Date(Date.now() - MIN_AGE_MINUTES * 60 * 1000).toISOString();

  const { data: events, error } = await db
    .from('platform_events')
    .select('id, event_type, category, severity, subject_id, subject_type, message, payload, created_at')
    .in('severity', ['warning', 'error', 'critical'])
    .eq('resolved', false)
    .lt('created_at', ageCutoff)
    .order('severity', { ascending: false }) // critical first
    .order('created_at', { ascending: true })
    .limit(BATCH_SIZE);

  if (error) {
    logger.error('[ai-operator] Failed to load platform_events', error);
    return NextResponse.json({ error: 'DB error' }, { status: 500 });
  }

  if (!events?.length) {
    return NextResponse.json({ ok: true, triaged: 0 });
  }

  // Build a compact event summary for the AI prompt
  const eventSummary = events
    .map((e, i) =>
      `${i + 1}. [${e.severity.toUpperCase()}] ${e.event_type} (${e.category}) — ${e.message ?? 'no message'} | subject: ${e.subject_type ?? 'unknown'}/${e.subject_id ?? 'unknown'}`,
    )
    .join('\n');

  const prompt = `You are an AI operations assistant for an LMS platform. Review these unresolved platform events and provide a triage response.

Events:
${eventSummary}

Respond with a JSON object:
{
  "summary": "2-3 sentence plain-English summary of what is happening",
  "priority": "low|medium|high|critical",
  "recommended_action": "One specific, actionable step the operations team should take first",
  "auto_resolvable": true or false (true only if these are informational and need no human action)
}

Respond with ONLY valid JSON, no markdown.`;

  let triaged = 0;
  let autoResolved = 0;

  try {
    const aiResponse = await aiChat([{ role: 'user', content: prompt }], {
      maxTokens: 300,
      temperature: 0.2,
    });

    const text = typeof aiResponse === 'string' ? aiResponse : (aiResponse as any)?.content ?? '';
    const jsonText = text.replace(/```json?\n?/g, '').replace(/```/g, '').trim();

    let parsed: {
      summary?: string;
      priority?: string;
      recommended_action?: string;
      auto_resolvable?: boolean;
    } = {};

    try {
      parsed = JSON.parse(jsonText);
    } catch {
      const match = jsonText.match(/\{[\s\S]+\}/);
      if (match) parsed = JSON.parse(match[0]);
    }

    const summary = parsed.summary ?? 'AI triage completed.';
    const priority = parsed.priority ?? 'medium';
    const recommendation = parsed.recommended_action ?? 'Review events in admin dashboard.';
    const autoResolvable = parsed.auto_resolvable === true;

    // Write admin alert with AI recommendation
    await db.from('admin_alerts').insert({
      alert_type: 'ai_operator_triage',
      severity: priority === 'critical' ? 'critical' : priority === 'high' ? 'high' : 'warning',
      message: summary,
      details: {
        recommended_action: recommendation,
        event_count: events.length,
        event_ids: events.map((e) => e.id),
        auto_resolvable: autoResolvable,
        triaged_at: new Date().toISOString(),
      },
      metadata: {
        source: 'ai_operator',
        priority,
        event_types: [...new Set(events.map((e) => e.event_type))],
      },
    }).catch((err: unknown) => {
      logger.warn('[ai-operator] Failed to write admin_alert', err);
    });

    // Mark events resolved if AI says they're auto-resolvable
    if (autoResolvable) {
      const ids = events.map((e) => e.id);
      await db
        .from('platform_events')
        .update({ resolved: true })
        .in('id', ids)
        .catch(() => {});
      autoResolved = ids.length;
    }

    triaged = events.length;

    // Emit summary event
    await emitEvent('ai.operator_triage', 'ai', {
      severity: priority === 'critical' ? 'error' : priority === 'high' ? 'warning' : 'info',
      actor_type: 'ai',
      payload: {
        event_count: events.length,
        auto_resolved: autoResolved,
        priority,
        summary,
        recommendation,
      },
      message: `AI operator triaged ${events.length} event${events.length !== 1 ? 's' : ''}: ${summary.slice(0, 100)}`,
    }).catch(() => {});
  } catch (err) {
    logger.error('[ai-operator] AI triage failed', err instanceof Error ? err.message : String(err));
    return NextResponse.json({ error: 'AI triage failed' }, { status: 500 });
  }

  logger.info('[ai-operator] Run complete', { triaged, autoResolved });
  return NextResponse.json({ ok: true, triaged, autoResolved });
});
