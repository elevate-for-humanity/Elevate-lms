'use client';

import Link from 'next/link';
import { useState } from 'react';
import { ArrowRight, Bot, CheckCircle2, Loader2, Send, Sparkles } from 'lucide-react';

type Recommendation = {
  name: string;
  reason: string;
  href: string;
};

type ParisResponse = {
  reply?: string;
  recommendation?: Recommendation;
  starterPrompt?: string;
  ready?: boolean;
};

type Message = {
  role: 'user' | 'paris';
  text: string;
};

const STARTERS = [
  'I need a website for my dental office with booking and financing.',
  'I want to create and sell training online.',
  'I need help finding and managing grants.',
  'I run workforce programs and need one system for operations.',
];

export function GuidedProductInterview() {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'paris',
      text: 'Tell me what you are trying to accomplish in plain English. You do not need to know the product names. I will recommend the smallest starting stack and explain why.',
    },
  ]);
  const [recommendation, setRecommendation] = useState<Recommendation | null>(null);
  const [starterPrompt, setStarterPrompt] = useState('');
  const [working, setWorking] = useState(false);
  const [error, setError] = useState('');

  async function askParis(value: string) {
    const message = value.trim();
    if (!message || working) return;

    setMessages((current) => [...current, { role: 'user', text: message }]);
    setInput('');
    setWorking(true);
    setError('');

    try {
      const response = await fetch('/api/store/website-builder/paris', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: 'interview', message }),
      });
      if (!response.ok) throw new Error(`PARIS returned ${response.status}`);
      const data = (await response.json()) as ParisResponse;
      const reply = data.reply || 'Tell me a little more about the outcome you want.';
      setMessages((current) => [...current, { role: 'paris', text: reply }]);
      setRecommendation(data.recommendation || null);
      setStarterPrompt(data.starterPrompt || (data.recommendation?.name === 'AI Website Builder' ? message : ''));
    } catch (requestError) {
      console.error(requestError);
      setError('PARIS could not complete the interview just now. Try one of the example requests below.');
    } finally {
      setWorking(false);
    }
  }

  function sendToDemo() {
    const prompt = starterPrompt || messages.findLast((message) => message.role === 'user')?.text || '';
    if (!prompt) return;
    window.dispatchEvent(new CustomEvent('elevate:paris-demo', { detail: { prompt } }));
    document.getElementById('website-builder-commercial')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  return (
    <section className="bg-white py-16" id="guided-setup">
      <div className="mx-auto max-w-6xl px-5">
        <div className="mx-auto max-w-3xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full bg-brand-red-50 px-4 py-2 text-sm font-black text-brand-red-700">
            <Sparkles className="h-4 w-4" /> PARIS guided setup
          </span>
          <h2 className="mt-4 text-3xl font-black text-slate-950 sm:text-5xl">Tell PARIS what you want to accomplish.</h2>
          <p className="mt-4 text-lg leading-8 text-slate-600">
            No product-name quiz. No technical settings. Describe the outcome and PARIS will recommend the simplest starting stack, ask for clarification when needed, and carry website requests into the builder demo.
          </p>
        </div>

        <div className="mt-10 grid gap-8 lg:grid-cols-[1.08fr_0.92fr]">
          <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl shadow-slate-200/50">
            <div className="flex items-center gap-3 border-b border-slate-200 bg-cyan-50 px-5 py-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-700 text-white">
                <Bot className="h-5 w-5" />
              </div>
              <div>
                <p className="font-black text-slate-950">PARIS</p>
                <p className="text-xs font-semibold text-slate-600">Product interview in plain English</p>
              </div>
            </div>

            <div className="max-h-[420px] min-h-[320px] space-y-4 overflow-y-auto bg-slate-50 p-5">
              {messages.map((message, index) => (
                <div
                  key={`${message.role}-${index}`}
                  className={`max-w-[88%] rounded-2xl px-4 py-3 text-sm font-semibold leading-6 ${
                    message.role === 'paris'
                      ? 'mr-auto border border-cyan-100 bg-white text-slate-800 shadow-sm'
                      : 'ml-auto bg-brand-red-700 text-white'
                  }`}
                >
                  {message.text}
                </div>
              ))}
              {working && (
                <div className="mr-auto flex w-fit items-center gap-2 rounded-2xl border border-cyan-100 bg-white px-4 py-3 text-sm font-black text-cyan-800 shadow-sm">
                  <Loader2 className="h-4 w-4 animate-spin" /> PARIS is thinking…
                </div>
              )}
            </div>

            <div className="border-t border-slate-200 bg-white p-4">
              <textarea
                value={input}
                onChange={(event) => setInput(event.target.value)}
                rows={3}
                placeholder="Example: I need a luxury dental website with online booking, financing, implants, Invisalign, testimonials, and a strong mobile version."
                className="w-full resize-none rounded-xl border border-slate-300 p-3 text-sm font-semibold leading-6 text-slate-800 outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
                onKeyDown={(event) => {
                  if (event.key === 'Enter' && !event.shiftKey) {
                    event.preventDefault();
                    void askParis(input);
                  }
                }}
              />
              <div className="mt-3 flex justify-end">
                <button
                  type="button"
                  disabled={working || !input.trim()}
                  onClick={() => void askParis(input)}
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-brand-red-700 px-5 text-sm font-black text-white hover:bg-brand-red-800 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {working ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  Ask PARIS
                </button>
              </div>
              {error && <p className="mt-3 rounded-xl bg-amber-50 p-3 text-xs font-bold leading-5 text-amber-900">{error}</p>}
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-slate-950 p-6 text-white shadow-xl md:p-8">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-cyan-300">Your recommended starting point</p>

            {recommendation ? (
              <div className="mt-5">
                <div className="rounded-2xl border border-slate-700 bg-slate-900 p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="text-2xl font-black">{recommendation.name}</h3>
                      <p className="mt-2 text-sm font-semibold leading-6 text-slate-200">{recommendation.reason}</p>
                    </div>
                    <CheckCircle2 className="h-6 w-6 shrink-0 text-emerald-400" />
                  </div>
                  <Link href={recommendation.href} className="mt-5 inline-flex items-center gap-2 text-sm font-black text-cyan-200 hover:text-white">
                    Open product <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>

                {recommendation.name.toLowerCase().includes('website') && (
                  <button
                    type="button"
                    onClick={sendToDemo}
                    className="mt-4 flex w-full items-center justify-between rounded-xl bg-white px-5 py-4 text-left font-black text-slate-950 hover:bg-cyan-50"
                  >
                    Show my request in the live builder demo
                    <ArrowRight className="h-5 w-5" />
                  </button>
                )}

                <Link
                  href="/store/trial"
                  className="mt-3 flex w-full items-center justify-between rounded-xl border border-slate-600 px-5 py-4 font-black text-white hover:bg-slate-900"
                >
                  Start guided trial <ArrowRight className="h-5 w-5" />
                </Link>
              </div>
            ) : (
              <div className="mt-5 rounded-2xl border border-slate-700 bg-slate-900 p-5 text-sm font-semibold leading-6 text-slate-200">
                PARIS will put the recommendation here after you describe the outcome. If the request is a website, the same description can be sent directly to the interactive Website Builder demo above.
              </div>
            )}

            <div className="mt-7 border-t border-slate-700 pt-6">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">Try an example</p>
              <div className="mt-3 space-y-2">
                {STARTERS.map((starter) => (
                  <button
                    key={starter}
                    type="button"
                    disabled={working}
                    onClick={() => {
                      setInput(starter);
                      void askParis(starter);
                    }}
                    className="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-left text-xs font-bold leading-5 text-slate-200 hover:border-cyan-600 hover:bg-slate-800 disabled:opacity-50"
                  >
                    {starter}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
