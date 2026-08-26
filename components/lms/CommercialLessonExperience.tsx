'use client';

import {
  BookOpen,
  CheckCircle2,
  FileText,
  Film,
  Gauge,
  Layers3,
  ListChecks,
  RefreshCw,
} from 'lucide-react';
import TextToSpeech from '@/components/TextToSpeech';

interface Props {
  experience?: Record<string, unknown> | null;
}

function asRecord(value: unknown): Record<string, any> | null {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, any>)
    : null;
}

function asArray(value: unknown): Array<Record<string, any>> {
  return Array.isArray(value)
    ? (value.filter((item) => item && typeof item === 'object') as Array<Record<string, any>>)
    : [];
}

export default function CommercialLessonExperience({ experience }: Props) {
  const exp = asRecord(experience);
  if (!exp) return null;

  const readingGuide = asRecord(exp.readingGuide);
  const flashcards = asArray(exp.flashcards);
  const quickClips = asArray(exp.quickClips);
  const exercises = asArray(exp.exercises);
  const resources = asArray(exp.resources);
  const glossary = asArray(exp.glossary);
  const remediation = asRecord(exp.remediation);
  const readiness = asRecord(exp.readiness);

  return (
    <div className="mt-8 space-y-8" aria-label="Lesson learning tools">
      {readingGuide && (
        <section className="rounded-2xl border border-slate-200 bg-slate-50 p-5 md:p-6">
          <div className="mb-4 flex items-center gap-2">
            <BookOpen className="h-5 w-5" aria-hidden="true" />
            <h2 className="text-xl font-bold text-slate-900">Reading Guide</h2>
          </div>
          <h3 className="font-semibold text-slate-900">
            {String(readingGuide.title ?? 'Lesson Reading')}
          </h3>
          <p className="mt-2 text-slate-700">{String(readingGuide.summary ?? '')}</p>
          <div className="mt-5 space-y-4">
            {asArray(readingGuide.sections).map((section, index) => (
              <article
                key={`${section.heading}-${index}`}
                className="rounded-xl bg-white p-4 shadow-sm"
              >
                <h4 className="font-semibold text-slate-900">
                  {String(section.heading ?? `Section ${index + 1}`)}
                </h4>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">
                  {String(section.body ?? '')}
                </p>
              </article>
            ))}
          </div>
          {Array.isArray(readingGuide.keyTakeaways) && readingGuide.keyTakeaways.length > 0 && (
            <div className="mt-5">
              <h4 className="font-semibold text-slate-900">Key Takeaways</h4>
              <ul className="mt-2 space-y-2 text-sm text-slate-700">
                {readingGuide.keyTakeaways.map((item: unknown, index: number) => (
                  <li key={index} className="flex gap-2">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                    {String(item)}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>
      )}

      {quickClips.length > 0 && (
        <section>
          <div className="mb-4 flex items-center gap-2">
            <Film className="h-5 w-5" aria-hidden="true" />
            <h2 className="text-xl font-bold text-slate-900">Quick Concept Clips</h2>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {quickClips.map((clip, index) => (
              <article
                key={String(clip.id ?? index)}
                className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
              >
                {typeof clip.videoUrl === 'string' && clip.videoUrl.trim() ? (
                  <video
                    className="aspect-video w-full bg-white"
                    controls
                    preload="metadata"
                    src={clip.videoUrl}
                  >
                    Your browser does not support embedded video.
                  </video>
                ) : (
                  <div className="flex aspect-video flex-col items-center justify-center bg-gradient-to-br from-amber-100 via-pink-100 to-cyan-100 px-6 text-center">
                    <Film className="h-10 w-10 text-pink-700" aria-hidden="true" />
                    <p className="mt-3 font-extrabold text-slate-900">Narrated concept clip</p>
                    <p className="mt-1 text-sm font-medium text-slate-700">
                      Play the instructor audio while the rendered video is prepared.
                    </p>
                  </div>
                )}
                <div className="p-4">
                  <h3 className="font-semibold text-slate-900">
                    {String(clip.title ?? `Concept Clip ${index + 1}`)}
                  </h3>
                  <p className="mt-1 text-sm text-slate-600">{String(clip.objective ?? '')}</p>
                  <div className="mt-3">
                    <TextToSpeech
                      text={String(clip.script ?? '')}
                      contentId={String(clip.id ?? index)}
                    />
                  </div>
                  <details className="mt-3 text-sm">
                    <summary className="cursor-pointer font-medium text-slate-800">
                      Transcript
                    </summary>
                    <p className="mt-2 whitespace-pre-wrap leading-6 text-slate-700">
                      {String(clip.script ?? '')}
                    </p>
                  </details>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      {flashcards.length > 0 && (
        <section>
          <div className="mb-4 flex items-center gap-2">
            <Layers3 className="h-5 w-5" aria-hidden="true" />
            <h2 className="text-xl font-bold text-slate-900">Flashcards</h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {flashcards.map((card, index) => (
              <details
                key={String(card.id ?? index)}
                className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
              >
                <summary className="cursor-pointer font-semibold text-slate-900">
                  {String(card.front ?? `Card ${index + 1}`)}
                </summary>
                <p className="mt-3 text-sm leading-6 text-slate-700">{String(card.back ?? '')}</p>
              </details>
            ))}
          </div>
        </section>
      )}

      {exercises.length > 0 && (
        <section className="rounded-2xl border border-slate-200 bg-white p-5 md:p-6">
          <div className="mb-4 flex items-center gap-2">
            <ListChecks className="h-5 w-5" aria-hidden="true" />
            <h2 className="text-xl font-bold text-slate-900">Learn by Doing</h2>
          </div>
          <div className="space-y-5">
            {exercises.map((exercise, index) => (
              <article key={String(exercise.id ?? index)}>
                <h3 className="font-semibold text-slate-900">
                  {String(exercise.title ?? `Exercise ${index + 1}`)}
                </h3>
                <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm text-slate-700">
                  {(Array.isArray(exercise.instructions) ? exercise.instructions : []).map(
                    (step: unknown, stepIndex: number) => (
                      <li key={stepIndex}>{String(step)}</li>
                    ),
                  )}
                </ol>
                <p className="mt-3 text-sm">
                  <span className="font-semibold">Deliverable:</span>{' '}
                  {String(exercise.expectedArtifact ?? '')}
                </p>
              </article>
            ))}
          </div>
        </section>
      )}

      {resources.length > 0 && (
        <section>
          <div className="mb-4 flex items-center gap-2">
            <FileText className="h-5 w-5" aria-hidden="true" />
            <h2 className="text-xl font-bold text-slate-900">Lesson Resources</h2>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {resources.map((resource, index) => (
              <details
                key={`${resource.title}-${index}`}
                className="rounded-xl border border-slate-200 bg-white p-4"
              >
                <summary className="cursor-pointer font-semibold text-slate-900">
                  {String(resource.title ?? `Resource ${index + 1}`)}
                </summary>
                <p className="mt-2 text-sm text-slate-600">{String(resource.description ?? '')}</p>
                <div className="mt-3 whitespace-pre-wrap rounded-lg bg-slate-50 p-3 text-sm leading-6 text-slate-700">
                  {String(resource.content ?? '')}
                </div>
              </details>
            ))}
          </div>
        </section>
      )}

      {glossary.length > 0 && (
        <section className="rounded-2xl border border-slate-200 bg-slate-50 p-5 md:p-6">
          <h2 className="text-xl font-bold text-slate-900">Key Terms</h2>
          <dl className="mt-4 grid gap-4 md:grid-cols-2">
            {glossary.map((entry, index) => (
              <div key={`${entry.term}-${index}`}>
                <dt className="font-semibold text-slate-900">{String(entry.term ?? '')}</dt>
                <dd className="mt-1 text-sm leading-6 text-slate-700">
                  {String(entry.definition ?? '')}
                </dd>
              </div>
            ))}
          </dl>
        </section>
      )}

      {(readiness || remediation) && (
        <section className="grid gap-4 md:grid-cols-2">
          {readiness && (
            <div className="rounded-2xl border border-slate-200 bg-white p-5">
              <div className="flex items-center gap-2">
                <Gauge className="h-5 w-5" aria-hidden="true" />
                <h2 className="font-bold text-slate-900">Readiness Evidence</h2>
              </div>
              <p className="mt-3 text-sm text-slate-700">
                Mastery target: <strong>{Number(readiness.masteryThreshold ?? 80)}%</strong>
              </p>
              <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-slate-700">
                {(Array.isArray(readiness.evidenceSignals) ? readiness.evidenceSignals : []).map(
                  (signal: unknown, index: number) => (
                    <li key={index}>{String(signal)}</li>
                  ),
                )}
              </ul>
            </div>
          )}
          {remediation && (
            <div className="rounded-2xl border border-slate-200 bg-white p-5">
              <div className="flex items-center gap-2">
                <RefreshCw className="h-5 w-5" aria-hidden="true" />
                <h2 className="font-bold text-slate-900">Targeted Review</h2>
              </div>
              <p className="mt-3 text-sm leading-6 text-slate-700">
                {String(remediation.reviewMessage ?? '')}
              </p>
              {asArray(remediation.targetedActions).map((action, index) => (
                <div key={index} className="mt-3 rounded-lg bg-slate-50 p-3 text-sm">
                  <div className="font-semibold text-slate-900">
                    {String(action.objective ?? 'Review objective')}
                  </div>
                  <div className="mt-1 text-slate-700">{String(action.action ?? '')}</div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
