import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireAdminClient } from '@/lib/supabase/admin';
import {
  evaluateAndAdvanceApplication,
  getCurrentApplicantApplication,
  saveWorkOneAnswer,
} from '@/lib/paris/application-self-service';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function parseBooleanAnswer(value: unknown): boolean | null {
  if (typeof value === 'boolean') return value;
  const normalized = String(value || '').trim().toLowerCase();
  if (['yes', 'y', 'true', 'completed', 'done', 'approved', 'received'].includes(normalized)) return true;
  if (['no', 'n', 'false', 'not yet', 'nope'].includes(normalized)) return false;
  return null;
}

async function getAuthorizedContext() {
  const sessionClient = await createClient();
  const { data: { user } } = await sessionClient.auth.getUser();
  if (!user) return null;
  const admin = await requireAdminClient();
  const application = await getCurrentApplicantApplication(admin, user.id);
  return { user, admin, application };
}

export async function GET() {
  const context = await getAuthorizedContext();
  if (!context) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!context.application) {
    return NextResponse.json({ exists: false, message: 'No application is linked to this account.' });
  }

  const decision = await evaluateAndAdvanceApplication(context.admin, context.application, context.user.id);
  return NextResponse.json({ exists: true, application: {
    id: context.application.id,
    programId: context.application.program_id,
    programSlug: context.application.program_slug,
    status: decision.decidedStatus,
    progress: decision.progress,
    missing: decision.missing,
    pendingReview: decision.pendingReview,
    completed: decision.completed,
    nextAction: decision.nextAction,
    workOne: decision.workOne,
  }});
}

export async function POST(request: NextRequest) {
  const context = await getAuthorizedContext();
  if (!context) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!context.application) return NextResponse.json({ error: 'Application not found' }, { status: 404 });

  const body = await request.json().catch(() => ({}));
  const action = String(body.action || 'evaluate');
  let application = context.application;

  if (action === 'workone_answer') {
    const field = String(body.field || '');
    if (!['workone_visited', 'workone_process_completed', 'voucher_approved'].includes(field)) {
      return NextResponse.json({ error: 'Unsupported WorkOne field' }, { status: 400 });
    }
    const answer = parseBooleanAnswer(body.value);
    if (answer === null) {
      return NextResponse.json({ error: 'Please answer yes or no.' }, { status: 400 });
    }
    application = await saveWorkOneAnswer(
      context.admin,
      application,
      field as 'workone_visited' | 'workone_process_completed' | 'voucher_approved',
      answer,
      context.user.id,
    );
  }

  const decision = await evaluateAndAdvanceApplication(context.admin, application, context.user.id);
  return NextResponse.json({
    ok: true,
    status: decision.decidedStatus,
    progress: decision.progress,
    approved: decision.approved,
    missing: decision.missing,
    pendingReview: decision.pendingReview,
    completed: decision.completed,
    nextAction: decision.nextAction,
    workOne: decision.workOne,
  });
}
