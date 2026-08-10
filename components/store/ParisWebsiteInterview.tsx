'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Loader2, Mic, MicOff, Sparkles, Volume2 } from 'lucide-react';
import { useNaturalVoice } from '@/components/voice/useNaturalVoice';

type FieldKey = 'businessName' | 'industry' | 'services' | 'audience' | 'style' | 'goal' | 'extra';

type InterviewField = {
  key: FieldKey;
  label: string;
  question: string;
  placeholder: string;
};

const fields: InterviewField[] = [
  { key: 'businessName', label: 'Business name', question: 'What is the name of your business or organization?', placeholder: 'Example: Bright Path Home Care' },
  { key: 'industry', label: 'Industry', question: 'What kind of business do you operate?', placeholder: 'Home care, salon, training school, construction...' },
  { key: 'services', label: 'Services or programs', question: 'What do you want customers to buy, book, apply for, or learn about?', placeholder: 'List your main services or programs' },
  { key: 'audience', label: 'Ideal customer', question: 'Who are you trying to reach?', placeholder: 'Families, students, small businesses, employers...' },
  { key: 'style', label: 'Look and feel', question: 'How should your website feel?', placeholder: 'Professional, luxury, bold, calming, modern...' },
  { key: 'goal', label: 'Main goal', question: 'What is the number one thing you want visitors to do?', placeholder: 'Book an appointment, call, apply, buy, request a quote...' },
  { key: 'extra', label: 'Anything else', question: 'Tell me anything else you want me to know before I build it.', placeholder: 'Special pages, colors, offers, important details...' },
];

export function ParisWebsiteInterview({ onCreated }: { onCreated?: (website: any) => void }) {
  const [values, setValues] = useState<Record<FieldKey, string>>({
    businessName: '', industry: '', services: '', audience: '', style: '', goal: '', extra: '',
  });
  const [step, setStep] = useState(0);
  const [listening, setListening] = useState(false);
  const [building, setBuilding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [autoVoice, setAutoVoice] = useState(true);
  const recognitionRef = useRef<any>(null);
  const naturalVoice = useNaturalVoice();
  const current = fields[step];

  const canBuild = useMemo(() => values.businessName.trim() && values.industry.trim() && values.services.trim(), [values]);

  const speakQuestion = async () => {
    if (!current) return;
    setError(null);
    const spoken = step === 0 ? `I'm PARIS. ${current.question}` : current.question;
    const ok = await naturalVoice.play(spoken, { voice: 'coral', style: 'assistant', rate: 1 });
    if (!ok && naturalVoice.error) setError(naturalVoice.error);
  };

  useEffect(() => {
    if (!autoVoice || !current) return;
    const timer = window.setTimeout(() => {
      void speakQuestion();
    }, 300);
    return () => window.clearTimeout(timer);
    // current changes with step; autoVoice lets the user silence automatic prompts.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, autoVoice]);

  const listen = () => {
    if (typeof window === 'undefined') return;
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setError('Voice input is not supported in this browser. You can type your answer instead.');
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
    if (!canBuild) return;
    setBuilding(true);
    setError(null);
    naturalVoice.stop();
    try {
      const response = await fetch('/api/apps/website-builder/ai-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
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

  useEffect(() => () => {
    recognitionRef.current?.stop?.();
  }, []);

  if (!current) return null;

  const progress = Math.round(((step + 1) / fields.length) * 100);

  return (
    <section className="rounded-2xl border border-brand-red-200 bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-brand-red-600">Live PARIS Website Interview</p>
          <h2 className="mt-1 text-2xl font-black text-slate-950">Answer a few questions. PARIS builds the first draft.</h2>
          <p className="mt-2 max-w-2xl text-sm font-medium leading-6 text-slate-700">PARIS asks each question with a natural AI voice. Speak or type your answer, review it, then continue. Your answers become the site copy, services, SEO and starter design.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => { setAutoVoice((value) => !value); naturalVoice.stop(); }} className="inline-flex items-center gap-2 rounded-xl border border-slate-300 px-4 py-2 text-sm font-bold text-slate-800 hover:bg-slate-50">
            <Volume2 className="h-4 w-4" /> {autoVoice ? 'Auto voice on' : 'Auto voice off'}
          </button>
          <button type="button" onClick={() => void speakQuestion()} disabled={naturalVoice.isLoading} className="inline-flex items-center gap-2 rounded-xl border border-slate-300 px-4 py-2 text-sm font-bold text-slate-800 hover:bg-slate-50 disabled:opacity-60">
            {naturalVoice.isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Volume2 className="h-4 w-4" />} {naturalVoice.isLoading ? 'Preparing voice' : 'Repeat'}
          </button>
        </div>
      </div>

      <div className="mt-5 h-2 overflow-hidden rounded-full bg-slate-100" aria-label={`Interview ${progress}% complete`}>
        <div className="h-full rounded-full bg-brand-red-600 transition-all duration-300" style={{ width: `${progress}%` }} />
      </div>

      <div key={current.key} className="paris-question mt-6 rounded-2xl bg-slate-50 p-5">
        <div className="flex items-center justify-between gap-3">
          <span className="text-xs font-black uppercase tracking-wider text-slate-700">Question {step + 1} of {fields.length}</span>
          <span className="text-xs font-bold text-slate-700">{current.label}</span>
        </div>
        <h3 className="mt-3 text-lg font-black text-slate-950">{current.question}</h3>
        <div className="mt-4 flex gap-2">
          <textarea
            value={values[current.key]}
            onChange={(event) => setValues((prev) => ({ ...prev, [current.key]: event.target.value }))}
            placeholder={current.placeholder}
            rows={3}
            autoFocus
            className="min-h-[96px] flex-1 rounded-xl border border-slate-400 bg-white px-4 py-3 font-medium text-slate-950 outline-none ring-brand-red-500 placeholder:text-slate-600 focus:ring-2"
          />
          <button
            type="button"
            onClick={listen}
            className={`self-stretch rounded-xl px-4 transition ${listening ? 'bg-brand-red-600 text-white shadow-lg' : 'border border-slate-400 bg-white text-slate-800 hover:bg-slate-50'}`}
            aria-label={listening ? 'Stop voice input' : 'Answer by voice'}
          >
            {listening ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
          </button>
        </div>
        {listening ? <p className="mt-2 text-xs font-bold text-brand-red-700">Listening… speak your answer.</p> : null}
      </div>

      {error ? <div className="mt-4 rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm font-semibold text-red-900">{error}</div> : null}

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
        <button type="button" onClick={() => setStep((value) => Math.max(0, value - 1))} disabled={step === 0} className="rounded-xl border border-slate-400 px-4 py-2.5 text-sm font-bold text-slate-800 disabled:opacity-40">Back</button>
        <div className="flex gap-1.5">{fields.map((field, index) => <button key={field.key} type="button" onClick={() => setStep(index)} aria-label={`Question ${index + 1}`} className={`h-2.5 w-2.5 rounded-full transition-transform ${index === step ? 'scale-125 bg-brand-red-600' : values[field.key].trim() ? 'bg-emerald-500' : 'bg-slate-400'}`} />)}</div>
        {step < fields.length - 1 ? (
          <button type="button" onClick={() => setStep((value) => Math.min(fields.length - 1, value + 1))} className="rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-black text-white">Next</button>
        ) : (
          <button type="button" onClick={build} disabled={!canBuild || building} className="inline-flex items-center gap-2 rounded-xl bg-brand-red-600 px-5 py-2.5 text-sm font-black text-white disabled:opacity-50">
            {building ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            {building ? 'PARIS is building your site…' : 'Build My Website'}
          </button>
        )}
      </div>

      <style jsx>{`
        .paris-question {
          animation: paris-question-in 260ms ease-out;
        }
        @keyframes paris-question-in {
          from { opacity: 0; transform: translateX(14px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @media (prefers-reduced-motion: reduce) {
          .paris-question { animation: none; }
        }
      `}</style>
    </section>
  );
}
