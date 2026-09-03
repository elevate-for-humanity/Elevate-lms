'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Play, Sparkles } from 'lucide-react';

const CONTENT_TYPES = ['Training Video', 'Voiceover', 'Course Images', 'Instructor Script'] as const;
const STYLES = ['Professional', 'Friendly', 'Clinical'] as const;

type ContentType = (typeof CONTENT_TYPES)[number];
type InstructorStyle = (typeof STYLES)[number];

function buildPreview(topic: string, type: ContentType, style: InstructorStyle) {
  const subject = topic.trim() || 'Introduction to HIPAA Compliance for Healthcare Workers';
  const tone = style === 'Clinical' ? 'clear, precise, and evidence-focused' : style === 'Friendly' ? 'welcoming, practical, and conversational' : 'polished, structured, and direct';
  const format = type === 'Voiceover' ? 'voiceover narration' : type === 'Course Images' ? 'visual storyboard' : type === 'Instructor Script' ? 'instructor script' : 'training-video script';
  return `Preview ${format} for “${subject}.” The ${style.toLowerCase()} delivery is ${tone}. Opening: Welcome to this training on ${subject}. We will explain the core requirements, show practical examples, and finish with a short knowledge check so learners can apply the material correctly.`;
}

export default function AIStudioDemoClient() {
  const [topic, setTopic] = useState('Introduction to HIPAA Compliance for Healthcare Workers');
  const [contentType, setContentType] = useState<ContentType>('Training Video');
  const [style, setStyle] = useState<InstructorStyle>('Professional');
  const [generated, setGenerated] = useState(false);
  const preview = useMemo(() => buildPreview(topic, contentType, style), [topic, contentType, style]);

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10">
      <div className="mx-auto max-w-5xl">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <Link href="/store/ai-studio" className="inline-flex items-center gap-2 font-bold text-brand-blue-700">
            <ArrowLeft className="h-4 w-4" /> Back to AI Studio
          </Link>
          <span className="rounded-full bg-brand-blue-100 px-3 py-1 text-xs font-black uppercase tracking-wide text-brand-blue-800">Interactive product demo</span>
        </div>

        <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl">
          <div className="border-b border-slate-200 bg-slate-900 px-6 py-6 text-white">
            <div className="flex items-center gap-3"><Sparkles className="h-6 w-6" /><h1 className="text-2xl font-black">AI Studio Demo</h1></div>
            <p className="mt-2 text-slate-200">Change the topic, content type, and instructor style, then generate a live preview.</p>
          </div>

          <div className="grid gap-8 p-6 lg:grid-cols-2 lg:p-8">
            <div>
              <label htmlFor="demo-topic" className="mb-2 block font-black text-slate-900">Training topic</label>
              <textarea id="demo-topic" value={topic} onChange={(event) => { setTopic(event.target.value); setGenerated(false); }} className="h-32 w-full rounded-xl border border-slate-300 p-4 text-slate-900 focus:border-brand-blue-500 focus:outline-none focus:ring-2 focus:ring-brand-blue-200" />

              <fieldset className="mt-6"><legend className="mb-3 font-black text-slate-900">Content type</legend><div className="grid grid-cols-2 gap-3">
                {CONTENT_TYPES.map((type) => <button type="button" key={type} onClick={() => { setContentType(type); setGenerated(false); }} aria-pressed={contentType === type} className={`rounded-xl border p-3 text-sm font-bold ${contentType === type ? 'border-brand-blue-600 bg-brand-blue-50 text-brand-blue-800' : 'border-slate-200 text-slate-700 hover:border-brand-blue-300'}`}>{type}</button>)}
              </div></fieldset>

              <fieldset className="mt-6"><legend className="mb-3 font-black text-slate-900">Instructor style</legend><div className="grid grid-cols-3 gap-3">
                {STYLES.map((option) => <button type="button" key={option} onClick={() => { setStyle(option); setGenerated(false); }} aria-pressed={style === option} className={`rounded-xl border p-3 text-sm font-bold ${style === option ? 'border-brand-blue-600 bg-brand-blue-50 text-brand-blue-800' : 'border-slate-200 text-slate-700 hover:border-brand-blue-300'}`}>{option}</button>)}
              </div></fieldset>

              <button type="button" onClick={() => setGenerated(true)} className="mt-7 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-brand-blue-700 px-6 py-4 font-black text-white hover:bg-brand-blue-800"><Play className="h-5 w-5" /> Generate preview</button>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6" aria-live="polite">
              <p className="text-xs font-black uppercase tracking-wider text-brand-blue-700">Live preview</p>
              <h2 className="mt-2 text-xl font-black text-slate-950">{contentType} · {style}</h2>
              {generated ? <><p className="mt-5 leading-7 text-slate-800">{preview}</p><div className="mt-6 rounded-xl bg-emerald-50 p-4 text-sm font-bold text-emerald-900">Preview generated from your current selections. This demo does not charge or publish content.</div></> : <p className="mt-5 text-slate-600">Choose your settings and select Generate preview to see the output change.</p>}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
