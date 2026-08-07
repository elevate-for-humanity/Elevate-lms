'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Loader2, Mic, MicOff, Sparkles, Volume2 } from 'lucide-react';

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
  const recognitionRef = useRef<any>(null);
  const current = fields[step];

  const canBuild = useMemo(() => values.businessName.trim() && values.industry.trim() && values.services.trim(), [values]);

  const speakQuestion = () => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window) || !current) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(`I'm PARIS. ${current.question}`);
    utterance.rate = 0.97;
    window.speechSynthesis.speak(utterance);
  };

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
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) window.speechSynthesis.cancel();
  }, []);

  if (!current) return null;

  return (
    <section className="rounded-2xl border border-brand-red-200 bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-brand-red-600">Build with PARIS</p>
          <h2 className="mt-1 text-2xl font-black text-slate-950">Tell me what you want. I’ll build the first draft.</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">Speak or type. Your answers become the site brief, copy, services, SEO and starter design.</p>
        </div>
        <button type="button" onClick={speakQuestion} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50">
          <Volume2 className="h-4 w-4" /> Hear question
        </button>
      </div>

      <div className="mt-6 rounded-2xl bg-slate-50 p-5">
        <div className="flex items-center justify-between gap-3">
          <span className="text-xs font-black uppercase tracking-wider text-slate-500">Question {step + 1} of {fields.length}</span>
          <span className="text-xs font-bold text-slate-500">{current.label}</span>
        </div>
        <h3 className="mt-3 text-lg font-black text-slate-950">{current.question}</h3>
        <div className="mt-4 flex gap-2">
          <textarea
            value={values[current.key]}
            onChange={(event) => setValues((prev) => ({ ...prev, [current.key]: event.target.value }))}
            placeholder={current.placeholder}
            rows={3}
            className="min-h-[96px] flex-1 rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-950 outline-none ring-brand-red-500 focus:ring-2"
          />
          <button
            type="button"
            onClick={listen}
            className={`self-stretch rounded-xl px-4 ${listening ? 'bg-brand-red-600 text-white' : 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-50'}`}
            aria-label={listening ? 'Stop voice input' : 'Answer by voice'}
          >
            {listening ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {error ? <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-800">{error}</div> : null}

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
        <button type="button" onClick={() => setStep((value) => Math.max(0, value - 1))} disabled={step === 0} className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-bold text-slate-700 disabled:opacity-40">Back</button>
        <div className="flex gap-1.5">{fields.map((field, index) => <button key={field.key} type="button" onClick={() => setStep(index)} aria-label={`Question ${index + 1}`} className={`h-2.5 w-2.5 rounded-full ${index === step ? 'bg-brand-red-600' : values[field.key].trim() ? 'bg-emerald-500' : 'bg-slate-300'}`} />)}</div>
        {step < fields.length - 1 ? (
          <button type="button" onClick={() => setStep((value) => Math.min(fields.length - 1, value + 1))} className="rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-black text-white">Next</button>
        ) : (
          <button type="button" onClick={build} disabled={!canBuild || building} className="inline-flex items-center gap-2 rounded-xl bg-brand-red-600 px-5 py-2.5 text-sm font-black text-white disabled:opacity-50">
            {building ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            {building ? 'PARIS is building…' : 'Build My Website'}
          </button>
        )}
      </div>
    </section>
  );
}
