'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  BookOpenCheck,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  CircleAlert,
  Eye,
  FlaskConical,
  Headphones,
  Image as ImageIcon,
  Loader2,
  RotateCcw,
  Sparkles,
  Video,
} from 'lucide-react';
import TextToSpeech from '@/components/TextToSpeech';
import CommercialLessonExperience from '@/components/lms/CommercialLessonExperience';

type Interaction = {
  id: string;
  type: string;
  title: string;
  position: string;
  completed: boolean;
  score?: number;
  attempts: number;
  data: any;
};

type Payload = {
  success: boolean;
  source?: string;
  interactions?: Interaction[];
  flashcards?: Array<{ id?: string; front?: string; back?: string; tags?: string[] }>;
  narrationScript?: string | null;
  visualPrompt?: string | null;
  practicalTask?: any;
  interactiveVideo?: any;
  experience?: Record<string, unknown> | null;
};

export default function InteractiveLessonExperience({
  courseId,
  lessonSlug,
  lessonId,
}: {
  courseId: string;
  lessonSlug: string;
  lessonId: string;
}) {
  const [payload, setPayload] = useState<Payload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 12000);
    setLoading(true);
    fetch(
      `/api/learner/interactions?courseId=${encodeURIComponent(courseId)}&lessonId=${encodeURIComponent(lessonId)}`,
      { cache: 'no-store', signal: controller.signal },
    )
      .then(async (res) => {
        const body = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(body.error ?? `HTTP ${res.status}`);
        return body as Payload;
      })
      .then((body) => {
        if (active) {
          setPayload(body);
          setError('');
        }
      })
      .catch((err) => {
        if (active)
          setError(err instanceof Error ? err.message : 'Interactive activities unavailable');
      })
      .finally(() => {
        window.clearTimeout(timeout);
        if (active) setLoading(false);
      });
    return () => {
      active = false;
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [courseId, lessonId, lessonSlug]);

  const interactions = payload?.interactions ?? [];
  const flashcards = payload?.flashcards ?? [];
  const hasExperience =
    interactions.length > 0 ||
    flashcards.length > 0 ||
    !!payload?.narrationScript ||
    !!payload?.visualPrompt ||
    !!payload?.practicalTask ||
    !!payload?.interactiveVideo;

  if (loading)
    return (
      <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white p-5 text-sm font-semibold text-slate-600">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading interactive lesson activities…
      </div>
    );
  if (error || !hasExperience) return null;

  return (
    <section className="space-y-6" aria-label="Interactive learning activities">
      <div className="rounded-2xl border border-cyan-200 bg-gradient-to-r from-cyan-50 to-blue-50 p-5">
        <div className="flex items-center gap-2 text-cyan-900">
          <Sparkles className="h-5 w-5" />
          <h2 className="text-xl font-extrabold">Learn it. See it. Practice it.</h2>
        </div>
        <p className="mt-2 text-sm font-medium leading-6 text-slate-700">
          This lesson includes active practice, not just reading. Complete the activities below to
          apply the skill in a realistic workplace context.
        </p>
      </div>

      {payload?.narrationScript ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-3 flex items-center gap-2">
            <Headphones className="h-5 w-5 text-indigo-700" />
            <h3 className="font-extrabold">Listen to the lesson</h3>
          </div>
          <TextToSpeech text={payload.narrationScript} contentId={lessonId} />
        </div>
      ) : null}

      {payload?.visualPrompt ? <VisualBrief text={payload.visualPrompt} /> : null}
      {payload?.experience ? <CommercialLessonExperience experience={payload.experience} /> : null}
      {flashcards.length && !payload?.experience ? <Flashcards cards={flashcards} /> : null}

      {interactions.map((interaction) => {
        if (interaction.type === 'knowledge-check')
          return (
            <KnowledgeCheck
              key={interaction.id}
              interaction={interaction}
              courseId={courseId}
              lessonId={lessonId}
            />
          );
        if (
          interaction.type === 'scenario' ||
          interaction.type === 'decision-tree' ||
          interaction.type === 'case-study'
        )
          return (
            <Scenario
              key={interaction.id}
              interaction={interaction}
              courseId={courseId}
              lessonId={lessonId}
            />
          );
        if (interaction.type === 'click-to-reveal')
          return <HotspotActivity key={interaction.id} interaction={interaction} />;
        if (interaction.type === 'drag-drop' || interaction.type === 'matching')
          return <MatchingActivity key={interaction.id} interaction={interaction} />;
        if (interaction.type === 'practical' || interaction.type === 'simulation')
          return <PracticalActivity key={interaction.id} interaction={interaction} />;
        if (interaction.type === 'interactive-video')
          return <InteractiveVideo key={interaction.id} interaction={interaction} />;
        return null;
      })}

      {payload?.practicalTask && !interactions.some((i) => i.type === 'practical') ? (
        <PracticalActivity
          interaction={{
            id: `${lessonSlug}-practical`,
            type: 'practical',
            title: payload.practicalTask.title ?? 'Hands-on Practical',
            position: 'end',
            completed: false,
            attempts: 0,
            data: payload.practicalTask,
          }}
        />
      ) : null}
    </section>
  );
}

function VisualBrief({ text }: { text: string }) {
  return (
    <div className="rounded-2xl border border-violet-200 bg-violet-50 p-5">
      <div className="flex items-center gap-2 text-violet-900">
        <ImageIcon className="h-5 w-5" />
        <h3 className="font-extrabold">Visual focus</h3>
      </div>
      <p className="mt-2 text-sm font-medium leading-6 text-violet-950">{text}</p>
    </div>
  );
}

function Flashcards({
  cards,
}: {
  cards: Array<{ id?: string; front?: string; back?: string; tags?: string[] }>;
}) {
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const card = cards[index];
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-purple-700">
            Active recall
          </p>
          <h3 className="text-lg font-extrabold">Flashcards</h3>
        </div>
        <span className="text-sm font-bold text-slate-500">
          {index + 1} / {cards.length}
        </span>
      </div>
      <button
        type="button"
        onClick={() => setFlipped((v) => !v)}
        className="flex min-h-40 w-full items-center justify-center rounded-xl border-2 border-dashed border-purple-200 bg-purple-50 p-6 text-center"
      >
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-purple-600">
            {flipped ? 'Answer' : 'Question / term'}
          </p>
          <p className="mt-3 text-xl font-black text-slate-900">
            {flipped ? card.back : card.front}
          </p>
          <p className="mt-4 text-xs font-semibold text-slate-500">Click card to flip</p>
        </div>
      </button>
      <div className="mt-4 flex justify-between">
        <button
          type="button"
          onClick={() => {
            setIndex((i) => Math.max(0, i - 1));
            setFlipped(false);
          }}
          disabled={index === 0}
          className="rounded-lg border px-3 py-2 font-bold disabled:opacity-40"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => {
            setIndex((i) => Math.min(cards.length - 1, i + 1));
            setFlipped(false);
          }}
          disabled={index === cards.length - 1}
          className="rounded-lg border px-3 py-2 font-bold disabled:opacity-40"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

function KnowledgeCheck({
  interaction,
  courseId,
  lessonId,
}: {
  interaction: Interaction;
  courseId: string;
  lessonId: string;
}) {
  const questions = Array.isArray(interaction.data)
    ? interaction.data
    : Array.isArray(interaction.data?.questions)
      ? interaction.data.questions
      : [];
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [saveError, setSaveError] = useState('');
  if (!questions.length)
    return (
      <PlaceholderActivity
        icon={<BookOpenCheck className="h-5 w-5" />}
        title={interaction.title}
        text="Knowledge-check structure is enabled for this lesson. Questions will appear when the lesson is enriched or assessment bank is attached."
      />
    );
  const score = questions.reduce(
    (n: number, q: any, i: number) =>
      n + (answers[i] === Number(q.correct ?? q.correctAnswer) ? 1 : 0),
    0,
  );
  async function submit() {
    setSubmitted(true);
    setSaving(true);
    setSaveError('');
    try {
      const saved = await saveInteractionAttempt({
        courseId,
        lessonId,
        interaction,
        responses: questions.map((_: any, index: number) => answers[index]),
      });
      setResult(saved);
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : 'Progress could not be saved');
    } finally {
      setSaving(false);
    }
  }
  return (
    <div className="rounded-2xl border border-emerald-200 bg-white p-5 shadow-sm">
      <div className="mb-4">
        <p className="text-xs font-bold uppercase tracking-wider text-emerald-700">
          Check your understanding
        </p>
        <h3 className="text-lg font-extrabold">{interaction.title}</h3>
      </div>
      <div className="space-y-5">
        {questions.map((q: any, qi: number) => (
          <div key={qi} className="rounded-xl bg-slate-50 p-4">
            <p className="font-bold text-slate-900">
              {qi + 1}. {q.question}
            </p>
            <div className="mt-3 grid gap-2">
              {(q.options ?? []).map((option: string, oi: number) => {
                const correct = Number(q.correct ?? q.correctAnswer);
                const selected = answers[qi] === oi;
                const stateClass = submitted
                  ? oi === correct
                    ? 'border-emerald-500 bg-emerald-50'
                    : selected
                      ? 'border-red-400 bg-red-50'
                      : 'border-slate-200 bg-white'
                  : selected
                    ? 'border-cyan-500 bg-cyan-50'
                    : 'border-slate-200 bg-white';
                return (
                  <button
                    key={oi}
                    type="button"
                    disabled={submitted}
                    onClick={() => setAnswers((a) => ({ ...a, [qi]: oi }))}
                    className={`rounded-lg border p-3 text-left text-sm font-semibold ${stateClass}`}
                  >
                    {option}
                  </button>
                );
              })}
            </div>
            {submitted && q.explanation ? (
              <p className="mt-3 text-sm font-medium text-slate-600">{q.explanation}</p>
            ) : null}
          </div>
        ))}
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button
          type="button"
          disabled={Object.keys(answers).length < questions.length || submitted || saving}
          onClick={submit}
          className="rounded-lg bg-emerald-700 px-4 py-2 font-bold text-white disabled:opacity-40"
        >
          {saving ? 'Saving…' : 'Check answers'}
        </button>
        {submitted ? (
          <>
            <span className="font-black text-emerald-800">
              {score}/{questions.length} correct
            </span>
            <button
              type="button"
              onClick={() => {
                setAnswers({});
                setSubmitted(false);
                setResult(null);
                setSaveError('');
              }}
              className="rounded-lg border p-2"
              title="Retry"
            >
              <RotateCcw className="h-4 w-4" />
            </button>
          </>
        ) : null}
      </div>
      {result && !result.completed ? (
        <div className="mt-4 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm font-semibold text-amber-950">
          <p>{result.feedback?.reviewMessage ?? 'Review the missed objectives and retry.'}</p>
          {result.weak_objectives?.length ? (
            <ul className="mt-2 list-disc pl-5">
              {result.weak_objectives.map((objective: string) => (
                <li key={objective}>{objective}</li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}
      {result?.completed ? (
        <p className="mt-4 rounded-lg bg-emerald-100 p-3 text-sm font-bold text-emerald-900">
          Passed at {result.score}%. Attempt {result.attempts} is saved.
        </p>
      ) : null}
      {saveError ? <p className="mt-3 text-sm font-semibold text-red-700">{saveError}</p> : null}
    </div>
  );
}

function Scenario({
  interaction,
  courseId,
  lessonId,
}: {
  interaction: Interaction;
  courseId: string;
  lessonId: string;
}) {
  const data = interaction.data ?? {};
  const options = Array.isArray(data.options) ? data.options : [];
  const [choice, setChoice] = useState<number | null>(null);
  const [saveError, setSaveError] = useState('');
  async function choose(index: number) {
    setChoice(index);
    setSaveError('');
    if (!['scenario', 'case-study'].includes(interaction.type)) return;
    try {
      await saveInteractionAttempt({ courseId, lessonId, interaction, responses: [index] });
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : 'Progress could not be saved');
    }
  }
  return (
    <div className="rounded-2xl border-l-4 border-amber-500 bg-amber-50 p-5">
      <div className="flex items-center gap-2 text-amber-900">
        <CircleAlert className="h-5 w-5" />
        <h3 className="text-lg font-extrabold">{interaction.title}</h3>
      </div>
      {data.context ? (
        <p className="mt-3 text-sm font-semibold text-amber-950">{data.context}</p>
      ) : null}
      {data.situation ? (
        <p className="mt-2 text-sm font-medium leading-6 text-slate-800">{data.situation}</p>
      ) : null}
      <p className="mt-3 font-bold text-slate-900">{data.question ?? 'What would you do next?'}</p>
      {options.length ? (
        <div className="mt-3 grid gap-2">
          {options.map((option: any, index: number) => (
            <button
              key={index}
              type="button"
              onClick={() => choose(index)}
              className={`rounded-lg border p-3 text-left text-sm font-semibold ${choice === index ? 'border-amber-500 bg-white' : 'border-amber-200 bg-amber-100/50'}`}
            >
              {option.text}
            </button>
          ))}
        </div>
      ) : (
        <p className="mt-3 text-sm text-slate-600">
          Use the lesson procedure and safety rules to discuss the correct response with your
          instructor.
        </p>
      )}
      {choice !== null ? (
        <div
          className={`mt-3 rounded-lg p-3 text-sm font-semibold ${options[choice]?.isCorrect ? 'bg-emerald-100 text-emerald-900' : 'bg-red-100 text-red-900'}`}
        >
          {options[choice]?.feedback ??
            (options[choice]?.isCorrect
              ? 'Correct. Apply that reasoning on the job.'
              : 'Review the procedure and try again.')}
        </div>
      ) : null}
      {saveError ? <p className="mt-3 text-sm font-semibold text-red-700">{saveError}</p> : null}
    </div>
  );
}

async function saveInteractionAttempt(input: {
  courseId: string;
  lessonId: string;
  interaction: Interaction;
  responses: number[];
}) {
  const response = await fetch('/api/learner/interactions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      courseId: input.courseId,
      lessonId: input.lessonId,
      interactionId: input.interaction.id,
      interactionType: input.interaction.type,
      responses: input.responses,
    }),
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.error ?? 'Progress could not be saved');
  return body.attempt;
}

function HotspotActivity({ interaction }: { interaction: Interaction }) {
  const data = interaction.data;
  const hotspots = Array.isArray(data) ? data : Array.isArray(data?.hotspots) ? data.hotspots : [];
  const [revealed, setRevealed] = useState<Set<number>>(new Set());
  if (!hotspots.length)
    return (
      <PlaceholderActivity
        icon={<Eye className="h-5 w-5" />}
        title={interaction.title}
        text="Interactive diagram is enabled. Add an image and hotspots in the Course Builder to turn this into click-to-identify practice."
      />
    );
  return (
    <div className="rounded-2xl border border-blue-200 bg-white p-5">
      <div className="flex items-center gap-2">
        <Eye className="h-5 w-5 text-blue-700" />
        <h3 className="text-lg font-extrabold">{interaction.title}</h3>
      </div>
      {data.imageUrl ? (
        <div className="relative mt-4 overflow-hidden rounded-xl bg-slate-100">
          <img src={data.imageUrl} alt={data.title ?? interaction.title} className="w-full" />
          {hotspots.map((spot: any, i: number) => (
            <button
              key={i}
              type="button"
              onClick={() => setRevealed((prev) => new Set([...prev, i]))}
              aria-label={spot.label ?? `Hotspot ${i + 1}`}
              className="absolute h-8 w-8 rounded-full border-2 border-white bg-cyan-600/80 font-black text-white shadow"
              style={{ left: `${Number(spot.x ?? 10)}%`, top: `${Number(spot.y ?? 10)}%` }}
            >
              {i + 1}
            </button>
          ))}
        </div>
      ) : null}
      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        {hotspots.map((spot: any, i: number) => (
          <button
            key={i}
            type="button"
            onClick={() => setRevealed((prev) => new Set([...prev, i]))}
            className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-left"
          >
            <span className="font-bold">
              {revealed.has(i) ? (spot.label ?? `Area ${i + 1}`) : `Reveal area ${i + 1}`}
            </span>
            {revealed.has(i) ? (
              <p className="mt-1 text-sm text-slate-700">
                {spot.tooltip ?? spot.correctFeedback ?? ''}
              </p>
            ) : null}
          </button>
        ))}
      </div>
    </div>
  );
}

function MatchingActivity({ interaction }: { interaction: Interaction }) {
  const data = interaction.data ?? {};
  const items = Array.isArray(data.items) ? data.items : [];
  const targets = Array.isArray(data.targets) ? data.targets : [];
  const pairs = Array.isArray(data.pairs) ? data.pairs : [];
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [checked, setChecked] = useState(false);
  if (!items.length || !targets.length)
    return (
      <PlaceholderActivity
        icon={<FlaskConical className="h-5 w-5" />}
        title={interaction.title}
        text="Matching/drag-and-drop is enabled. Add items and targets in the Course Builder to create tool matching, categorization, sequencing or labeling practice."
      />
    );
  const correct = items.filter((item: any) =>
    pairs.some((pair: any) => pair.itemId === item.id && pair.targetId === answers[item.id]),
  ).length;
  return (
    <div className="rounded-2xl border border-fuchsia-200 bg-white p-5">
      <h3 className="text-lg font-extrabold">{interaction.title}</h3>
      <p className="mt-1 text-sm text-slate-600">Match each item to the correct target.</p>
      <div className="mt-4 space-y-3">
        {items.map((item: any) => (
          <div
            key={item.id}
            className="grid gap-2 rounded-lg bg-slate-50 p-3 sm:grid-cols-2 sm:items-center"
          >
            <span className="font-bold">{item.content ?? item.text ?? item.id}</span>
            <select
              value={answers[item.id] ?? ''}
              onChange={(e) => setAnswers((a) => ({ ...a, [item.id]: e.target.value }))}
              className="rounded-lg border bg-white px-3 py-2"
            >
              <option value="">Choose…</option>
              {targets.map((target: any) => (
                <option key={target.id} value={target.id}>
                  {target.name ?? target.label ?? target.id}
                </option>
              ))}
            </select>
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={() => setChecked(true)}
        disabled={Object.keys(answers).length < items.length}
        className="mt-4 rounded-lg bg-fuchsia-700 px-4 py-2 font-bold text-white disabled:opacity-40"
      >
        Check matches
      </button>
      {checked ? (
        <p className="mt-3 font-bold text-fuchsia-900">
          {correct}/{items.length} correct
        </p>
      ) : null}
    </div>
  );
}

function PracticalActivity({ interaction }: { interaction: Interaction }) {
  const data = interaction.data ?? {};
  const steps = Array.isArray(data.instructions)
    ? data.instructions
    : Array.isArray(data.steps)
      ? data.steps
      : [];
  const [done, setDone] = useState<Set<number>>(new Set());
  return (
    <div className="rounded-2xl border border-teal-300 bg-teal-50 p-5">
      <div className="flex items-center gap-2 text-teal-950">
        <FlaskConical className="h-5 w-5" />
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-teal-700">Hands-on skill</p>
          <h3 className="text-lg font-extrabold">{interaction.title}</h3>
        </div>
      </div>
      {data.description ? (
        <p className="mt-3 text-sm font-medium text-slate-700">{data.description}</p>
      ) : null}
      {steps.length ? (
        <ol className="mt-4 space-y-2">
          {steps.map((step: any, i: number) => (
            <li key={i}>
              <button
                type="button"
                onClick={() =>
                  setDone((prev) => {
                    const next = new Set(prev);
                    next.has(i) ? next.delete(i) : next.add(i);
                    return next;
                  })
                }
                className={`flex w-full items-start gap-3 rounded-lg border p-3 text-left ${done.has(i) ? 'border-emerald-400 bg-emerald-50' : 'border-teal-200 bg-white'}`}
              >
                <CheckCircle2
                  className={`mt-0.5 h-5 w-5 shrink-0 ${done.has(i) ? 'text-emerald-600' : 'text-slate-300'}`}
                />
                <span className="font-semibold">
                  {typeof step === 'string'
                    ? step
                    : (step.text ?? step.instruction ?? JSON.stringify(step))}
                </span>
              </button>
            </li>
          ))}
        </ol>
      ) : (
        <p className="mt-3 text-sm font-semibold text-slate-700">
          Complete the demonstrated procedure under instructor/host-shop supervision.
        </p>
      )}
      {data.evidence ? (
        <div className="mt-4 rounded-lg border border-teal-200 bg-white p-3">
          <p className="text-xs font-bold uppercase text-teal-700">Evidence required</p>
          <p className="mt-1 text-sm font-semibold text-slate-800">{data.evidence}</p>
        </div>
      ) : null}
      <p className="mt-3 text-xs font-semibold text-teal-900">
        Instructor or supervisor verification may be required before competency is credited.
      </p>
    </div>
  );
}

function InteractiveVideo({ interaction }: { interaction: Interaction }) {
  const data = interaction.data ?? {};
  if (!data.videoUrl)
    return (
      <PlaceholderActivity
        icon={<Video className="h-5 w-5" />}
        title={interaction.title}
        text="Interactive-video questions are enabled. Attach a lesson video and timestamped questions in the Course Builder."
      />
    );
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5">
      <h3 className="flex items-center gap-2 text-lg font-extrabold">
        <Video className="h-5 w-5 text-red-700" />
        {interaction.title}
      </h3>
      <video
        controls
        className="mt-4 aspect-video w-full rounded-xl bg-black"
        src={data.videoUrl}
      />
      <p className="mt-3 text-sm font-medium text-slate-600">
        Pause points and questions: {Array.isArray(data.questions) ? data.questions.length : 0}
      </p>
    </div>
  );
}

function PlaceholderActivity({
  icon,
  title,
  text,
}: {
  icon: React.ReactNode;
  title: string;
  text: string;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-5">
      <div className="flex items-center gap-2 text-slate-800">
        {icon}
        <h3 className="font-extrabold">{title}</h3>
      </div>
      <p className="mt-2 text-sm font-medium leading-6 text-slate-600">{text}</p>
    </div>
  );
}
