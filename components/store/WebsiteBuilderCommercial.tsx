'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Bot,
  Check,
  CircleDollarSign,
  Globe2,
  Loader2,
  Mic,
  MicOff,
  Monitor,
  Play,
  Rocket,
  Send,
  Smartphone,
  Sparkles,
  Star,
} from 'lucide-react';
import { useNaturalVoice } from '@/components/voice/useNaturalVoice';

type BuilderState = {
  generated: boolean;
  businessName: string;
  industry: string;
  location: string;
  tone: string;
  heroHeadline: string;
  heroSubhead: string;
  primaryColor: string;
  secondaryColor: string;
  services: string[];
  imageKey: string;
  brightness: number;
  booking: boolean;
  financing: boolean;
  testimonials: boolean;
  mobilePreview: boolean;
  published: boolean;
};

type ParisResponse = {
  reply?: string;
  actions?: Partial<BuilderState>;
};

type RecognitionResultListLike = {
  length: number;
  [index: number]: { [index: number]: { transcript: string } };
};

type RecognitionLike = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((event: { results: RecognitionResultListLike }) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
};

type RecognitionConstructor = new () => RecognitionLike;

const INITIAL_SITE: BuilderState = {
  generated: false,
  businessName: 'Your Business',
  industry: 'Business website',
  location: 'Indianapolis, Indiana',
  tone: 'Modern',
  heroHeadline: 'Tell PARIS what you want to build.',
  heroSubhead:
    'Describe the business, services, style, and customer action. The preview will change from your instruction.',
  primaryColor: '#b91c1c',
  secondaryColor: '#ecfeff',
  services: ['Service one', 'Service two', 'Service three'],
  imageKey: 'general',
  brightness: 0.14,
  booking: false,
  financing: false,
  testimonials: false,
  mobilePreview: false,
  published: false,
};

const EXAMPLE_PROMPT =
  'Build a premium black-and-gold commerce website for MERI-GOLD-ROUND Multi-Zone Oil by Curvature Body Sculpting. Use the real product images and customer-care email curvaturebodysculpting@gmail.com. Include benefits, ingredients, quantity selection, cart, secure Stripe checkout, shipping, policies, SEO, mobile preview, and persuasive reasons to buy.';

const INTERVIEW_QUESTIONS = [
  'Are you building a new website or importing an existing one? If importing, include the current website URL.',
  'What is the business name, and what products or services do you sell?',
  'Who is the primary customer, and what is the most important action they should take?',
  'What visual style, colors, logo, and product images should the website use?',
  'Do you need products, pricing, inventory, shipping, booking, subscriptions, cart, or secure checkout?',
  'Which pages, policies, domain, SEO, analytics, and outside integrations must be included?',
];

const QUICK_COMMANDS = [
  'Make the hero brighter',
  'Add online booking',
  'Add financing and testimonials',
  'Show me the mobile version',
  'Make it feel more premium',
  'Publish it',
];

const IMAGE_BY_KEY: Record<string, string> = {
  dental: '/images/healthcare/video-thumbnail-dental-assistant.jpg',
  'home-health': '/images/pages/platform-page-12.webp',
  beauty: '/images/beauty/program-barber-training.jpg',
  training: '/images/pages/certifications-page-1.webp',
  general: '/images/pages/platform-page-12.webp',
};

const BUILD_STAGES = [
  'Understanding your request…',
  'Planning the page structure…',
  'Applying brand and conversion tools…',
  'Rendering the preview…',
];

function SitePreview({ site }: { site: BuilderState }) {
  const image = IMAGE_BY_KEY[site.imageKey] || IMAGE_BY_KEY.general;

  const preview = (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lg">
      <div className="flex items-center gap-2 border-b border-slate-200 bg-slate-50 px-3 py-2.5">
        <span className="h-2.5 w-2.5 rounded-full bg-rose-300" />
        <span className="h-2.5 w-2.5 rounded-full bg-amber-300" />
        <span className="h-2.5 w-2.5 rounded-full bg-emerald-300" />
        <div className="ml-2 flex min-w-0 flex-1 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-semibold text-slate-500">
          <Globe2 className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate">
            {site.published ? 'www.' : 'preview.elevate.site/'}
            {site.businessName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') ||
              'your-business'}
            {site.published ? '.com' : ''}
          </span>
        </div>
      </div>

      {!site.generated ? (
        <div className="grid min-h-[430px] place-items-center bg-gradient-to-br from-cyan-50 via-white to-rose-50 p-8 text-center">
          <div className="max-w-lg">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-red-100 text-brand-red-700">
              <Sparkles className="h-8 w-8" />
            </div>
            <p className="mt-5 text-xs font-black uppercase tracking-[0.2em] text-brand-red-700">
              Start with a conversation
            </p>
            <h3 className="mt-2 text-3xl font-black text-slate-950">No blank canvas.</h3>
            <p className="mt-3 text-sm font-semibold leading-6 text-slate-600">
              Type or speak what you want. PARIS will turn the instruction into visible changes in this preview.
            </p>
          </div>
        </div>
      ) : (
        <div className="bg-white">
          <section className="relative overflow-hidden" style={{ backgroundColor: site.secondaryColor }}>
            <div className="grid min-h-[300px] md:grid-cols-[1.02fr_0.98fr]">
              <div className="flex flex-col justify-center p-6 sm:p-8">
                <span
                  className="w-fit rounded-full border bg-white/90 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em]"
                  style={{ borderColor: `${site.primaryColor}33`, color: site.primaryColor }}
                >
                  {site.location} · {site.industry}
                </span>
                <h3 className="mt-4 text-3xl font-black leading-tight text-slate-950 sm:text-4xl">
                  {site.heroHeadline}
                </h3>
                <p className="mt-3 max-w-xl text-sm font-semibold leading-6 text-slate-700">
                  {site.heroSubhead}
                </p>
                <div className="mt-5 flex flex-wrap gap-2" aria-label="Generated website call to action preview">
                  <span
                    className="rounded-lg px-4 py-2.5 text-xs font-black text-white shadow-sm"
                    style={{ backgroundColor: site.primaryColor }}
                  >
                    {site.booking ? 'Book an appointment' : 'Get started'}
                  </span>
                  <span className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-xs font-black text-slate-800">
                    View services
                  </span>
                </div>
              </div>

              <div className="relative min-h-[240px] overflow-hidden bg-slate-100 md:min-h-[300px]">
                <Image
                  src={image}
                  alt={`${site.businessName} website hero preview`}
                  fill
                  sizes="(max-width: 768px) 100vw, 50vw"
                  className="object-cover object-center"
                />
                <div
                  className="absolute inset-0 bg-black transition-opacity duration-500"
                  style={{ opacity: site.brightness }}
                />
              </div>
            </div>
          </section>

          <section className="grid gap-3 p-5 sm:grid-cols-3">
            {site.services.slice(0, 3).map((service) => (
              <article key={service} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <div className="h-1.5 w-12 rounded-full" style={{ backgroundColor: site.primaryColor }} />
                <h4 className="mt-3 text-sm font-black text-slate-950">{service}</h4>
                <p className="mt-2 text-xs font-medium leading-5 text-slate-600">
                  Professional information and a clear next action for customers.
                </p>
              </article>
            ))}
          </section>

          {(site.booking || site.financing || site.testimonials) && (
            <section className="grid gap-3 border-t border-slate-100 p-5 sm:grid-cols-3">
              {site.booking && (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                  <Check className="h-5 w-5 text-emerald-700" />
                  <p className="mt-2 text-xs font-black uppercase tracking-wider text-emerald-800">Booking added</p>
                  <p className="mt-1 text-sm font-bold text-slate-950">Schedule online</p>
                </div>
              )}
              {site.financing && (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                  <CircleDollarSign className="h-5 w-5 text-amber-700" />
                  <p className="mt-2 text-xs font-black uppercase tracking-wider text-amber-800">Financing added</p>
                  <p className="mt-1 text-sm font-bold text-slate-950">Payment options section</p>
                </div>
              )}
              {site.testimonials && (
                <div className="rounded-xl border border-cyan-200 bg-cyan-50 p-4">
                  <Star className="h-5 w-5 text-cyan-700" />
                  <p className="mt-2 text-xs font-black uppercase tracking-wider text-cyan-800">Social proof added</p>
                  <p className="mt-1 text-sm font-bold text-slate-950">Testimonials section</p>
                </div>
              )}
            </section>
          )}

          {site.published && (
            <div className="border-t border-emerald-200 bg-emerald-50 px-5 py-4 text-center text-sm font-black text-emerald-900">
              Published preview · the demo has reached the final go-live step.
            </div>
          )}
        </div>
      )}
    </div>
  );

  return (
    <div className="flex min-h-[500px] items-start justify-center bg-slate-100 p-3 sm:p-5">
      <div className={`w-full transition-all duration-500 ${site.mobilePreview ? 'max-w-[390px]' : 'max-w-none'}`}>
        {site.mobilePreview && (
          <div className="mb-2 flex items-center justify-center gap-2 text-xs font-black text-slate-600">
            <Smartphone className="h-4 w-4" /> Mobile preview
          </div>
        )}
        {preview}
      </div>
    </div>
  );
}

export default function WebsiteBuilderCommercial() {
  const commercialAudioRef = useRef<HTMLAudioElement | null>(null);
  const recognitionRef = useRef<RecognitionLike | null>(null);
  const naturalVoice = useNaturalVoice();
  const [site, setSite] = useState<BuilderState>(INITIAL_SITE);
  const [command, setCommand] = useState('');
  const [reply, setReply] = useState(INTERVIEW_QUESTIONS[0]);
  const [interviewAnswers, setInterviewAnswers] = useState<string[]>([]);
  const [awaitingBuildApproval, setAwaitingBuildApproval] = useState(false);
  const [approvedBrief, setApprovedBrief] = useState('');
  const [history, setHistory] = useState<string[]>([]);
  const [working, setWorking] = useState(false);
  const [stage, setStage] = useState(0);
  const [listening, setListening] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!working) {
      setStage(0);
      return;
    }
    const timer = window.setInterval(
      () => setStage((current) => (current + 1) % BUILD_STAGES.length),
      700,
    );
    return () => window.clearInterval(timer);
  }, [working]);

  useEffect(() => {
    const handleStarter = (event: Event) => {
      const detail = (event as CustomEvent<{ prompt?: string }>).detail;
      if (detail?.prompt) setCommand(detail.prompt);
    };
    window.addEventListener('elevate:paris-demo', handleStarter);
    return () => window.removeEventListener('elevate:paris-demo', handleStarter);
  }, []);

  const status = useMemo(() => {
    if (working) return BUILD_STAGES[stage];
    if (site.published) return 'Published';
    if (site.generated) return 'Draft saved automatically';
    if (awaitingBuildApproval) return 'Build plan ready for approval';
    return `Interview ${Math.min(interviewAnswers.length + 1, INTERVIEW_QUESTIONS.length)} of ${INTERVIEW_QUESTIONS.length}`;
  }, [awaitingBuildApproval, interviewAnswers.length, site.generated, site.published, stage, working]);

  async function executeBuilderCommand(value: string) {
    const message = value.trim();
    if (!message || working) return;

    setWorking(true);
    setError('');
    setHistory((current) => [...current.slice(-3), message]);

    try {
      const response = await fetch('/api/store/website-builder/paris', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: 'builder', message, current: site }),
      });
      if (!response.ok) throw new Error(`PARIS returned ${response.status}`);
      const data = (await response.json()) as ParisResponse;
      if (data.actions) {
        setSite((current) => ({
          ...current,
          ...data.actions,
          services:
            Array.isArray(data.actions?.services) && data.actions.services.length
              ? data.actions.services
              : current.services,
        }));
      }
      const nextReply = data.reply || 'Done. The preview has been updated.';
      setReply(nextReply);
      if (voiceEnabled) {
        void naturalVoice.play(nextReply, { voice: 'coral', style: 'assistant', rate: 1.03 });
      }
    } catch (requestError) {
      console.error(requestError);
      setError('PARIS could not process that command. Try one of the quick commands below.');
    } finally {
      setWorking(false);
    }
  }

  async function runCommand(value: string) {
    const message = value.trim();
    if (!message || working) return;

    if (!site.generated) {
      if (awaitingBuildApproval) {
        if (!/^(build|build it|yes|approve|approved|go ahead|create it)/i.test(message)) {
          setReply('I have not generated anything yet. Type “Build it” to approve this plan, or tell me what to change in the plan.');
          return;
        }
        setAwaitingBuildApproval(false);
        setCommand('');
        await executeBuilderCommand(approvedBrief);
        return;
      }

      const nextAnswers = [...interviewAnswers, message];
      setInterviewAnswers(nextAnswers);
      setHistory((current) => [...current.slice(-3), message]);
      setCommand('');

      if (nextAnswers.length < INTERVIEW_QUESTIONS.length) {
        const nextQuestion = INTERVIEW_QUESTIONS[nextAnswers.length];
        setReply(nextQuestion);
        if (voiceEnabled) void naturalVoice.play(nextQuestion, { voice: 'coral', style: 'assistant', rate: 1.03 });
        return;
      }

      const brief = INTERVIEW_QUESTIONS.map((question, index) => `${question} Answer: ${nextAnswers[index]}`).join('\n');
      setApprovedBrief(brief);
      setAwaitingBuildApproval(true);
      const summary = 'I have the business, audience, design direction, commerce requirements, pages, policies, domain, SEO, and integrations. Review those answers above. Type “Build it” when you want me to generate the draft beside you.';
      setReply(summary);
      if (voiceEnabled) void naturalVoice.play(summary, { voice: 'coral', style: 'assistant', rate: 1.03 });
      return;
    }

    await executeBuilderCommand(message);
  }

  function startListening() {
    if (listening) {
      recognitionRef.current?.stop();
      return;
    }

    const speechWindow = window as Window & {
      SpeechRecognition?: RecognitionConstructor;
      webkitSpeechRecognition?: RecognitionConstructor;
    };
    const Recognition = speechWindow.SpeechRecognition || speechWindow.webkitSpeechRecognition;
    if (!Recognition) {
      setError('Voice input is not supported by this browser. Type the same instruction instead.');
      return;
    }

    const recognition = new Recognition();
    recognition.lang = 'en-US';
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.onresult = (event) => {
      const transcript = event.results[0]?.[0]?.transcript?.trim();
      if (transcript) {
        setCommand(transcript);
        void runCommand(transcript);
      }
    };
    recognition.onerror = () => {
      setListening(false);
      setError('I could not hear that clearly. Try again or type the instruction.');
    };
    recognition.onend = () => setListening(false);
    recognitionRef.current = recognition;
    setListening(true);
    recognition.start();
  }

  function toggleParisVoice() {
    if (voiceEnabled) naturalVoice.stop();
    setVoiceEnabled((current) => !current);
  }

  return (
    <section className="border-y border-cyan-100 bg-gradient-to-b from-cyan-50 via-white to-rose-50 px-4 py-14 text-slate-950 sm:py-16">
      <div className="mx-auto max-w-7xl">
        <div className="mb-7 grid gap-5 lg:grid-cols-[1fr_auto] lg:items-end">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.24em] text-brand-red-700">
              Live PARIS Website Builder Demo
            </p>
            <h2 className="mt-2 max-w-4xl text-3xl font-black tracking-tight sm:text-5xl">
              Tell PARIS what you want. Watch the website respond.
            </h2>
            <p className="mt-3 max-w-3xl text-sm font-semibold leading-7 text-slate-700 sm:text-base">
              PARIS interviews you first, summarizes the build plan, and waits for approval. Then watch the draft appear
              beside the conversation and keep talking or typing to change it.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => {
                setCommand(EXAMPLE_PROMPT);
                void executeBuilderCommand(EXAMPLE_PROMPT);
              }}
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-brand-red-700 px-5 font-black text-white shadow-sm hover:bg-brand-red-800"
            >
              <Play className="h-5 w-5" /> Preview Meri-Gold-Round store
            </button>
            <Link
              href="/apps/website-builder/start-trial"
              className="inline-flex min-h-12 items-center justify-center rounded-xl border-2 border-slate-900 bg-white px-5 font-black text-slate-950 hover:bg-slate-50"
            >
              Open the real builder
            </Link>
            <Link
              href="/apps/website-builder/import"
              className="inline-flex min-h-12 items-center justify-center rounded-xl border border-slate-300 bg-white px-5 font-black text-slate-800 hover:bg-slate-50"
            >
              Import an existing website
            </Link>
          </div>
        </div>

        <div className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-2xl shadow-slate-300/50">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-4 py-3 sm:px-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-red-700 text-white">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-black">Elevate Website Builder</p>
                <p className={`text-[11px] font-bold ${working ? 'text-cyan-700' : 'text-emerald-700'}`}>{status}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setSite((current) => ({ ...current, mobilePreview: !current.mobilePreview }))}
                className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-black hover:bg-slate-50"
              >
                {site.mobilePreview ? <Monitor className="h-4 w-4" /> : <Smartphone className="h-4 w-4" />}
                {site.mobilePreview ? 'Desktop' : 'Mobile'}
              </button>
              <button
                type="button"
                onClick={() => void runCommand('Publish it')}
                className="inline-flex items-center gap-2 rounded-lg bg-brand-red-700 px-3 py-2 text-xs font-black text-white hover:bg-brand-red-800"
              >
                <Rocket className="h-4 w-4" /> Publish
              </button>
            </div>
          </div>

          <div className="grid lg:grid-cols-[minmax(0,1fr)_330px]">
            <SitePreview site={site} />

            <aside className="border-t border-slate-200 bg-white p-4 sm:p-5 lg:border-l lg:border-t-0">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-100 text-cyan-800">
                    <Bot className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-black">PARIS</p>
                    <p className="text-[11px] font-semibold text-slate-500">Website interview + live edits</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={toggleParisVoice}
                  className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-50"
                  aria-label={voiceEnabled ? 'Mute PARIS natural voice' : 'Enable PARIS natural voice'}
                >
                  {voiceEnabled ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
                </button>
              </div>

              <div className="mt-4 min-h-[92px] rounded-2xl bg-slate-100 p-4 text-sm font-semibold leading-6 text-slate-700">
                {working ? (
                  <span className="flex items-center gap-2 font-black text-cyan-800">
                    <Loader2 className="h-4 w-4 animate-spin" /> {BUILD_STAGES[stage]}
                  </span>
                ) : naturalVoice.isLoading ? (
                  <span className="flex items-center gap-2 font-black text-cyan-800">
                    <Loader2 className="h-4 w-4 animate-spin" /> Preparing PARIS natural voice…
                  </span>
                ) : (
                  reply
                )}
              </div>

              <label
                className="mt-4 block text-xs font-black uppercase tracking-wider text-slate-500"
                htmlFor="paris-builder-command"
              >
                Tell PARIS what to build or change
              </label>
              <textarea
                id="paris-builder-command"
                value={command}
                onChange={(event) => setCommand(event.target.value)}
                rows={5}
                className="mt-2 w-full resize-none rounded-xl border border-slate-300 bg-white p-3 text-sm font-semibold leading-6 text-slate-800 outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
                placeholder={awaitingBuildApproval ? 'Type “Build it” to approve, or describe a change.' : 'Answer PARIS in your own words.'}
              />

              <div className="mt-3 grid grid-cols-[auto_1fr] gap-2">
                <button
                  type="button"
                  onClick={startListening}
                  className={`flex min-h-11 items-center justify-center gap-2 rounded-xl border px-4 text-sm font-black ${
                    listening
                      ? 'border-brand-red-300 bg-brand-red-50 text-brand-red-800'
                      : 'border-slate-300 bg-white text-slate-800 hover:bg-slate-50'
                  }`}
                >
                  {listening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                  {listening ? 'Listening…' : 'Speak'}
                </button>
                <button
                  type="button"
                  disabled={working || !command.trim()}
                  onClick={() => void runCommand(command)}
                  className="flex min-h-11 items-center justify-center gap-2 rounded-xl bg-brand-red-700 px-4 text-sm font-black text-white hover:bg-brand-red-800 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {working ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  Send to PARIS
                </button>
              </div>

              {(error || naturalVoice.error) && (
                <p className="mt-3 rounded-xl bg-amber-50 p-3 text-xs font-bold leading-5 text-amber-900">
                  {error || naturalVoice.error}
                </p>
              )}

              <div className="mt-5">
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">Try a real change</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {QUICK_COMMANDS.map((quick) => (
                    <button
                      key={quick}
                      type="button"
                      disabled={working}
                      onClick={() => {
                        setCommand(quick);
                        void runCommand(quick);
                      }}
                      className="rounded-full border border-slate-200 bg-white px-3 py-2 text-left text-[11px] font-bold text-slate-700 hover:border-cyan-300 hover:bg-cyan-50 disabled:opacity-50"
                    >
                      {quick}
                    </button>
                  ))}
                </div>
              </div>

              {history.length > 0 && (
                <div className="mt-5 border-t border-slate-100 pt-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">Recent instructions</p>
                  <div className="mt-2 space-y-2">
                    {history.slice(-3).reverse().map((item, index) => (
                      <div
                        key={`${item}-${index}`}
                        className="rounded-lg bg-slate-50 px-3 py-2 text-[11px] font-semibold leading-5 text-slate-600"
                      >
                        “{item}”
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </aside>
          </div>
        </div>

        <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="max-w-3xl text-xs font-bold leading-5 text-slate-600">
            This is a public interactive product demonstration. It applies PARIS-generated demo actions to the preview;
            the authenticated Website Builder is the production workspace that saves and publishes customer sites.
          </p>
          <button
            type="button"
            onClick={() => {
              const audio = commercialAudioRef.current;
              if (!audio) return;
              if (audio.paused) void audio.play();
              else audio.pause();
            }}
            className="shrink-0 rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-black text-slate-800 hover:bg-slate-50"
          >
            Play commercial narration
          </button>
        </div>

        <audio ref={commercialAudioRef} preload="none" src="/api/store/website-builder/commercial-voice" />
      </div>
    </section>
  );
}
