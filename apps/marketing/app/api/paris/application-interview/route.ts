import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import {
  appendAgenticMessage,
  createAgenticProject,
  listAgenticEvents,
  listAgenticMessages,
  loadAgenticProject,
  recordAgenticEvent,
  updateAgenticProjectMetadata,
} from '@/lib/agentic/project-service';
import {
  applyInterviewAnswer,
  applicationInterviewReadyForSubmission,
  calculateApplicationInterviewProgress,
  changePendingInterviewAnswer,
  confirmPendingInterviewAnswer,
  createApplicationInterviewState,
  getNextApplicationInterviewQuestion,
  interviewStateToApplicationPayload,
  type ApplicationInterviewLocale,
  type ApplicationInterviewState,
} from '@/lib/paris/admissions/interview-engine';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const COOKIE_NAME = 'paris_application_resume';

const requestSchema = z.object({
  action: z.enum(['start', 'answer', 'confirm', 'change', 'locale', 'link_application']).default('answer'),
  message: z.string().trim().max(4000).optional(),
  locale: z.enum(['en', 'es']).optional(),
  inputMode: z.enum(['text', 'voice']).default('text'),
  applicationId: z.string().uuid().optional(),
  projectId: z.string().uuid().optional(),
  resumeToken: z.string().min(20).max(200).optional(),
});

function readSessionCookie(request: NextRequest): { projectId: string; resumeToken: string } | null {
  const raw = request.cookies.get(COOKIE_NAME)?.value;
  if (!raw) return null;
  const separator = raw.indexOf('.');
  if (separator <= 0) return null;
  const projectId = raw.slice(0, separator);
  const resumeToken = raw.slice(separator + 1);
  if (!projectId || !resumeToken) return null;
  return { projectId, resumeToken };
}

function stateFromMetadata(metadata: Record<string, unknown>, locale: ApplicationInterviewLocale): ApplicationInterviewState {
  const raw = metadata.applicationInterviewState;
  if (!raw || typeof raw !== 'object') return createApplicationInterviewState(locale);
  const state = raw as ApplicationInterviewState;
  return {
    ...createApplicationInterviewState(locale),
    ...state,
    locale,
    answers: state.answers ?? {},
    confirmed: Array.isArray(state.confirmed) ? state.confirmed : [],
  };
}

function assistantIntro(locale: ApplicationInterviewLocale) {
  return locale === 'es'
    ? 'Soy PARIS. Voy a guiarle por la solicitud paso a paso. Puede escribir o hablar, cambiar a inglés en cualquier momento y corregir cualquier respuesta antes de enviarla.'
    : 'I’m PARIS. I’ll guide you through the application one step at a time. You can type or speak, switch to Spanish at any time, and correct any answer before you submit.';
}

function requestsHumanReview(message: string | undefined): boolean {
  const value = (message || '').trim().toLowerCase();
  if (!value) return false;
  return /(talk|speak|connect|transfer|escalate).*(person|human|staff|advisor|counselor|admissions)|\b(person|human|staff member|advisor|counselor|admissions representative)\b/.test(value)
    || /(hablar|comunicar|conectar).*(persona|asesor|consejero|admisiones)|\b(una persona|un asesor|personal de admisiones)\b/.test(value);
}

function responsePayload(state: ApplicationInterviewState, projectId: string, messages: unknown[], events: unknown[]) {
  const progress = calculateApplicationInterviewProgress(state);
  const nextQuestion = getNextApplicationInterviewQuestion(state);
  return {
    ok: true,
    projectId,
    state,
    progress,
    nextQuestion,
    readyForSubmission: applicationInterviewReadyForSubmission(state),
    applicationPayload: applicationInterviewReadyForSubmission(state)
      ? interviewStateToApplicationPayload(state)
      : null,
    messages,
    events,
  };
}

async function loadSession(request: NextRequest, body?: z.infer<typeof requestSchema>) {
  const cookie = readSessionCookie(request);
  const projectId = body?.projectId ?? cookie?.projectId;
  const resumeToken = body?.resumeToken ?? cookie?.resumeToken;
  if (!projectId || !resumeToken) return null;
  const project = await loadAgenticProject({ projectId, resumeToken });
  return project ? { project, resumeToken } : null;
}

export async function GET(request: NextRequest) {
  try {
    const session = await loadSession(request);
    if (!session) return NextResponse.json({ ok: false, error: 'No resumable application interview found' }, { status: 404 });
    const locale = (session.project.locale === 'es' ? 'es' : 'en') as ApplicationInterviewLocale;
    const state = stateFromMetadata(session.project.metadata, locale);
    const [messages, events] = await Promise.all([
      listAgenticMessages(session.project.id),
      listAgenticEvents(session.project.id),
    ]);
    return NextResponse.json(responsePayload(state, session.project.id, messages, events), {
      headers: { 'Cache-Control': 'no-store' },
    });
  } catch (error) {
    console.error('paris.application-interview.load.failed', error instanceof Error ? error.message : String(error));
    return NextResponse.json({ ok: false, error: 'Unable to resume the application interview' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = requestSchema.parse(await request.json().catch(() => ({})));
    const requestedLocale = (body.locale ?? 'en') as ApplicationInterviewLocale;

    if (body.action === 'start') {
      const existing = await loadSession(request, body);
      if (existing) {
        const locale = (existing.project.locale === 'es' ? 'es' : 'en') as ApplicationInterviewLocale;
        const state = stateFromMetadata(existing.project.metadata, locale);
        const [messages, events] = await Promise.all([
          listAgenticMessages(existing.project.id),
          listAgenticEvents(existing.project.id),
        ]);
        return NextResponse.json(responsePayload(state, existing.project.id, messages, events), {
          headers: { 'Cache-Control': 'no-store' },
        });
      }

      const state = createApplicationInterviewState(requestedLocale);
      const created = await createAgenticProject({
        targetType: 'application',
        title: requestedLocale === 'es' ? 'Solicitud de admisión' : 'Admissions application',
        originalPrompt: 'Guide the applicant from initial interest to a review-ready application.',
        locale: requestedLocale,
        metadata: { applicationInterviewState: state, interface: 'paris-application-interview' },
      });
      if (!created.resumeToken) throw new Error('Resume token was not created');
      const intro = assistantIntro(requestedLocale);
      await appendAgenticMessage({ projectId: created.project.id, role: 'assistant', content: intro, locale: requestedLocale, inputMode: 'system' });
      await recordAgenticEvent({ projectId: created.project.id, eventType: 'application.interview.started', summary: requestedLocale === 'es' ? 'Entrevista de solicitud iniciada' : 'Application interview started' });
      const [messages, events] = await Promise.all([
        listAgenticMessages(created.project.id),
        listAgenticEvents(created.project.id),
      ]);
      const response = NextResponse.json(responsePayload(state, created.project.id, messages, events), {
        headers: { 'Cache-Control': 'no-store' },
      });
      response.cookies.set(COOKIE_NAME, `${created.project.id}.${created.resumeToken}`, {
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        path: '/',
        maxAge: 60 * 60 * 24 * 30,
      });
      return response;
    }

    const session = await loadSession(request, body);
    if (!session) return NextResponse.json({ ok: false, error: 'Application interview session not found' }, { status: 404 });

    let locale = (session.project.locale === 'es' ? 'es' : 'en') as ApplicationInterviewLocale;
    let state = stateFromMetadata(session.project.metadata, locale);

    if (body.action === 'locale') {
      locale = requestedLocale;
      state = { ...state, locale };
      await updateAgenticProjectMetadata({ project: session.project, metadata: { applicationInterviewState: state }, locale });
      const notice = locale === 'es'
        ? 'Continuaremos en español. Sus respuestas anteriores siguen guardadas en la misma solicitud.'
        : 'We’ll continue in English. Your earlier answers are still saved in the same application.';
      await appendAgenticMessage({ projectId: session.project.id, role: 'assistant', content: notice, locale, inputMode: 'system' });
    } else if (body.action === 'confirm') {
      state = confirmPendingInterviewAnswer(state);
      await updateAgenticProjectMetadata({ project: session.project, metadata: { applicationInterviewState: state }, locale });
      await recordAgenticEvent({ projectId: session.project.id, eventType: 'application.answer.confirmed', summary: locale === 'es' ? 'Respuesta importante confirmada' : 'Important answer confirmed' });
    } else if (body.action === 'change') {
      state = changePendingInterviewAnswer(state);
      await updateAgenticProjectMetadata({ project: session.project, metadata: { applicationInterviewState: state }, locale });
    } else if (body.action === 'link_application') {
      if (!body.applicationId) return NextResponse.json({ ok: false, error: 'applicationId is required' }, { status: 400 });
      const updated = await updateAgenticProjectMetadata({
        project: session.project,
        targetId: body.applicationId,
        status: 'completed',
        metadata: { applicationInterviewState: state, submittedApplicationId: body.applicationId },
      });
      await recordAgenticEvent({ projectId: session.project.id, eventType: 'application.submitted', summary: locale === 'es' ? 'Solicitud enviada para revisión' : 'Application submitted for review', payload: { applicationId: body.applicationId } });
      const [messages, events] = await Promise.all([
        listAgenticMessages(updated.id),
        listAgenticEvents(updated.id),
      ]);
      return NextResponse.json(responsePayload(state, updated.id, messages, events), { headers: { 'Cache-Control': 'no-store' } });
    } else {
      if (requestsHumanReview(body.message)) {
        const handoffAt = new Date().toISOString();
        await appendAgenticMessage({ projectId: session.project.id, role: 'user', content: body.message || '', locale, inputMode: body.inputMode, confirmed: true, metadata: { intent: 'human_review_required' } });
        await updateAgenticProjectMetadata({
          project: session.project,
          metadata: {
            applicationInterviewState: state,
            humanReviewRequired: true,
            humanReviewReason: 'Applicant requested staff assistance',
            humanReviewQueue: 'admissions',
            humanReviewRequestedAt: handoffAt,
          },
          locale,
        });
        await recordAgenticEvent({
          projectId: session.project.id,
          eventType: 'application.human_review_required',
          summary: locale === 'es' ? 'El solicitante pidió ayuda del personal de admisiones' : 'Applicant requested admissions staff assistance',
          payload: { reason: 'applicant_request', queue: 'admissions', requestedAt: handoffAt },
        });
        await appendAgenticMessage({
          projectId: session.project.id,
          role: 'assistant',
          content: locale === 'es'
            ? 'He marcado su solicitud para seguimiento humano por parte del equipo de admisiones. No voy a adivinar una respuesta que requiera revisión del personal. Puede continuar con la solicitud mientras espera.'
            : 'I marked your application for human follow-up by the admissions team. I will not guess at anything that requires staff review. You can continue the application while you wait.',
          locale,
          inputMode: 'system',
          metadata: { humanReviewRequired: true, queue: 'admissions' },
        });
      } else {
        const nextQuestion = getNextApplicationInterviewQuestion(state);
        if (!nextQuestion) {
          return NextResponse.json(responsePayload(state, session.project.id, await listAgenticMessages(session.project.id), await listAgenticEvents(session.project.id)), { headers: { 'Cache-Control': 'no-store' } });
        }
        if (!body.message) return NextResponse.json({ ok: false, error: 'An answer is required' }, { status: 400 });
        await appendAgenticMessage({ projectId: session.project.id, role: 'user', content: body.message, locale, inputMode: body.inputMode, confirmed: !nextQuestion.critical, metadata: { field: nextQuestion.field } });
        state = applyInterviewAnswer(state, nextQuestion.field, body.message, false);
        await updateAgenticProjectMetadata({ project: session.project, metadata: { applicationInterviewState: state }, locale });
        await recordAgenticEvent({ projectId: session.project.id, eventType: 'application.answer.received', summary: locale === 'es' ? 'Respuesta recibida' : 'Application answer received', payload: { field: nextQuestion.field, inputMode: body.inputMode, requiresConfirmation: nextQuestion.critical } });
      }
    }

    const next = getNextApplicationInterviewQuestion(state);
    if (next) {
      await appendAgenticMessage({ projectId: session.project.id, role: 'assistant', content: [next.prompt, next.help].filter(Boolean).join('\n\n'), locale, inputMode: 'system', metadata: { field: next.field, options: next.options ?? [] } });
    }
    const [messages, events] = await Promise.all([
      listAgenticMessages(session.project.id),
      listAgenticEvents(session.project.id),
    ]);
    return NextResponse.json(responsePayload(state, session.project.id, messages, events), {
      headers: { 'Cache-Control': 'no-store' },
    });
  } catch (error) {
    console.error('paris.application-interview.failed', error instanceof Error ? error.message : String(error));
    if (error instanceof z.ZodError) {
      return NextResponse.json({ ok: false, error: 'Invalid interview request', details: error.issues }, { status: 400 });
    }
    return NextResponse.json({ ok: false, error: 'PARIS could not process the application interview' }, { status: 500 });
  }
}
