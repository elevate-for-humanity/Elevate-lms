export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { createPublicClient } from '@/lib/supabase/server';
import { requireAdminClient } from '@/lib/supabase/admin';

const CRITICAL = new Set(['first_name','last_name','email','phone','address','date_of_birth','program_id','program_slug','funding_path','transfer_hours_claimed','signature']);
const BASE_REQUIRED = ['first_name','last_name','email','phone','program_id'];

async function getUser(request: NextRequest) {
  const header = request.headers.get('authorization');
  if (!header?.startsWith('Bearer ')) return null;
  const supabase = createPublicClient();
  const { data, error } = await supabase.auth.getUser(header.slice(7));
  return error ? null : data.user;
}

async function getApplication(admin: any, userId: string, applicationId: string) {
  const { data, error } = await admin.from('applications').select('*').eq('id', applicationId).eq('user_id', userId).maybeSingle();
  if (error) throw error;
  return data;
}

function interviewMeta(application: any) {
  const meta = { ...(application.metadata || {}) };
  const interview = { ...(meta.paris_application || {}) };
  interview.answers = { ...(interview.answers || {}) };
  interview.locale = interview.locale === 'es' ? 'es' : 'en';
  interview.session_id = interview.session_id || crypto.randomUUID();
  meta.paris_application = interview;
  return { meta, interview };
}

function requiredFields(application: any, answers: Record<string,string>) {
  const fields = new Set(BASE_REQUIRED);
  const slug = String(application.program_slug || application.program_interest || '').toLowerCase();
  if (/barber|cosmet|apprentice|manicur/.test(slug)) ['transfer_hours_claimed','host_shop_name','work_schedule'].forEach((f) => fields.add(f));
  const funding = String(answers.funding_path || application.requested_funding_source || application.funding_type || '').toLowerCase();
  if (/workone|wioa|workforce/.test(funding)) ['funding_path','workforce_referral_status'].forEach((f) => fields.add(f));
  return [...fields];
}

function existingValue(application: any, answers: Record<string,string>, field: string) {
  const answer = answers[field];
  if (answer !== undefined && answer !== null && String(answer).trim()) return String(answer);
  const value = application[field];
  return value !== undefined && value !== null && String(value).trim() ? String(value) : '';
}

function progress(application: any, answers: Record<string,string>) {
  const required = requiredFields(application, answers);
  const missing = required.filter((field) => !existingValue(application, answers, field));
  return { required, missing, percent: required.length ? Math.round(((required.length - missing.length) / required.length) * 100) : 0, complete: missing.length === 0 };
}

function question(field: string | undefined, locale: string) {
  if (!field) return null;
  const copy: Record<string,[string,string]> = {
    first_name:['What is your legal first name?','¿Cuál es su nombre legal?'],
    last_name:['What is your legal last name?','¿Cuál es su apellido legal?'],
    email:['What is your email address?','¿Cuál es su correo electrónico?'],
    phone:['What is your phone number?','¿Cuál es su número de teléfono?'],
    program_id:['Which program are you applying for?','¿A qué programa está solicitando?'],
    funding_path:['How do you plan to pay for or fund training?','¿Cómo planea pagar o financiar la capacitación?'],
    workforce_referral_status:['Do you already have a WorkOne referral or authorization?','¿Ya tiene una referencia o autorización de WorkOne?'],
    transfer_hours_claimed:['Are you claiming transfer hours? If yes, how many?','¿Está solicitando horas de transferencia? Si es así, ¿cuántas?'],
    host_shop_name:['What is the name of your host shop or employer?','¿Cuál es el nombre de su tienda anfitriona o empleador?'],
    work_schedule:['What is your usual work schedule?','¿Cuál es su horario de trabajo habitual?'],
  };
  const pair = copy[field] || [`Please provide ${field.replaceAll('_',' ')}.`,`Proporcione ${field.replaceAll('_',' ')}.`];
  return { field, text: locale === 'es' ? pair[1] : pair[0] };
}

function decide(application: any, answers: Record<string,string>, state: ReturnType<typeof progress>) {
  if (!state.complete) return { decision: 'continue_interview', authority: 'paris', reason: 'Required applicant information is still missing.' };
  if (answers.transfer_hours_claimed && Number(answers.transfer_hours_claimed) > 0) return { decision: 'ready_for_sponsor_review', authority: 'sponsor', reason: 'Transfer hours require evidence and sponsor verification.' };
  const funding = String(answers.funding_path || application.requested_funding_source || '').toLowerCase();
  if (/workone|wioa|workforce/.test(funding) && !application.funding_verified) return { decision: 'ready_for_funding_review', authority: 'agency', reason: 'Application is complete; workforce funding eligibility requires authorized determination.' };
  return { decision: 'ready_for_review', authority: 'paris', reason: 'All required applicant-provided items are complete.' };
}

export async function GET(request: NextRequest) {
  try {
    const user = await getUser(request);
    if (!user) return NextResponse.json({ error:'Unauthorized' }, { status:401 });
    const applicationId = new URL(request.url).searchParams.get('applicationId');
    if (!applicationId) return NextResponse.json({ error:'applicationId is required' }, { status:400 });
    const admin = await requireAdminClient();
    const application = await getApplication(admin, user.id, applicationId);
    if (!application) return NextResponse.json({ error:'Application not found' }, { status:404 });
    const { interview } = interviewMeta(application);
    const state = progress(application, interview.answers);
    const decision = decide(application, interview.answers, state);
    return NextResponse.json({
      applicationId,
      status: application.status,
      locale: interview.locale,
      answers: interview.answers,
      progress: state.percent,
      missing: state.missing,
      nextQuestion: question(state.missing[0], interview.locale),
      decision,
      humanReviewRequired: decision.authority !== 'paris',
      transferHours: { claimed: application.transfer_hours_claimed, verified: application.transfer_hours_verified, verifiedAt: application.transfer_hours_verified_at },
      funding: { requested: application.requested_funding_source, status: application.funding_status, verified: application.funding_verified },
    });
  } catch (error) {
    console.error('PARIS application interview GET failed', error);
    return NextResponse.json({ error:'Unable to load application interview' }, { status:500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getUser(request);
    if (!user) return NextResponse.json({ error:'Unauthorized' }, { status:401 });
    const body = await request.json();
    const applicationId = String(body.applicationId || '');
    if (!applicationId) return NextResponse.json({ error:'applicationId is required' }, { status:400 });
    const admin = await requireAdminClient();
    const application = await getApplication(admin, user.id, applicationId);
    if (!application) return NextResponse.json({ error:'Application not found' }, { status:404 });
    const { meta, interview } = interviewMeta(application);

    if (body.action === 'set_locale') {
      interview.locale = body.locale === 'es' ? 'es' : 'en';
      await admin.from('applications').update({ metadata:meta, updated_at:new Date().toISOString() }).eq('id', applicationId).eq('user_id', user.id);
      return NextResponse.json({ ok:true, locale:interview.locale });
    }

    if (body.action === 'request_human_review') {
      interview.human_review_required = true;
      interview.human_review_reason = String(body.reason || 'Applicant requested staff assistance');
      interview.human_review_requested_at = new Date().toISOString();
      await admin.from('applications').update({ metadata:meta, updated_at:new Date().toISOString() }).eq('id', applicationId).eq('user_id', user.id);
      return NextResponse.json({ ok:true, humanReviewRequired:true });
    }

    if (body.action !== 'answer') return NextResponse.json({ error:'Unsupported action' }, { status:400 });
    const field = String(body.field || '');
    const value = String(body.value ?? '').trim();
    if (!field || !value) return NextResponse.json({ error:'field and value are required' }, { status:400 });

    const source = body.source === 'voice' ? 'voice' : 'text';
    const mustConfirm = source === 'voice' || CRITICAL.has(field);
    if (mustConfirm && body.confirmed !== true) {
      await admin.from('ai_conversations').insert({ session_id:interview.session_id, user_id:user.id, role:'user', content:value, metadata:{ target_type:'application', application_id:applicationId, field, source, confirmed:false } });
      return NextResponse.json({ ok:true, requiresConfirmation:true, field, transcript:value, message:interview.locale === 'es' ? 'Revise y confirme esta respuesta antes de guardarla.' : 'Review and confirm this answer before it is saved.' });
    }

    interview.answers[field] = value;
    interview.last_completed_field = field;
    interview.updated_at = new Date().toISOString();
    const updates: Record<string,any> = { metadata:meta, updated_at:new Date().toISOString() };
    if (['first_name','last_name','email','phone','address','program_slug'].includes(field)) updates[field] = value;
    if (field === 'funding_path') updates.requested_funding_source = value;
    if (field === 'transfer_hours_claimed') {
      updates.transfer_hours_claimed = Number.parseInt(value,10) || 0;
      interview.transfer_hours_pending_verification = true;
    }

    await admin.from('ai_conversations').insert({ session_id:interview.session_id, user_id:user.id, role:'user', content:value, metadata:{ target_type:'application', application_id:applicationId, field, source, confirmed:true } });
    const { error:updateError } = await admin.from('applications').update(updates).eq('id', applicationId).eq('user_id', user.id);
    if (updateError) throw updateError;

    const refreshed = { ...application, ...updates };
    const state = progress(refreshed, interview.answers);
    const decision = decide(refreshed, interview.answers, state);
    interview.decision = decision;

    let nextStatus = String(application.status || 'submitted');
    if (decision.decision === 'ready_for_review') nextStatus = 'ready_for_review';
    if (decision.decision === 'ready_for_sponsor_review' || decision.decision === 'ready_for_funding_review') nextStatus = 'under_review';

    if (nextStatus !== application.status && !['approved','enrolled','withdrawn','rejected','denied'].includes(String(application.status))) {
      await admin.from('applications').update({ status:nextStatus, metadata:meta, updated_at:new Date().toISOString() }).eq('id', applicationId).eq('user_id', user.id);
      await admin.from('application_state_events').insert({ application_type:application.application_type || 'student', application_id:applicationId, from_state:application.status, to_state:nextStatus, actor_id:user.id, actor_role:'applicant', reason:decision.reason, metadata:{ source:'paris_application_interview', decision } });
    }

    return NextResponse.json({
      ok:true,
      requiresConfirmation:false,
      progress:state.percent,
      missing:state.missing,
      nextQuestion:question(state.missing[0], interview.locale),
      decision,
      humanReviewRequired:decision.authority !== 'paris',
    });
  } catch (error) {
    console.error('PARIS application interview POST failed', error);
    return NextResponse.json({ error:'Unable to update application interview' }, { status:500 });
  }
}
