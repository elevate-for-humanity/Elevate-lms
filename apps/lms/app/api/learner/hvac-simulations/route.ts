import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAuth } from '@/lib/auth/requireAuth';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { assertLessonAccess, accessErrorResponse } from '@/lib/lms/access-control';
import { createClient } from '@/lib/supabase/server';
import { requireAdminClient } from '@/lib/supabase/admin';
import { HVAC_PRACTICAL_COURSE_ID } from '@/lib/lms/hvac-practical-plan';
import {
  getHvacSimulationDefinition,
  replayHvacSimulation,
  applyHvacSimulationAction,
  buildHvacSimulationView,
} from '@/lib/lms/hvac-course-simulations';
import type {
  HvacSimulationAction,
  HvacSimulationResponse,
  HvacSimulationView,
} from '@/lib/lms/hvac-simulation-types';
import { logger } from '@/lib/logger';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MAX_SAVED_EVENTS = 10000;
const ActionSchema = z.discriminatedUnion('type', [
  z
    .object({
      type: z.literal('set-control'),
      controlId: z.string().min(1).max(100),
      value: z.union([z.string().max(100), z.number().finite()]),
    })
    .strict(),
  z.object({ type: z.literal('observe') }).strict(),
  z
    .object({
      type: z.literal('choose'),
      stageId: z.string().min(1).max(100),
      optionId: z.string().min(1).max(100),
    })
    .strict(),
  z.object({ type: z.literal('reset') }).strict(),
]);
const IdentitySchema = z
  .object({ courseId: z.string().uuid(), lessonId: z.string().uuid() })
  .strict();
const RequestSchema = IdentitySchema.extend({
  simulationId: z.string().min(1).max(240),
  expectedRevision: z.number().int().min(0).max(MAX_SAVED_EVENTS),
  requestId: z.string().uuid(),
  action: ActionSchema,
}).strict();
const EventSchema = z
  .object({
    requestId: z.string().uuid(),
    expectedRevision: z.number().int().min(0),
    action: ActionSchema,
  })
  .strict();
const HistorySchema = z
  .object({
    schemaVersion: z.literal(1),
    simulationId: z.string(),
    contentVersion: z.string(),
    revision: z.number().int().min(1).max(MAX_SAVED_EVENTS),
    events: z.array(EventSchema).min(1).max(MAX_SAVED_EVENTS),
  })
  .strict();
const ProgressRowSchema = z.object({
  id: z.string().uuid(),
  answers: z.unknown(),
  updated_at: z.string(),
  completed_at: z.string().nullable(),
});

type Definition = NonNullable<ReturnType<typeof getHvacSimulationDefinition>>;
type Database = Awaited<ReturnType<typeof createClient>>;
type SavedHistory = z.infer<typeof HistorySchema>;
type ProgressRow = z.infer<typeof ProgressRowSchema>;
type SimulatorRequest = z.infer<typeof RequestSchema>;
type SimulatorContext = {
  db: Database;
  userId: string;
  courseId: string;
  lessonId: string;
  lessonSlug: string;
  definition: Definition;
};

function engineAction(
  action: Exclude<z.infer<typeof ActionSchema>, { type: 'reset' }>,
): HvacSimulationAction {
  if (action.type === 'set-control') {
    // With this repository's strictNullChecks=false, Zod's union field type
    // admits an optional value. Narrow it explicitly at the engine boundary.
    if (typeof action.value !== 'string' && typeof action.value !== 'number') {
      throw new Error('A simulation control value is required');
    }
    return { type: action.type, controlId: action.controlId, value: action.value };
  }
  return action;
}

class SimulatorError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
  ) {
    super(message);
  }
}

function privateJson(body: unknown, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: {
      'Cache-Control': 'private, no-store',
      'Referrer-Policy': 'no-referrer',
      Vary: 'Cookie',
    },
  });
}

function failure(error: unknown) {
  if (error instanceof SimulatorError)
    return privateJson({ error: error.message, code: error.code }, error.status);
  logger.error(
    'HVAC simulation persistence failed',
    error instanceof Error ? error : new Error('Database operation failed'),
  );
  return privateJson(
    {
      error:
        'Simulator progress could not be confirmed. Retry the same action to check its save status.',
      code: 'PERSISTENCE_ERROR',
    },
    500,
  );
}

async function authenticate(request: NextRequest) {
  const { user, error } = await requireAuth(request);
  if (error || !user)
    throw new SimulatorError(401, 'UNAUTHORIZED', 'Sign in to use your course simulations.');
  const limited = await applyRateLimit(request, 'api', { key: `hvac-simulations:${user.id}` });
  if (limited) {
    limited.headers.set('Cache-Control', 'private, no-store');
    limited.headers.set('Referrer-Policy', 'no-referrer');
    return limited;
  }
  return user.id;
}

async function authorizedContext(
  userId: string,
  identity: z.infer<typeof IdentitySchema>,
): Promise<SimulatorContext> {
  if (identity.courseId !== HVAC_PRACTICAL_COURSE_ID)
    throw new SimulatorError(
      404,
      'COURSE_NOT_FOUND',
      'This course does not have this HVAC simulation.',
    );
  try {
    await assertLessonAccess(userId, identity.lessonId);
  } catch (error) {
    const denied = accessErrorResponse(error);
    throw new SimulatorError(denied.status, 'LESSON_ACCESS_DENIED', denied.body.error);
  }
  const db = await createClient();
  // This authenticated, SECURITY INVOKER RPC preserves the existing restrictive
  // MFA policy before any service-role write. It also fails closed until the
  // namespace-protection migration has been installed.
  const session = await db.rpc('hvac_simulation_session_ready');
  if (session.error)
    throw new SimulatorError(
      503,
      'SIMULATION_STORAGE_NOT_READY',
      'Simulation saving is not available yet. Please contact your instructor.',
    );
  if (session.data !== true)
    throw new SimulatorError(
      403,
      'SESSION_RESTRICTED',
      'Your session does not meet the course security requirements.',
    );
  const lesson = await db
    .from('course_lessons')
    .select('id,course_id,slug,is_published')
    .eq('id', identity.lessonId)
    .eq('course_id', identity.courseId)
    .maybeSingle();
  if (lesson.error) throw lesson.error;
  if (!lesson.data || lesson.data.is_published !== true || typeof lesson.data.slug !== 'string') {
    throw new SimulatorError(
      404,
      'LESSON_NOT_FOUND',
      'The published lesson was not found in this course.',
    );
  }
  const definition = getHvacSimulationDefinition(identity.lessonId);
  if (!definition)
    throw new SimulatorError(
      404,
      'SIMULATION_NOT_CONFIGURED',
      'This lesson uses its existing assessment instead of a visual simulation.',
    );
  return { db, userId, ...identity, lessonSlug: lesson.data.slug, definition };
}

async function readProgress(context: SimulatorContext): Promise<ProgressRow | null> {
  const result = await context.db
    .from('interaction_progress')
    .select('id,answers,updated_at,completed_at')
    .eq('learner_id', context.userId)
    .eq('course_id', context.courseId)
    .eq('lesson_id', context.lessonId)
    .eq('interaction_id', context.definition.id)
    .eq('interaction_type', 'simulation')
    .maybeSingle();
  if (result.error) throw result.error;
  if (!result.data) return null;
  const parsed = ProgressRowSchema.safeParse(result.data);
  if (!parsed.success)
    throw new SimulatorError(
      409,
      'INVALID_SAVED_STATE',
      'Saved simulation progress needs review. No progress was changed.',
    );
  return parsed.data;
}

function parseHistory(definition: Definition, row: ProgressRow | null): SavedHistory | null {
  if (!row) return null;
  const parsed = HistorySchema.safeParse(row.answers);
  if (!parsed.success)
    throw new SimulatorError(
      409,
      'INVALID_SAVED_STATE',
      'Saved simulation progress needs review. No progress was changed.',
    );
  const history = parsed.data;
  if (history.simulationId !== definition.id || history.contentVersion !== definition.version) {
    throw new SimulatorError(
      409,
      'CONTENT_VERSION_MISMATCH',
      'The saved attempt uses a different simulation version. Ask your instructor to review it.',
    );
  }
  if (
    history.revision !== history.events.length ||
    new Set(history.events.map((event) => event.requestId)).size !== history.events.length ||
    history.events.some((event, index) => event.expectedRevision !== index)
  ) {
    throw new SimulatorError(
      409,
      'INVALID_SAVED_STATE',
      'Saved simulation history could not be verified. No progress was changed.',
    );
  }
  return history;
}

function restore(definition: Definition, history: SavedHistory | null) {
  let currentActions: HvacSimulationAction[] = [];
  let attemptCount = history ? 1 : 0;
  let bestScore: number | null = null;
  let mastered = false;
  const includeResult = (view: HvacSimulationView) => {
    if (view.score !== null)
      bestScore = bestScore === null ? view.score : Math.max(bestScore, view.score);
    mastered ||= view.passed;
  };
  try {
    for (const event of history?.events ?? []) {
      if (event.action.type === 'reset') {
        if (!currentActions.length) throw new Error('Empty attempt reset');
        includeResult(
          buildHvacSimulationView(definition, replayHvacSimulation(definition, currentActions)),
        );
        currentActions = [];
        attemptCount++;
      } else {
        currentActions.push(engineAction(event.action));
      }
    }
    const state = replayHvacSimulation(definition, currentActions);
    const view = buildHvacSimulationView(definition, state);
    includeResult(view);
    return { state, view, currentActions, attemptCount, mastered, bestScore };
  } catch {
    throw new SimulatorError(
      409,
      'INVALID_SAVED_STATE',
      'Saved simulation actions could not be replayed. No progress was changed.',
    );
  }
}

function responseFor(definition: Definition, row: ProgressRow | null): HvacSimulationResponse {
  const history = parseHistory(definition, row);
  const restored = restore(definition, history);
  return {
    success: true,
    simulation: restored.view,
    progress: {
      revision: history?.revision ?? 0,
      attemptCount: restored.attemptCount,
      mastered: restored.mastered,
      bestScore: restored.bestScore,
      lastSavedAt: row?.updated_at ?? null,
    },
  };
}

function duplicateResponse(
  context: SimulatorContext,
  row: ProgressRow | null,
  input: SimulatorRequest,
) {
  const history = parseHistory(context.definition, row);
  const previous = history?.events.find((event) => event.requestId === input.requestId);
  if (!previous) return null;
  if (
    previous.expectedRevision !== input.expectedRevision ||
    JSON.stringify(previous.action) !== JSON.stringify(input.action)
  ) {
    throw new SimulatorError(
      409,
      'REQUEST_ID_REUSED',
      'This request ID was already used for a different action. Reload the simulation.',
    );
  }
  return responseFor(context.definition, row);
}

async function concurrentResult(context: SimulatorContext, input: SimulatorRequest) {
  const latest = await readProgress(context);
  const duplicate = duplicateResponse(context, latest, input);
  if (duplicate) return privateJson(duplicate);
  throw new SimulatorError(
    409,
    'REVISION_CONFLICT',
    'Progress changed in another request or tab. Reload the saved simulation before continuing.',
  );
}

export async function GET(request: NextRequest) {
  try {
    const identity = await authenticate(request);
    if (typeof identity !== 'string') return identity;
    const parsed = IdentitySchema.safeParse({
      courseId: request.nextUrl.searchParams.get('courseId'),
      lessonId: request.nextUrl.searchParams.get('lessonId'),
    });
    if (!parsed.success)
      throw new SimulatorError(400, 'INVALID_REQUEST', 'A valid course and lesson are required.');
    const context = await authorizedContext(identity, parsed.data);
    return privateJson(responseFor(context.definition, await readProgress(context)));
  } catch (error) {
    return failure(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const identity = await authenticate(request);
    if (typeof identity !== 'string') return identity;
    if (
      !request.headers.get('content-type')?.toLowerCase().startsWith('application/json') ||
      request.headers.get('sec-fetch-site') === 'cross-site'
    ) {
      throw new SimulatorError(400, 'INVALID_REQUEST', 'Send a same-site JSON simulation request.');
    }
    const raw = await request.text();
    if (raw.length > 16384)
      throw new SimulatorError(413, 'REQUEST_TOO_LARGE', 'The simulation action is too large.');
    let body: unknown;
    try {
      body = JSON.parse(raw);
    } catch {
      throw new SimulatorError(400, 'INVALID_REQUEST', 'The simulation request is not valid JSON.');
    }
    const parsed = RequestSchema.safeParse(body);
    if (!parsed.success)
      throw new SimulatorError(
        400,
        'INVALID_REQUEST',
        'The simulation action is invalid. Scores and learner identity are determined by the server.',
      );
    const input = parsed.data;
    const context = await authorizedContext(identity, {
      courseId: input.courseId,
      lessonId: input.lessonId,
    });
    if (input.simulationId !== context.definition.id)
      throw new SimulatorError(
        400,
        'SIMULATION_MISMATCH',
        'The simulation does not belong to this lesson.',
      );
    const current = await readProgress(context);
    const duplicate = duplicateResponse(context, current, input);
    if (duplicate) return privateJson(duplicate);
    const history = parseHistory(context.definition, current);
    if (input.expectedRevision !== (history?.revision ?? 0)) {
      throw new SimulatorError(
        409,
        'REVISION_CONFLICT',
        'Progress changed in another request or tab. Reload the saved simulation before continuing.',
      );
    }
    if ((history?.revision ?? 0) >= MAX_SAVED_EVENTS) {
      throw new SimulatorError(
        409,
        'HISTORY_LIMIT',
        'This simulation has reached its saved practice-history limit. Ask your instructor to review the retained attempts.',
      );
    }
    const restored = restore(context.definition, history);
    try {
      if (input.action.type === 'reset') {
        if (!restored.currentActions.length)
          throw new Error('There is no practice attempt to restart.');
      } else {
        applyHvacSimulationAction(context.definition, restored.state, engineAction(input.action));
      }
    } catch {
      throw new SimulatorError(
        400,
        'INVALID_ACTION',
        'This action is not valid for the current simulation state. Check the controls and current step.',
      );
    }
    const nextHistory: SavedHistory = {
      schemaVersion: 1,
      simulationId: context.definition.id,
      contentVersion: context.definition.version,
      revision: (history?.revision ?? 0) + 1,
      events: [
        ...(history?.events ?? []),
        {
          requestId: input.requestId,
          expectedRevision: input.expectedRevision,
          action: input.action,
        },
      ],
    };
    const nextState = restore(context.definition, nextHistory);
    const now = new Date().toISOString();
    const values = {
      learner_id: context.userId,
      course_id: context.courseId,
      lesson_id: context.lessonId,
      lesson_slug: context.lessonSlug,
      interaction_id: context.definition.id,
      interaction_type: 'simulation',
      answers: nextHistory,
      score: nextState.bestScore,
      completed: nextState.mastered,
      attempts: nextState.attemptCount,
      weak_objectives:
        nextState.view.finished && !nextState.view.passed ? [nextState.view.objective] : [],
      feedback: nextState.view.feedback ?? {},
      completed_at: nextState.mastered ? (current?.completed_at ?? now) : null,
      updated_at: now,
    };
    // Only this narrowly scoped, server-scored row is written with privilege.
    // Enrollment, lesson completion, exam scores and hours are never mutated.
    const writer = await requireAdminClient();
    const save = current
      ? await writer
          .from('interaction_progress')
          .update(values)
          .eq('id', current.id)
          .eq('learner_id', context.userId)
          .eq('course_id', context.courseId)
          .eq('lesson_id', context.lessonId)
          .eq('interaction_id', context.definition.id)
          .eq('interaction_type', 'simulation')
          .eq('answers->>revision', String(input.expectedRevision))
          .eq('answers->>contentVersion', context.definition.version)
          .select('id,answers,updated_at,completed_at')
          .maybeSingle()
      : await writer
          .from('interaction_progress')
          .insert(values)
          .select('id,answers,updated_at,completed_at')
          .maybeSingle();
    if (save.error?.code === '23505') return await concurrentResult(context, input);
    if (save.error) throw save.error;
    if (!save.data) return await concurrentResult(context, input);
    const saved = ProgressRowSchema.safeParse(save.data);
    if (!saved.success) throw new Error('Saved simulation response could not be verified');
    return privateJson(responseFor(context.definition, saved.data));
  } catch (error) {
    return failure(error);
  }
}
