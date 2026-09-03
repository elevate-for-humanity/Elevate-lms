'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  CheckCircle2,
  ChevronRight,
  FileText,
  Languages,
  Loader2,
  Mic,
  MicOff,
  Send,
  ShieldCheck,
  UserRound,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { useNaturalVoice } from '@/components/voice/useNaturalVoice';
import {
  TRANSFER_HOURS_EVIDENCE_ACCEPT,
  uploadTransferHoursEvidence,
} from '@/lib/applications/upload-transfer-hours-evidence';

interface ProgramOption {
  slug: string;
  title: string;
}

interface InterviewMessage {
  id: string;
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: string;
  locale: string;
  input_mode: 'text' | 'voice' | 'system';
  confirmed: boolean;
  created_at: string;
}

interface InterviewQuestion {
  field: string;
  prompt: string;
  help?: string;
  required: boolean;
  critical: boolean;
  options?: Array<{ value: string; label: string }>;
}

interface InterviewResponse {
  ok: boolean;
  error?: string;
  projectId: string;
  state: {
    locale: 'en' | 'es';
    answers: Record<string, string>;
    confirmed: string[];
    pendingConfirmation?: { field: string; value: string } | null;
  };
  progress: {
    percent: number;
    required: string[];
    complete: string[];
    missing: string[];
  };
  nextQuestion: InterviewQuestion | null;
  readyForSubmission: boolean;
  applicationPayload: Record<string, unknown> | null;
  messages: InterviewMessage[];
  events: Array<{ id: string; event_type: string; summary: string; created_at: string }>;
}

const LABELS: Record<string, { en: string; es: string }> = {
  firstName: { en: 'First name', es: 'Nombre' },
  lastName: { en: 'Last name', es: 'Apellido' },
  dateOfBirth: { en: 'Date of birth', es: 'Fecha de nacimiento' },
  email: { en: 'Email', es: 'Correo electrónico' },
  phone: { en: 'Phone', es: 'Teléfono' },
  preferredContact: { en: 'Preferred contact', es: 'Contacto preferido' },
  address: { en: 'Address', es: 'Dirección' },
  city: { en: 'City', es: 'Ciudad' },
  state: { en: 'State', es: 'Estado' },
  zipCode: { en: 'ZIP code', es: 'Código postal' },
  program: { en: 'Program', es: 'Programa' },
  goals: { en: 'Career goal', es: 'Meta profesional' },
  fundingSource: { en: 'Funding path', es: 'Fuente de financiamiento' },
  hasWorkOneReferral: { en: 'WorkOne referral', es: 'Referido de WorkOne' },
  workoneCenter: { en: 'WorkOne center', es: 'Centro de WorkOne' },
  employmentStatus: { en: 'Employment', es: 'Empleo' },
  currentEmployer: { en: 'Current employer', es: 'Empleador actual' },
  highestEducation: { en: 'Education', es: 'Educación' },
  modalityPreference: { en: 'Training format', es: 'Formato de capacitación' },
  hasHostShop: { en: 'Host shop', es: 'Salón anfitrión' },
  hostShopName: { en: 'Host shop name', es: 'Nombre del salón anfitrión' },
  transferHours: { en: 'Transfer hours claimed', es: 'Horas de transferencia reclamadas' },
  transportationNeeds: { en: 'Transportation support', es: 'Apoyo de transporte' },
  childcareNeeds: { en: 'Childcare support', es: 'Apoyo de cuidado infantil' },
  supportNeeds: { en: 'Other support', es: 'Otro apoyo' },
};

function makeIdempotencyKey(projectId: string) {
  return `${projectId}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function isApprenticeship(program: string | undefined) {
  return (program || '').toLowerCase().includes('apprentice');
}

function transferHours(value: string | undefined) {
  const parsed = Number.parseInt(value || '0', 10);
  return Number.isFinite(parsed) ? Math.max(0, parsed) : 0;
}

export default function ParisApplicationWorkspace({
  programs,
  initialProgram,
  applicationIntent = 'inquiry',
  paymentSessionId = '',
}: {
  programs: ProgramOption[];
  initialProgram?: string;
  applicationIntent?: 'inquiry' | 'enrollment';
  paymentSessionId?: string;
}) {
  const router = useRouter();
  const [session, setSession] = useState<InterviewResponse | null>(null);
  const [input, setInput] = useState('');
  const [draftInputMode, setDraftInputMode] = useState<'text' | 'voice'>('text');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [listening, setListening] = useState(false);
  const [speechEnabled, setSpeechEnabled] = useState(false);
  const [transferEvidence, setTransferEvidence] = useState<File | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const initializedProgram = useRef(false);
  const spokenMessageId = useRef('');
  const parisVoice = useNaturalVoice();

  const locale = session?.state.locale ?? 'en';
  const t = useMemo(
    () =>
      locale === 'es'
        ? {
            title: 'Solicitud guiada por PARIS',
            subtitle: 'Responda por voz o texto. Sus respuestas se guardan mientras avanza.',
            summary: 'Resumen de la solicitud',
            documents: 'Documentos y requisitos',
            status: 'Progreso',
            send: 'Enviar',
            listening: 'Escuchando…',
            typeAnswer: 'Escriba su respuesta…',
            voiceDraft: 'Transcripción de voz lista. Revísela o corríjala y luego presione Enviar.',
            submit: 'Enviar solicitud para revisión',
            submitting: 'Enviando solicitud…',
            saved: 'Guardado automáticamente',
            requiredEvidence: 'Se requiere evidencia para las horas de transferencia reclamadas.',
            evidence: 'Evidencia de horas de transferencia',
            review: 'PARIS puede ayudar a completar la solicitud, pero el personal autorizado toma las decisiones de admisión, financiamiento y aprobación.',
            language: 'Idioma',
          }
        : {
            title: 'PARIS-guided application',
            subtitle: 'Answer by voice or text. Your progress is saved as you go.',
            summary: 'Application summary',
            documents: 'Documents & requirements',
            status: 'Progress',
            send: 'Send',
            listening: 'Listening…',
            typeAnswer: 'Type your answer…',
            voiceDraft: 'Voice transcription ready. Review or correct it, then press Send.',
            submit: 'Submit application for review',
            submitting: 'Submitting application…',
            saved: 'Saved automatically',
            requiredEvidence: 'Evidence is required for claimed transfer hours.',
            evidence: 'Transfer-hours evidence',
            review: 'PARIS can help complete the application, but authorized staff make admissions, funding, and approval decisions.',
            language: 'Language',
          },
    [locale],
  );

  async function callInterview(body: Record<string, unknown>) {
    const response = await fetch('/api/paris/application-interview', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      cache: 'no-store',
      body: JSON.stringify(body),
    });
    const data = (await response.json().catch(() => ({}))) as InterviewResponse;
    if (!response.ok || !data.ok) throw new Error(data.error || 'PARIS could not continue the interview.');
    setSession(data);
    return data;
  }

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const resume = await fetch('/api/paris/application-interview', { cache: 'no-store' });
        if (resume.ok) {
          const data = (await resume.json()) as InterviewResponse;
          if (alive && data.ok) setSession(data);
          return;
        }
        const data = await callInterview({ action: 'start', locale: 'en' });
        if (alive) setSession(data);
      } catch (err) {
        if (alive) setError(err instanceof Error ? err.message : 'Unable to start the application interview.');
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [session?.messages.length]);

  useEffect(() => {
    if (!speechEnabled || !session?.messages.length) return;
    const latest = [...session.messages].reverse().find((message) => message.role === 'assistant');
    if (!latest || latest.id === spokenMessageId.current) return;
    spokenMessageId.current = latest.id;
    void parisVoice.play(latest.content, { style: 'assistant', rate: 0.96 });
  }, [parisVoice, session?.messages, speechEnabled]);

  function toggleParisSpeech() {
    if (speechEnabled) {
      parisVoice.stop();
      setSpeechEnabled(false);
      return;
    }
    setSpeechEnabled(true);
    const latest = session?.messages ? [...session.messages].reverse().find((message) => message.role === 'assistant') : null;
    if (latest) {
      spokenMessageId.current = latest.id;
      void parisVoice.play(latest.content, { style: 'assistant', rate: 0.96 });
    }
  }

  async function sendAnswer(value: string, inputMode: 'text' | 'voice' = 'text') {
    if (!value.trim() || sending) return;
    setSending(true);
    setError('');
    try {
      await callInterview({ action: 'answer', message: value, inputMode, locale });
      setInput('');
      setDraftInputMode('text');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save that answer.');
    } finally {
      setSending(false);
    }
  }

  useEffect(() => {
    if (!session || initializedProgram.current || !initialProgram) return;
    if (session.state.answers.program) {
      initializedProgram.current = true;
      return;
    }
    if (session.nextQuestion?.field !== 'program') return;
    initializedProgram.current = true;
    void sendAnswer(initialProgram, 'text');
    // This one-time initialization is gated by initializedProgram. Including
    // sendAnswer's render-local identity would retrigger the effect.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, initialProgram]);

  async function sendDraft() {
    const value = input.trim();
    if (!value || sending) return;

    if (session?.state.pendingConfirmation) {
      const normalized = value.toLowerCase();
      if (['yes', 'y', 'confirm', 'correct', 'sí', 'si', 'confirmar', 'correcto'].includes(normalized)) {
        setInput('');
        setDraftInputMode('text');
        await chooseAction('confirm');
        return;
      }
      if (['no', 'n', 'change', 'edit', 'cambiar', 'editar', 'incorrect'].includes(normalized)) {
        setInput('');
        setDraftInputMode('text');
        await chooseAction('change');
        return;
      }
      setError(
        locale === 'es'
          ? 'Escriba Sí para confirmar o Cambiar para corregir la respuesta.'
          : 'Type Yes to confirm or Change to correct the answer.',
      );
      return;
    }

    await sendAnswer(input, draftInputMode);
  }

  async function chooseAction(action: 'confirm' | 'change') {
    setSending(true);
    setError('');
    try {
      await callInterview({ action, locale });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to update that answer.');
    } finally {
      setSending(false);
    }
  }

  async function switchLanguage(next: 'en' | 'es') {
    if (next === locale || sending) return;
    setSending(true);
    setError('');
    try {
      await callInterview({ action: 'locale', locale: next });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to change language.');
    } finally {
      setSending(false);
    }
  }

  function startVoice() {
    if (typeof window === 'undefined') return;
    const w = window as unknown as {
      SpeechRecognition?: new () => any;
      webkitSpeechRecognition?: new () => any;
    };
    const Recognition = w.SpeechRecognition || w.webkitSpeechRecognition;
    if (!Recognition) {
      setError(locale === 'es' ? 'Este navegador no admite reconocimiento de voz.' : 'This browser does not support speech recognition.');
      return;
    }
    const recognition = new Recognition();
    recognition.lang = locale === 'es' ? 'es-US' : 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.onstart = () => setListening(true);
    recognition.onend = () => setListening(false);
    recognition.onerror = () => {
      setListening(false);
      setError(locale === 'es' ? 'No pude entender el audio. Inténtelo de nuevo o escriba su respuesta.' : 'I could not understand the audio. Try again or type your answer.');
    };
    recognition.onresult = (event: any) => {
      const transcript = String(event.results?.[0]?.[0]?.transcript || '').trim();
      setInput(transcript);
      setDraftInputMode('voice');
      setListening(false);
      // Do not persist speech automatically. The applicant must see and review
      // the transcription first, and may correct it before explicitly sending.
    };
    recognition.start();
  }

  async function submitApplication() {
    if (!session?.readyForSubmission || !session.applicationPayload || submitting) return;
    if (applicationIntent === 'enrollment' && !paymentSessionId) {
      setError('Complete the verified payment or BNPL checkout before submitting this enrollment application.');
      return;
    }
    const answers = session.state.answers;
    const claimed = transferHours(answers.transferHours);
    if (isApprenticeship(answers.program) && claimed > 0 && !transferEvidence) {
      setError(t.requiredEvidence);
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      if (transferEvidence && claimed > 0) {
        await uploadTransferHoursEvidence({
          file: transferEvidence,
          email: answers.email,
          program: answers.program,
          hoursClaimed: claimed,
        });
      }
      const response = await fetch('/api/applications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          'X-Idempotency-Key': makeIdempotencyKey(session.projectId),
        },
        cache: 'no-store',
        body: JSON.stringify({
          ...session.applicationPayload,
          applicationIntent,
          paymentSessionId: paymentSessionId || undefined,
        }),
      });
      const data = (await response.json().catch(() => ({}))) as {
        ok?: boolean;
        id?: string;
        referenceNumber?: string;
        program?: string;
        error?: string;
      };
      if (!response.ok || !data.ok || !data.id) throw new Error(data.error || 'Application could not be submitted.');
      await callInterview({ action: 'link_application', applicationId: data.id, locale });
      const query = new URLSearchParams();
      if (data.referenceNumber) query.set('ref', data.referenceNumber);
      if (data.program) query.set('program', data.program);
      router.push(`/apply/success${query.toString() ? `?${query.toString()}` : ''}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Application could not be submitted.');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[55vh] items-center justify-center rounded-2xl border border-slate-200 bg-white">
        <div className="flex items-center gap-3 text-sm font-bold text-slate-700">
          <Loader2 className="h-5 w-5 animate-spin" /> Preparing PARIS…
        </div>
      </div>
    );
  }

  if (!session) {
    return <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-900">{error || 'Unable to start the application interview.'}</div>;
  }

  const question = session.nextQuestion;
  const answers = session.state.answers;
  const claimed = transferHours(answers.transferHours);
  const showTransferUpload = isApprenticeship(answers.program) && claimed > 0;
  const programOptions = question?.field === 'program' ? programs.map((program) => ({ value: program.slug, label: program.title })) : null;
  const options = programOptions || question?.options || [];

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-slate-950 px-4 py-3 text-white sm:px-6">
        <div>
          <p className="text-sm font-black">{t.title}</p>
          <p className="mt-0.5 text-xs text-slate-300">{t.subtitle}</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={toggleParisSpeech}
            className="inline-flex min-h-9 items-center gap-2 rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs font-bold text-white hover:bg-slate-800"
            aria-pressed={speechEnabled}
          >
            {speechEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
            {speechEnabled ? 'PARIS voice on' : 'Hear PARIS'}
          </button>
          <div className="hidden text-right sm:block">
            <p className="text-xs font-bold">{session.progress.percent}%</p>
            <p className="text-[11px] text-slate-400">{t.saved}</p>
          </div>
          <div className="flex items-center rounded-lg border border-slate-700 bg-slate-900 p-1" aria-label={t.language}>
            <Languages className="mx-2 h-4 w-4 text-slate-300" />
            <button type="button" onClick={() => void switchLanguage('en')} className={`rounded-md px-2 py-1 text-xs font-bold ${locale === 'en' ? 'bg-white text-slate-950' : 'text-slate-300 hover:bg-slate-800'}`}>English</button>
            <button type="button" onClick={() => void switchLanguage('es')} className={`rounded-md px-2 py-1 text-xs font-bold ${locale === 'es' ? 'bg-white text-slate-950' : 'text-slate-300 hover:bg-slate-800'}`}>Español</button>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-[1.05fr_0.95fr]">
        <section className="flex h-[min(72vh,720px)] min-h-[520px] min-w-0 flex-col border-b border-slate-200 lg:border-b-0 lg:border-r">
          <div
            ref={scrollRef}
            className="min-h-0 flex-1 space-y-4 overflow-y-auto bg-slate-50 p-4 sm:p-6"
            aria-label="Application interview conversation"
            aria-live="polite"
            tabIndex={0}
          >
            {session.messages.map((message) => (
              <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[88%] rounded-2xl px-4 py-3 text-sm leading-6 ${message.role === 'user' ? 'bg-brand-red-600 text-white' : 'border border-slate-200 bg-white text-slate-800 shadow-sm'}`}>
                  {message.role !== 'user' && <p className="mb-1 text-[11px] font-black uppercase tracking-wide text-brand-red-700">PARIS</p>}
                  <p className="whitespace-pre-line">{message.content}</p>
                  {message.input_mode === 'voice' && message.role === 'user' ? <p className="mt-1 text-[10px] text-red-100">Voice transcription</p> : null}
                </div>
              </div>
            ))}

            {question ? (
              <div className="rounded-2xl border border-brand-red-200 bg-white p-4 shadow-sm">
                <p className="text-sm font-black text-slate-950">{question.prompt}</p>
                {question.help ? <p className="mt-2 text-xs leading-5 text-slate-600">{question.help}</p> : null}
                {options.length ? (
                  <div className="mt-4 grid gap-2 sm:grid-cols-2">
                    {options.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        disabled={sending}
                        onClick={() => {
                          if (option.value === 'confirm') void chooseAction('confirm');
                          else if (option.value === 'change') void chooseAction('change');
                          else void sendAnswer(option.value, 'text');
                        }}
                        className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-left text-sm font-bold text-slate-800 hover:border-brand-red-500 hover:bg-red-50 disabled:opacity-50"
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>

          {!session.readyForSubmission || session.state.pendingConfirmation ? (
            <div className="sticky bottom-0 z-10 border-t border-slate-200 bg-white p-4 shadow-[0_-8px_20px_rgba(15,23,42,0.08)] sm:p-5">
              <div className="flex items-end gap-2">
                <button
                  type="button"
                  onClick={startVoice}
                  disabled={sending || listening}
                  className={`inline-flex h-12 w-12 flex-none items-center justify-center rounded-xl border ${listening ? 'border-brand-red-500 bg-red-50 text-brand-red-700' : 'border-slate-300 text-slate-700 hover:bg-slate-50'}`}
                  aria-label={listening ? t.listening : 'Speak answer'}
                  title={locale === 'es' ? 'Responder usando el micrófono' : 'Answer using the microphone'}
                >
                  {listening ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
                </button>
                <textarea
                  aria-label={t.typeAnswer}
                  value={input}
                  onChange={(event) => setInput(event.target.value.slice(0, 2000))}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' && !event.shiftKey) {
                      event.preventDefault();
                      void sendDraft();
                    }
                  }}
                  disabled={sending}
                  placeholder={
                    session.state.pendingConfirmation
                      ? (locale === 'es' ? 'Escriba Sí o Cambiar…' : 'Type Yes or Change…')
                      : (listening ? t.listening : t.typeAnswer)
                  }
                  className="min-h-12 max-h-32 min-w-0 flex-1 resize-y rounded-xl border-2 border-slate-400 px-4 py-3 text-base text-slate-950 focus:border-brand-red-600 focus:outline-none focus:ring-2 focus:ring-red-100 disabled:bg-slate-100"
                  rows={2}
                  maxLength={2000}
                />
                <button
                  type="button"
                  onClick={() => void sendDraft()}
                  disabled={sending || !input.trim()}
                  className="inline-flex h-12 w-12 flex-none items-center justify-center rounded-xl bg-brand-red-600 text-white hover:bg-brand-red-700 disabled:opacity-50"
                  aria-label={t.send}
                >
                  {sending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
                </button>
              </div>
              {draftInputMode === 'voice' && input.trim() ? (
                <p className="mt-2 text-xs font-medium text-slate-600" role="status">{t.voiceDraft}</p>
              ) : null}
              {error ? <p className="mt-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</p> : null}
            </div>
          ) : null}
        </section>

        <aside className="bg-white p-4 sm:p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-widest text-brand-red-700">{t.status}</p>
              <h2 className="mt-1 text-xl font-black text-slate-950">{t.summary}</h2>
            </div>
            <div className="text-right">
              <p className="text-2xl font-black text-slate-950">{session.progress.percent}%</p>
              <p className="text-[11px] text-slate-500">{session.progress.complete.length}/{session.progress.required.length}</p>
            </div>
          </div>
          <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100">
            <div className="h-full rounded-full bg-brand-red-600 transition-all" style={{ width: `${session.progress.percent}%` }} />
          </div>

          <div className="mt-6 space-y-2">
            {session.progress.required.map((field) => {
              const value = answers[field];
              const complete = session.progress.complete.includes(field);
              return (
                <div key={field} className="flex items-start gap-3 rounded-xl border border-slate-200 p-3">
                  {complete ? <CheckCircle2 className="mt-0.5 h-4 w-4 flex-none text-emerald-600" /> : <ChevronRight className="mt-0.5 h-4 w-4 flex-none text-slate-400" />}
                  <div className="min-w-0">
                    <p className="text-xs font-black text-slate-800">{LABELS[field]?.[locale] || field}</p>
                    <p className={`mt-0.5 break-words text-xs ${value ? 'text-slate-600' : 'text-slate-400'}`}>{value || (locale === 'es' ? 'Pendiente' : 'Pending')}</p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-slate-700" />
              <p className="text-sm font-black text-slate-950">{t.documents}</p>
            </div>
            {showTransferUpload ? (
              <label className="mt-3 block text-xs font-bold text-slate-700">
                {t.evidence}
                <input
                  type="file"
                  accept={TRANSFER_HOURS_EVIDENCE_ACCEPT}
                  onChange={(event) => setTransferEvidence(event.target.files?.[0] || null)}
                  className="mt-2 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs"
                />
                <span className="mt-2 block font-normal leading-5 text-slate-500">{t.requiredEvidence}</span>
              </label>
            ) : (
              <p className="mt-2 text-xs leading-5 text-slate-600">{locale === 'es' ? 'PARIS mostrará requisitos adicionales cuando correspondan a su programa o ruta de financiamiento.' : 'PARIS will surface additional requirements when they apply to your program or funding path.'}</p>
            )}
          </div>

          <div className="mt-6 rounded-xl border border-blue-200 bg-blue-50 p-4 text-xs leading-5 text-blue-950">
            <div className="flex items-start gap-2"><ShieldCheck className="mt-0.5 h-4 w-4 flex-none" /><p>{t.review}</p></div>
          </div>

          {applicationIntent === 'enrollment' && !paymentSessionId ? (
            <div className="mt-4 rounded-xl border-2 border-amber-300 bg-amber-50 p-4 text-sm font-bold leading-6 text-amber-950">
              Complete the verified deposit, full-payment, or eligible BNPL checkout below before submitting this enrollment application.
            </div>
          ) : null}

          {session.readyForSubmission ? (
            <button
              type="button"
              onClick={() => void submitApplication()}
              disabled={submitting || (applicationIntent === 'enrollment' && !paymentSessionId)}
              className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-brand-red-600 px-5 py-3.5 text-sm font-black text-white hover:bg-brand-red-700 disabled:opacity-60"
            >
              {submitting ? <><Loader2 className="h-4 w-4 animate-spin" /> {t.submitting}</> : <><UserRound className="h-4 w-4" /> {applicationIntent === 'enrollment' && !paymentSessionId ? 'Payment required to submit' : t.submit}</>}
            </button>
          ) : null}
          {error && session.readyForSubmission ? <p className="mt-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</p> : null}
        </aside>
      </div>
    </div>
  );
}
