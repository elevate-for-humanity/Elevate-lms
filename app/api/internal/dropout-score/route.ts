/**
 * POST /api/internal/dropout-score
 *
 * AI-powered dropout risk scoring cron — runs daily after at-risk-detection.
 * For each student in student_risk_status, calls aiChat to produce a 0-100
 * dropout probability score and a brief intervention recommendation, then
 * persists both back to student_risk_status.risk_score and risk_factors.
 *
 * Processes up to 50 students per run to stay within AI rate limits.
 * Gated by CRON_SECRET via withRuntime({ cron: true }).
 */

import { NextResponse } from 'next/server';
import { requireAdminClient } from '@/lib/supabase/admin';
import { aiChat } from '@/lib/ai/ai-service';
import { logger } from '@/lib/logger';
import { withRuntime } from '@/lib/api/withRuntime';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const BATCH_SIZE = 50;

export const POST = withRuntime({ cron: true }, async () => {
  const db = await requireAdminClient();

  // Load students that need scoring — prioritise those with no score or stale score (>24h)
  const staleCutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  const { data: rows, error } = await db
    .from('student_risk_status')
    .select('id, user_id, status, days_since_activity, overdue_count, progress_percentage, last_activity_date, risk_score, risk_factors, updated_at')
    .in('status', ['watch', 'at_risk', 'critical'])
    .or(`risk_score.is.null,updated_at.lt.${staleCutoff}`)
    .order('overdue_count', { ascending: false })
    .limit(BATCH_SIZE);

  if (error) {
    logger.error('[dropout-score] Failed to load student_risk_status', error);
    return NextResponse.json({ error: 'DB error' }, { status: 500 });
  }

  if (!rows?.length) {
    return NextResponse.json({ ok: true, scored: 0 });
  }

  // Enrich with profile data
  const userIds = [...new Set(rows.map((r) => r.user_id).filter(Boolean))];
  const { data: profiles } = userIds.length
    ? await db.from('profiles').select('id, full_name').in('id', userIds)
    : { data: [] };
  const profileMap = Object.fromEntries((profiles ?? []).map((p: any) => [p.id, p]));

  let scored = 0;
  let failed = 0;

  for (const row of rows) {
    const profile = profileMap[row.user_id];
    const name = profile?.full_name ?? 'Student';
    const daysInactive = row.days_since_activity ?? 0;
    const overdue = row.overdue_count ?? 0;
    const progress = Math.round(Number(row.progress_percentage ?? 0));
    const currentStatus = row.status ?? 'watch';

    const prompt = `You are an educational data analyst. Given the following student metrics, output a JSON object with two fields:
- "score": integer 0-100 representing dropout probability (0 = very likely to complete, 100 = very likely to drop out)
- "recommendation": one concise sentence (max 20 words) describing the most impactful intervention

Student metrics:
- Days since last activity: ${daysInactive}
- Overdue items: ${overdue}
- Course progress: ${progress}%
- Current risk status: ${currentStatus}

Respond with ONLY valid JSON, no markdown, no explanation. Example: {"score":72,"recommendation":"Schedule a 1:1 check-in call within 48 hours to address overdue assignments."}`;

    try {
      const aiResponse = await aiChat([{ role: 'user', content: prompt }], {
        maxTokens: 120,
        temperature: 0.1,
      });

      const text = typeof aiResponse === 'string' ? aiResponse : aiResponse?.content ?? '';

      // Parse JSON from AI response — strip any accidental markdown fences
      const jsonText = text.replace(/```json?\n?/g, '').replace(/```/g, '').trim();
      let parsed: { score?: number; recommendation?: string } = {};
      try {
        parsed = JSON.parse(jsonText);
      } catch {
        // Try extracting JSON object from response
        const match = jsonText.match(/\{[^}]+\}/);
        if (match) parsed = JSON.parse(match[0]);
      }

      const score = typeof parsed.score === 'number'
        ? Math.max(0, Math.min(100, Math.round(parsed.score)))
        : null;
      const recommendation = typeof parsed.recommendation === 'string'
        ? parsed.recommendation.slice(0, 200)
        : null;

      if (score !== null) {
        const existingFactors: Record<string, unknown> =
          typeof row.risk_factors === 'object' && row.risk_factors !== null
            ? (row.risk_factors as Record<string, unknown>)
            : {};

        // Derive probabilities from dropout score (0–100 → 0–1 scale)
        // completion_probability: inverse of dropout score
        // placement_probability: completion with an additional penalty for overdue items
        const completionProb = parseFloat((1 - score / 100).toFixed(4));
        const overduePenalty = Math.min(overdue * 0.02, 0.15); // max 15% penalty
        const placementProb = parseFloat(Math.max(0, completionProb - overduePenalty).toFixed(4));

        await db
          .from('student_risk_status')
          .update({
            risk_score: score,
            placement_probability: placementProb,
            completion_probability: completionProb,
            probabilities_updated_at: new Date().toISOString(),
            risk_factors: {
              ...existingFactors,
              ai_dropout_score: score,
              ai_recommendation: recommendation,
              ai_scored_at: new Date().toISOString(),
            },
            updated_at: new Date().toISOString(),
          })
          .eq('id', row.id);

        scored++;
      }
    } catch (err) {
      logger.warn('[dropout-score] AI scoring failed for student', {
        user_id: row.user_id,
        error: err instanceof Error ? err.message : String(err),
      });
      failed++;
    }
  }

  logger.info('[dropout-score] Run complete', { scored, failed, total: rows.length });
  return NextResponse.json({ ok: true, scored, failed, total: rows.length });
});
