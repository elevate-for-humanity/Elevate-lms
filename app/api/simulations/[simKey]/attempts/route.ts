import { NextRequest, NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/supabase/admin';
import { getCurrentUser } from '@/lib/auth';
import { logger } from '@/lib/logger';

// GET /api/simulations/[simKey]/attempts
// Returns the authenticated learner's attempt history for this sim.
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ simKey: string }> }
) {
  const { simKey } = await params;
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const db = await getAdminClient();

  const { data: sim } = await db
    .from('training_simulations')
    .select('id, title, passing_score, difficulty')
    .eq('sim_key', simKey)
    .eq('is_active', true)
    .single();

  if (!sim) return NextResponse.json({ error: 'Simulation not found' }, { status: 404 });

  const { data: attempts, error } = await db
    .from('sim_attempts')
    .select('id, started_at, completed_at, passed, score, correct_steps, total_steps, time_seconds')
    .eq('simulation_id', sim.id)
    .eq('learner_id', user.id)
    .order('started_at', { ascending: false });

  if (error) {
    logger.error('GET sim attempts error', error);
    return NextResponse.json({ error: 'Failed to load attempts' }, { status: 500 });
  }

  const bestScore = attempts?.reduce((best, a) => Math.max(best, a.score ?? 0), 0) ?? 0;
  const hasPassed = attempts?.some((a) => a.passed) ?? false;

  return NextResponse.json({
    sim,
    attempts: attempts ?? [],
    summary: {
      total_attempts: attempts?.length ?? 0,
      best_score: bestScore,
      has_passed: hasPassed,
    },
  });
}

// POST /api/simulations/[simKey]/attempts
// Starts a new attempt. Returns the attempt ID the client uses for step recording.
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ simKey: string }> }
) {
  const { simKey } = await params;
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const db = await getAdminClient();

  const { data: sim } = await db
    .from('training_simulations')
    .select('id, title, passing_score')
    .eq('sim_key', simKey)
    .eq('is_active', true)
    .single();

  if (!sim) return NextResponse.json({ error: 'Simulation not found' }, { status: 404 });

  const { data: attempt, error } = await db
    .from('sim_attempts')
    .insert({
      simulation_id: sim.id,
      learner_id:    user.id,
      steps_taken:   [],
    })
    .select('id, started_at')
    .single();

  if (error) {
    logger.error('POST sim attempt error', error);
    return NextResponse.json({ error: 'Failed to start attempt' }, { status: 500 });
  }

  logger.info('Sim attempt started', { simKey, userId: user.id, attemptId: attempt.id });
  return NextResponse.json({ attempt }, { status: 201 });
}
