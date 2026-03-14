import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createAdminClient } from '@/lib/supabase/admin';
import { getCurrentUser } from '@/lib/auth';
import { logger } from '@/lib/logger';

type Params = { params: Promise<{ simKey: string; attemptId: string }> };

// ── Schemas ────────────────────────────────────────────────────────────────

// A single recorded step: which step the learner was on, which choice they made.
const StepRecordSchema = z.object({
  step_id:      z.string().min(1),
  choice_label: z.string().min(1),
  correct:      z.boolean(),
  ts:           z.string().datetime().optional(), // ISO timestamp from client
});

// PATCH body — two modes:
//   { action: 'record_step', step: {...} }  — append a step during play
//   { action: 'complete' }                  — finalize the attempt
const PatchSchema = z.discriminatedUnion('action', [
  z.object({
    action: z.literal('record_step'),
    step:   StepRecordSchema,
  }),
  z.object({
    action:       z.literal('complete'),
    time_seconds: z.number().int().min(0).optional(),
  }),
]);

// ── Helpers ────────────────────────────────────────────────────────────────

async function loadAttempt(db: any, attemptId: string, learnerId: string) {
  const { data, error } = await db
    .from('sim_attempts')
    .select(`
      id, simulation_id, learner_id, started_at, completed_at,
      passed, score, steps_taken, correct_steps, total_steps, time_seconds,
      simulation:training_simulations(id, sim_key, passing_score)
    `)
    .eq('id', attemptId)
    .eq('learner_id', learnerId)
    .single();

  if (error || !data) return null;
  return data;
}

// ── GET ────────────────────────────────────────────────────────────────────

// GET /api/simulations/[simKey]/attempts/[attemptId]
// Returns current attempt state (used to resume an in-progress attempt).
export async function GET(_req: NextRequest, { params }: Params) {
  const { attemptId } = await params;
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const db = createAdminClient();
  const attempt = await loadAttempt(db, attemptId, user.id);
  if (!attempt) return NextResponse.json({ error: 'Attempt not found' }, { status: 404 });

  return NextResponse.json({ attempt });
}

// ── PATCH ──────────────────────────────────────────────────────────────────

// PATCH /api/simulations/[simKey]/attempts/[attemptId]
// Two actions:
//   record_step — append one step to steps_taken, increment counters
//   complete    — finalize: compute score, set passed, set completed_at
export async function PATCH(req: NextRequest, { params }: Params) {
  const { simKey, attemptId } = await params;
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = PatchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });
  }

  const db = createAdminClient();
  const attempt = await loadAttempt(db, attemptId, user.id);
  if (!attempt) return NextResponse.json({ error: 'Attempt not found' }, { status: 404 });

  if (attempt.completed_at) {
    return NextResponse.json({ error: 'Attempt already completed' }, { status: 409 });
  }

  // ── record_step ──────────────────────────────────────────────────────────
  if (parsed.data.action === 'record_step') {
    const step = parsed.data.step;
    const stepEntry = {
      step_id:      step.step_id,
      choice_label: step.choice_label,
      correct:      step.correct,
      ts:           step.ts ?? new Date().toISOString(),
    };

    const updatedSteps   = [...(attempt.steps_taken ?? []), stepEntry];
    const correctSteps   = attempt.correct_steps + (step.correct ? 1 : 0);
    const totalSteps     = attempt.total_steps + 1;

    const { data: updated, error } = await db
      .from('sim_attempts')
      .update({
        steps_taken:   updatedSteps,
        correct_steps: correctSteps,
        total_steps:   totalSteps,
      })
      .eq('id', attemptId)
      .select('id, correct_steps, total_steps, steps_taken')
      .single();

    if (error) {
      logger.error('record_step error', error);
      return NextResponse.json({ error: 'Failed to record step' }, { status: 500 });
    }

    return NextResponse.json({ attempt: updated });
  }

  // ── complete ─────────────────────────────────────────────────────────────
  if (parsed.data.action === 'complete') {
    const total   = attempt.total_steps;
    const correct = attempt.correct_steps;

    // Score = percentage of correct choices. Guard against zero-step attempts.
    const score  = total > 0 ? Math.round((correct / total) * 100) : 0;
    const passed = score >= (attempt.simulation?.passing_score ?? 70);

    const { data: completed, error } = await db
      .from('sim_attempts')
      .update({
        completed_at: new Date().toISOString(),
        score,
        passed,
        time_seconds: parsed.data.time_seconds ?? null,
      })
      .eq('id', attemptId)
      .select('id, score, passed, completed_at, correct_steps, total_steps, time_seconds')
      .single();

    if (error) {
      logger.error('complete attempt error', error);
      return NextResponse.json({ error: 'Failed to complete attempt' }, { status: 500 });
    }

    logger.info('Sim attempt completed', {
      simKey,
      userId:    user.id,
      attemptId,
      score,
      passed,
    });

    return NextResponse.json({ attempt: completed });
  }
}
