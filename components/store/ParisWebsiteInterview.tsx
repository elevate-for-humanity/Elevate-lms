'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, Loader2, Mic, MicOff, Sparkles, Volume2 } from 'lucide-react';
import { useNaturalVoice } from '@/components/voice/useNaturalVoice';
import {
  getWebsiteInterviewQuestions,
  missingRequiredWebsiteAnswers,
  type WebsiteInterviewAnswers,
} from '@/lib/website-builder/interview';

export function ParisWebsiteInterview({ onCreated }: { onCreated?: (website: any) => void }) {
  const [values, setValues] = useState<WebsiteInterviewAnswers>({});
  const [step, setStep] = useState(0);
  const [listening, setListening] = useState(false);
  const [building, setBuilding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [autoVoice, setAutoVoice] = useState(false);
  const recognitionRef = useRef<any>(null);
  const naturalVoice = useNaturalVoice();
  const fields = useMemo(() => getWebsiteInterviewQuestions(values), [values]);
  const current = fields[Math.min(step, fields.length - 1)];

  const canBuild = useMemo(() => missingRequiredWebsiteAnswers(values).length === 0, [values]);
  const answered = useMemo(() => fields.filter((field) => values[field.key]?.trim()).length, [fields, values]);
  const progress = Math.round(((step + 1) / fields.length) * 100);

  const speakQuestion = async () => {
    if (!current) return;
    setError(null);
    const spoken = step === 0 ? `I'm PARIS. ${current.question}` : current.question;
    const ok = await naturalVoice.play(spoken, { voice: 'coral', style: 'assistant', rate: 1.05 });
    if (!ok && naturalVoice.error) setError(naturalVoice.error);
  };

  useEffect(() => {
    if (!autoVoice || !current) return;
    void speakQuestion();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, autoVoice]);

  const listen = () => {
    if (typeof window === 'undefined') return;
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setError('Voice input is not supported in this browser. Type your answer instead.');
      return;
    }
    setError(null);
    if (listening) {
      recognitionRef.current?.stop?.();
      setListening(false);
      return;
    }
    naturalVoice.stop();
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.continuous = false;
    recognition.onstart = () => setListening(true);
    recognition.onend = () => setListening(false);
    recognition.onerror = () => setListening(false);
    recognition.onresult = (event: any) => {
      const transcript = event.results?.[0]?.[0]?.transcript || '';
      if (transcript && current) setValues((prev) => ({ ...prev, [current.key]: transcript }));
    };
    recognitionRef.current = recognition;
    recognition.start();
  };

  const build = async () => {
    if (!canBuild || building) return;
    setBuilding(true);
    setError(null);
    naturalVoice.stop();
    try {
      const response = await fetch('/api/apps/website-builder/ai-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers: values }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'PARIS could not build the website');
      onCreated?.(data.website);
      window.location.href = data.editUrl || `/apps/website-builder/edit/${data.website.id}`;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'PARIS could not build the website');
    } finally {
      setBuilding(false);
    }
  };

  useEffect(() => () => recognitionRef.current?.stop?.(), []);
  if (!current) return null;

  return (
    <section className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_24px_70px_rgba(15,23,42,0.08)]">
      <div className="grid lg:grid-cols-[300px_1fr]">
        <aside className="border-b border-slate-200 bg-slate-950 p-6 text-white lg:border-b-0 lg:border-r">
          <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.22em] text-red-300">
            <Sparkles className="h-4 w-4" /> PARIS
          </div>
          <h2 className="mt-4 text-2xl font-black leading-tight">Build the brief by talking to me.</h2>
          <p className="mt-3 text-sm leading-6 text-slate-300">
            No template questionnaire language. Give me the facts and direction; I’ll turn them into the first working site.
          </p>

          <div className="mt-8 space-y-2">
            {fields.map((field, index) => {
              const active = index === step;
              const complete = Boolean(values[field.key]?.trim());
              return (
                <button
                  key={field.key}
                  type="button"
                  onClick={() => setStep(index)}
                  className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-sm transition ${active ? 'bg-white text-slate-950' : 'text-slate-300 hover:bg-white/10 hover:text-white'}`}
                >
                  <span className="font-semibold">{field.label}</span>
                  <span className={`text-xs font-bold ${active ? 'text-slate-500' : complete ? 'text-emerald-300' : 'text-slate-500'}`}>
                    {complete ? '✓' : String(index + 1).padStart(2, '0')}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="mt-8 border-t border-white/10 pt-5 text-xs text-slate-400">
            {answered} of {fields.length} details captured
          </div>
        </aside>

        <div className="p-6 sm:p-8 lg:p-10">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-brand-red-700">{current.label}</p>
              <p className="mt-1 text-sm text-slate-500">Step {step + 1} of {fields.length}</p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => { setAutoVoice((value) => !value); naturalVoice.stop(); }}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50"
              >
                {autoVoice ? 'Voice prompts on' : 'Voice prompts off'}
              </button>
              <button
                type="button"
                onClick={() => void speakQuestion()}
                disabled={naturalVoice.isLoading}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              >
                {naturalVoice.isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Volume2 className="h-4 w-4" />} Hear it
              </button>
            </div>
          </div>

          <div className="mt-8 max-w-3xl">
            <h3 className="text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">{current.question}</h3>
            <div className="mt-6 flex gap-3">
              <textarea
                value={values[current.key] || ''}
                onChange={(event) => setValues((prev) => ({ ...prev, [current.key]: event.target.value }))}
                placeholder={current.placeholder}
                rows={5}
                autoFocus
                className="min-h-[150px] flex-1 resize-none rounded-2xl border border-slate-300 bg-slate-50 px-5 py-4 text-base font-medium leading-7 text-slate-950 outline-none placeholder:text-slate-400 focus:border-slate-950 focus:bg-white focus:ring-2 focus:ring-slate-950/10"
              />
              <button
                type="button"
                onClick={listen}
                className={`w-14 rounded-2xl transition ${listening ? 'bg-brand-red-600 text-white shadow-lg' : 'border border-slate-300 bg-white text-slate-800 hover:bg-slate-50'}`}
                aria-label={listening ? 'Stop voice input' : 'Answer by voice'}
              >
                {listening ? <MicOff className="mx-auto h-5 w-5" /> : <Mic className="mx-auto h-5 w-5" />}
              </button>
            </div>
            {listening ? <p className="mt-2 text-xs font-bold text-brand-red-700">Listening…</p> : null}
          </div>

          {error ? <div className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-900">{error}</div> : null}

          <div className="mt-10 h-1.5 overflow-hidden rounded-full bg-slate-100">
            <div className="h-full rounded-full bg-slate-950 transition-all duration-200" style={{ width: `${progress}%` }} />
          </div>

          <div className="mt-5 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => setStep((value) => Math.max(0, value - 1))}
              disabled={step === 0}
              className="inline-flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-30"
            >
              <ArrowLeft className="h-4 w-4" /> Back
            </button>

            {step < fields.length - 1 ? (
              <button
                type="button"
                onClick={() => setStep((value) => Math.min(fields.length - 1, value + 1))}
                className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-5 py-3 text-sm font-black text-white hover:bg-slate-800"
              >
                Continue <ArrowRight className="h-4 w-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={build}
                disabled={!canBuild || building}
                className="inline-flex items-center gap-2 rounded-xl bg-brand-red-600 px-6 py-3 text-sm font-black text-white shadow-sm hover:bg-brand-red-700 disabled:opacity-50"
              >
                {building ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                {building ? 'Building the first draft…' : 'Build the Website'}
              </button>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
