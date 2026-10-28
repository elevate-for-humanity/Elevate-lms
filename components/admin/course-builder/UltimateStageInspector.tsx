'use client';

import ProgressiveLessonVideo from './ProgressiveLessonVideo';
import LessonVideoReview from './LessonVideoReview';
import {createPortal} from 'react-dom';
import {CourseWorkspaceContext} from './CourseWorkspaceContext';
import type { ReactNode } from 'react';
import AssessmentPreview from './AssessmentPreview';
import { checkpointNeedsRecheck } from '@/lib/ultimate-course-builder/core/job-observation.mjs';
import { useContext, useEffect, useRef, useState } from 'react';
import {
  ULTIMATE_BUILD_STEPS,
  type UltimateBuildStep,
} from '@/lib/ultimate-course-builder/core/types';

type Step = { step: string; state: string; findings?: unknown[]; completed_at?: string | null };
type Lesson = {
  id: string;
  lesson_key: string;
  title?: string;
  status: string;
  saved?: boolean;
  preview?: any;
  canonicalLessonId?: string;
  hasCheckpoint?: boolean;
  ultimate_lesson_steps?: Step[];
};
type Check = { name: string; passed: boolean; message: string };

function findingText(value: unknown): string {
  if (typeof value === 'string') return value;
  if (value && typeof value === 'object' && 'message' in value && typeof value.message === 'string')
    return value.message;
  return '';
}
function SavedVideo({
  lesson,
  diagnostic,
  preferApproved = true,
  buildId,
}: {
  lesson: Lesson;
  diagnostic: any;
  preferApproved?: boolean;
  buildId: string;
}) {
  const player = useRef<HTMLVideoElement>(null);
  const [needsPlay, setNeedsPlay] = useState(false);
  const [playbackError, setPlaybackError] = useState('');
  diagnostic = diagnostic ?? lesson.preview;
  const approvedVideoUrl = preferApproved ? lesson.preview?.approvedVideoUrl : null;
  const videoUrl = approvedVideoUrl ?? diagnostic?.videoUrl;
  useEffect(() => {
    setNeedsPlay(false);
    setPlaybackError('');
    const video = player.current;
    if (!video || !videoUrl) return;
    let cancelled = false;
    void video.play().catch(() => {
      if (!cancelled) setNeedsPlay(true);
    });
    return () => {
      cancelled = true;
    };
  }, [videoUrl]);
  if (!videoUrl && lesson.saved && lesson.ultimate_lesson_steps?.some(step => step.step === 'lesson_film_render' && step.state === 'running')) return <ProgressiveLessonVideo buildId={buildId} lessonId={lesson.id} title={lesson.title} />;
  if (!diagnostic) return null;
  return videoUrl ? (
    <div>
      <p className="mb-2 font-bold">
        {approvedVideoUrl
          ? 'Owner-approved published lesson'
          : `Latest saved video · ${diagnostic.mediaApproved ? 'Media QA passed' : 'Draft preview — media QA has not passed'}`}
      </p>
      {approvedVideoUrl ? (
        <p className="mb-2">
          Approved render version {lesson.preview.approvedVersion}. Checkpoint findings below
          describe the separate draft.
        </p>
      ) : (
        <>
          {diagnostic.previousRender && (
            <p className="mb-2">Previous saved draft while the updated video is being produced.</p>
          )}
          {diagnostic.historicalVersion && (
            <p className="mb-2">Saved render version {diagnostic.historicalVersion}.</p>
          )}
        </>
      )}
      <video
        ref={player}
        controls
        playsInline
        preload="auto"
        className="aspect-video max-h-[45dvh] w-full rounded-lg bg-black object-contain sm:max-h-none"
        src={videoUrl}
        onPlaying={() => {
          setNeedsPlay(false);
          setPlaybackError('');
        }}
        onError={() =>
          setPlaybackError(
            'The saved video could not load. Refresh the preview to renew access, then try playback again.',
          )
        }
        aria-label={`${lesson.title} video preview`}
      />
      {needsPlay && (
        <button
          type="button"
          className="mt-2 rounded-lg bg-cyan-500 px-4 py-3 font-bold text-slate-950"
          onClick={() => {
            void player.current
              ?.play()
              .catch(() =>
                setPlaybackError(
                  'Playback could not start. Use the video controls or refresh the preview.',
                ),
              );
          }}
        >
          Play lesson
        </button>
      )}
      {playbackError && (
        <p role="alert" className="mt-2 text-amber-200">
          {playbackError}
        </p>
      )}
    </div>
  ) : (
    <p>The video is still being produced. You can review the saved instruction below now.</p>
  );
}

export default function UltimateStageInspector({
  buildId,
  updatedAt,
  operations,
}: {
  buildId: string;
  updatedAt?: string | null;
  operations?: ReactNode;
}) {
  const workspace = useContext(CourseWorkspaceContext);
  const [selected, setSelected] = useState<UltimateBuildStep | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [selectedLesson, setSelectedLesson] = useState('');
  const [followActive, setFollowActive] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);
  const [checks, setChecks] = useState<Check[]>([]);
  const [checking, setChecking] = useState(false);
  const [healthError, setHealthError] = useState('');
  const requestToken = useRef(0);
  const appliedRequestedLesson=useRef('');
  const [learnerView,setLearnerView]=useState(false);
  const [preferApproved, setPreferApproved] = useState(true);
  const [actionBusy, setActionBusy] = useState('');
  const [actionResults, setActionResults] = useState<
    Record<string, { error?: string; message?: string; diagnostic?: any }>
  >({});

  useEffect(() => {
    setSelected(null);
    setLessons([]);
    setSelectedLesson('');
    setFollowActive(true);
    setError('');
    setActionResults({});
  }, [buildId]);

  useEffect(() => {
    const token = ++requestToken.current;
    const controller = new AbortController();
    setLoading(true);
    setError('');
    void fetch(
      '/api/admin/ultimate-course-builder?view=checkpoints&buildId=' + encodeURIComponent(buildId),
      {
        cache: 'no-store',
        signal: AbortSignal.any([controller.signal, AbortSignal.timeout(20000)]),
      },
    )
      .then(async (response) => {
        const payload = await response.json().catch(() => ({}));
        if (!response.ok)
          throw new Error(payload.error || 'Unable to load saved lesson checkpoints');
        if (token !== requestToken.current) return;
        const competencies = payload.build?.profile?.competencies ?? [];
        setLessons((previous) =>
          competencies.map((c: any, index: number) => {
            const lesson = (payload.build?.ultimate_lesson_builds ?? []).find(
              (row: any) => row.competency_id === c.id,
            );
            const lastPreview = previous.find((row) => row.lesson_key === c.id)?.preview;
            const preview =
              lesson?.preview?.videoUrl || !lastPreview?.videoUrl
                ? lesson?.preview
                : {
                    ...lesson?.preview,
                    videoUrl: lastPreview.videoUrl,
                    mediaApproved: false,
                    previousRender: true,
                  };
            return {
              ...(lesson ?? { id: c.id, status: 'planned' }),
              preview,
              lesson_key: c.id,
              saved: Boolean(lesson && lesson.hasCheckpoint !== false),
              title: c.title ?? c.description ?? `Lesson ${index + 1}`,
            };
          }),
        );
        const activeLesson = (payload.build?.ultimate_lesson_builds ?? []).find(
          (row: any) => row.status === 'running',
        );
        const firstSaved = (payload.build?.ultimate_lesson_builds ?? [])[0];
        setSelectedLesson(
          (previous) =>
            (followActive && activeLesson?.competency_id) ||
            previous ||
            firstSaved?.competency_id ||
            competencies[0]?.id ||
            '',
        );
      })
      .catch((reason) => {
        if (!controller.signal.aborted && token === requestToken.current)
          setError(
            reason instanceof Error ? reason.message : 'Unable to load saved lesson checkpoints',
          );
      })
      .finally(() => {
        if (!controller.signal.aborted && token === requestToken.current) setLoading(false);
      });
    return () => controller.abort();
  }, [buildId, selected, updatedAt, retry, followActive]);

  useEffect(() => {
    const timer = window.setInterval(() => setRetry((value) => value + 1), 15000);
    return () => window.clearInterval(timer);
  }, [buildId]);

  useEffect(() => {
    const lesson=lessons.find(row=>row.lesson_key===selectedLesson);
    if(lesson)workspace.onSelection?.({lessonKey:lesson.lesson_key,lessonId:lesson.id,
      canonicalLessonId:lesson.canonicalLessonId,title:lesson.title});
  },[selectedLesson,lessons,workspace.onSelection]);

  useEffect(()=>{
    if(!selectedLesson)return;
    const controller=new AbortController();
    const lesson=lessons.find(row=>row.lesson_key===selectedLesson);
    if(!lesson?.saved || lesson.preview?.videoUrl)return;
    void fetch('/api/admin/ultimate-course-builder?view=checkpoints&buildId='+encodeURIComponent(buildId)+'&lessonId='+encodeURIComponent(lesson.id),
      {cache:'no-store',signal:controller.signal})
      .then(async response=>{const payload=await response.json();if(!response.ok)throw Error(payload.error||'Preview unavailable');return payload;})
      .then(payload=>{
        const detail=payload.build?.ultimate_lesson_builds?.find((row:any)=>row.id===lesson.id);
        if(detail?.preview)setLessons(previous=>previous.map(row=>row.id===lesson.id?{...row,preview:detail.preview}:row));
      }).catch(reason=>{if(!controller.signal.aborted)setError(reason instanceof Error?reason.message:'Preview unavailable');});
    return()=>controller.abort();
  },[buildId,selectedLesson,updatedAt,retry]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(()=>{
    const requested=workspace.requestedLessonId;
    const key=buildId+':'+requested;
    if(!requested || appliedRequestedLesson.current===key)return;
    const row=lessons.find(lesson=>lesson.canonicalLessonId===requested);
    if(row){appliedRequestedLesson.current=key;setFollowActive(false);setSelectedLesson(row.lesson_key);}
  },[workspace.requestedLessonId,buildId,lessons]);

  async function checkHealth() {
    setChecking(true);
    setHealthError('');
    setChecks([]);
    try {
      const response = await fetch('/api/admin/courses/health', {
        cache: 'no-store',
        signal: AbortSignal.timeout(30000),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok || !Array.isArray(payload.checks))
        throw new Error(
          payload.error || 'Course Builder health check failed (' + response.status + ')',
        );
      setChecks(payload.checks);
    } catch (reason) {
      setHealthError(
        reason instanceof Error ? reason.message : 'Course Builder health check could not complete',
      );
    } finally {
      setChecking(false);
    }
  }

  async function checkpointAction(lesson: Lesson, repair: boolean) {
    if (!selected) return;
    const key = `${lesson.id}:${selected}`;
    setActionBusy(key);
    setActionResults((previous) => ({ ...previous, [key]: {} }));
    const input = { buildId, lessonBuildId: lesson.id, step: selected };
    try {
      const response = await fetch(
        '/api/admin/ultimate-course-builder/checkpoint' +
          (repair ? '' : '?' + new URLSearchParams(input)),
        repair
          ? {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(input),
              signal: AbortSignal.timeout(45000),
            }
          : { cache: 'no-store', signal: AbortSignal.timeout(30000) },
      );
      const result = await response.json().catch(() => ({}));
      if (!response.ok)
        throw Error(result.error || 'The checkpoint action failed. Saved work is preserved.');
      setActionResults((previous) => ({ ...previous, [key]: result }));
      if (repair) setRetry((value) => value + 1);
    } catch (reason) {
      setActionResults((previous) => ({
        ...previous,
        [key]: { error: reason instanceof Error ? reason.message : 'Checkpoint action failed' },
      }));
    } finally {
      setActionBusy('');
    }
  }

  const previewLesson=lessons.find(row=>row.lesson_key===selectedLesson);
  const outline = (
    <nav aria-label="Course lesson outline" className="space-y-2 p-3 text-white">
      <h3 className="font-bold">Course outline</h3>
      <p className="text-sm text-slate-300">
        {lessons.length} planned · {lessons.filter((l) => l.preview?.videoUrl).length} saved videos
      </p>
      {error && (
        <p role="alert" className="text-amber-200">
          {error}
        </p>
      )}
      <ol className="space-y-2">
        {lessons.map((lesson, index) => (
          <li key={lesson.lesson_key}>
            <button
              type="button"
              aria-current={selectedLesson === lesson.lesson_key ? 'step' : undefined}
              className={`min-h-11 w-full rounded-lg border p-3 text-left text-sm ${selectedLesson === lesson.lesson_key ? 'border-cyan-400 bg-cyan-950' : 'border-slate-700'}`}
              onClick={() => {
                setFollowActive(false);
                setSelectedLesson(lesson.lesson_key);
              }}
            >
              <strong>
                {index + 1}. {lesson.title}
              </strong>
              <span className="mt-1 block text-slate-300">
                {lesson.status.replaceAll('_', ' ')} ·{' '}
                {lesson.preview?.videoUrl ? 'Video saved' : 'No video yet'}
              </span>
            </button>
          </li>
        ))}
      </ol>
    </nav>
  );
  return (
    <>
      <details className="my-3 rounded-xl border border-slate-700">
        <summary className="cursor-pointer p-3 font-bold">All lessons</summary>
        {outline}
      </details>
      <details className="my-3 rounded-xl border border-slate-700 p-3">
        <summary className="cursor-pointer font-bold">Build status and publishing</summary>
        {operations}
      </details>
      <section
        className="mt-2 min-w-0 rounded-xl bg-slate-950 p-2 text-white sm:p-4"
        aria-label="Course Builder checkpoints"
      >
        <div data-course-lesson-panes className="grid min-w-0 grid-cols-1 items-start gap-4">
          <div className="flex min-w-0 flex-wrap items-center justify-between gap-3 ">
            <h3 className="font-bold text-white">Lesson checkpoints</h3>
            <p className="text-sm text-slate-200">
              Select a lesson or checkpoint here. Its preview appears in the right pane.
            </p>
            <button
              type="button"
              onClick={() => void checkHealth()}
              disabled={checking}
              className="rounded-lg border border-slate-600 px-3 py-2 text-sm disabled:opacity-50"
            >
              {checking ? 'Checking dependencies…' : 'Check Course Builder health'}
            </button>
          </div>
          <div className="min-w-0 rounded-xl border border-slate-600 bg-slate-950 p-2 text-white sm:p-4 ">
            <label htmlFor="lesson-preview-selection" className="block font-bold">
              Selected lesson
            </label>
            <select
              id="lesson-preview-selection"
              value={selectedLesson}
              onChange={(event) => {
                setFollowActive(false);
                setSelectedLesson(event.target.value);
              }}
              className="mt-2 w-full rounded-lg border border-slate-400 bg-slate-900 p-3 text-white"
            >
              <option value="">Choose a lesson to preview…</option>
              {lessons.map((lesson, index) => (
                <option key={lesson.lesson_key} value={lesson.lesson_key}>
                  {index + 1}. {lesson.title} —{' '}
                  {lesson.saved ? lesson.status.replaceAll('_', ' ') : 'Not built — no video yet'}
                </option>
              ))}
            </select>
            <label className="mt-3 flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={followActive}
                onChange={(event) => setFollowActive(event.target.checked)}
              />
              Follow the lesson being built
            </label>

          </div>
          {healthError ? (
            <p role="alert" className="min-w-0 text-sm text-red-200 ">
              {healthError}
            </p>
          ) : null}
          {checks.length ? (
            <ul className="min-w-0 space-y-2 ">
              {checks.map((check) => (
                <li
                  key={check.name}
                  className="rounded-lg border border-slate-700 bg-slate-900 p-3 text-sm"
                >
                  <strong className={check.passed ? 'text-emerald-300' : 'text-amber-200'}>
                    {check.name}: {check.passed ? 'Passed' : 'Needs repair'}
                  </strong>
                  <p className="mt-1 text-slate-300">{check.message}</p>
                </li>
              ))}
            </ul>
          ) : null}
          <ol className="min-w-0 grid gap-2 sm:grid-cols-2 ">
            {ULTIMATE_BUILD_STEPS.map((step, index) => (
              <li key={step}>
                <button
                  type="button"
                  onClick={() => setSelected(step)}
                  aria-pressed={selected === step}
                  className={`w-full rounded-lg border p-3 text-left text-sm ${selected === step ? 'border-cyan-400 bg-cyan-950 text-cyan-100' : 'border-slate-700 bg-slate-950 text-slate-200 hover:border-cyan-500'}`}
                >
                  {index + 1}. {step.replaceAll('_', ' ')}
                </button>
              </li>
            ))}
          </ol>
          {selected ? (
            <div className="min-w-0 rounded-xl border border-slate-700 bg-slate-950 p-4 ">
              <h4 className="font-bold text-white">{selected.replaceAll('_', ' ')}</h4>
              {loading ? (
                <p role="status" className="mt-2 text-sm">
                  Loading saved lesson checkpoints…
                </p>
              ) : null}
              {error ? (
                <p role="alert" className="mt-2 text-red-200">
                  {error}
                </p>
              ) : null}
              <button
                type="button"
                onClick={() => setRetry((value) => value + 1)}
                disabled={loading}
                className="mt-2 text-sm text-cyan-300 underline"
              >
                Refresh checkpoints
              </button>
              {!loading && !error && !lessons.length ? (
                <p className="mt-3 text-sm text-slate-300">
                  This build has no saved lesson checkpoints yet. Start the Google worker to begin
                  processing.
                </p>
              ) : null}
              {!loading && !error ? (
                <ul className="mt-3 space-y-2">
                  {lessons
                    .filter((lesson) => !selectedLesson || lesson.lesson_key === selectedLesson)
                    .map((lesson) => {
                      const checkpoint = lesson.ultimate_lesson_steps?.find(
                        (row) => row.step === selected,
                      );
                      const needsRecheck = checkpointNeedsRecheck(
                        lesson.ultimate_lesson_steps ?? [],
                        selected,
                      );
                      const findings = (checkpoint?.findings ?? [])
                        .map(findingText)
                        .filter(Boolean);
                      const result = actionResults[`${lesson.id}:${selected}`];
                      return (
                        <li
                          key={lesson.id}
                          className="rounded-lg border border-slate-800 p-3 text-sm"
                        >
                          <strong>{lesson.title}</strong>
                          <p className="mt-1 text-slate-300">
                            {needsRecheck
                              ? 'Needs recheck for latest video'
                              : (checkpoint?.state ?? 'Not started')}
                          </p>
                          {needsRecheck && (
                            <p className="mt-1 text-amber-200">
                              The current saved render has not passed this check. Earlier findings
                              describe a previous render.
                            </p>
                          )}
                          {findings.map((finding, index) => (
                            <p key={index} className="mt-1 text-amber-200">
                              {needsRecheck ? 'Previous render: ' : ''}
                              {finding}
                            </p>
                          ))}
                          <div className="mt-3 flex flex-wrap gap-3">
                            <button
                              type="button"
                              disabled={Boolean(actionBusy) || !lesson.saved}
                              onClick={() => void checkpointAction(lesson, false)}
                              className="rounded-lg border border-slate-300 bg-white px-4 py-3 font-bold text-slate-950"
                            >
                              Diagnose checkpoint & preview
                            </button>
                            <button
                              type="button"
                              disabled={Boolean(actionBusy) || !lesson.saved}
                              onClick={() => void checkpointAction(lesson, true)}
                              className="rounded-lg bg-blue-700 px-4 py-3 font-bold text-white"
                            >
                              Fix this checkpoint
                            </button>
                          </div>
                          {actionBusy === `${lesson.id}:${selected}` && (
                            <p role="status" className="mt-3">
                              Working on this checkpoint…
                            </p>
                          )}
                          {result?.error && (
                            <p
                              role="alert"
                              className="mt-3 rounded-lg border border-red-400 bg-red-950 p-3 text-white"
                            >
                              {result.error}
                            </p>
                          )}
                          {result?.message && (
                            <p role="status" className="mt-3 text-white">
                              {result.message}
                            </p>
                          )}
                          {result?.diagnostic && (
                            <div className="mt-4 space-y-3">
                              <p>
                                Saved checkpoint:{' '}
                                <strong>{result.diagnostic.state.replaceAll('_', ' ')}</strong>
                              </p>
                              <p>Worker: {result.diagnostic.workerStatus}.</p>
                              {result.diagnostic.prerequisites.length > 0 && (
                                <p>
                                  Prerequisites still required:{' '}
                                  {result.diagnostic.prerequisites
                                    .map((v: string) => v.replaceAll('_', ' '))
                                    .join(', ')}
                                  .
                                </p>
                              )}
                              {result.diagnostic.missingEvidence.length > 0 && (
                                <p>
                                  {result.diagnostic.awaitingPrerequisites
                                    ? 'Waiting for this stage to finish and save evidence'
                                    : 'Saved checkpoint needs repair'}
                                  : {result.diagnostic.missingEvidence.join(', ')}.
                                </p>
                              )}
                              <p>
                                The lesson’s saved content and video preview are in the pane on the
                                right.
                              </p>
                            </div>
                          )}
                        </li>
                      );
                    })}
                </ul>
              ) : null}
            </div>
          ) : null}
        </div>
      </section>
      {workspace.previewTarget && createPortal(
        <section aria-label="Selected lesson preview" className="h-full overflow-auto bg-slate-950 p-4 text-white">
          <nav aria-label="Preview display" className="mb-3 flex flex-wrap gap-2">
            <button type="button" aria-pressed={!learnerView} onClick={()=>setLearnerView(false)} className="min-h-11 rounded-lg border border-slate-600 px-3">Lesson video & content</button>
            <button type="button" aria-pressed={learnerView} onClick={()=>setLearnerView(true)} disabled={!previewLesson?.preview?.learnerPreviewUrl} className="min-h-11 rounded-lg border border-slate-600 px-3 disabled:opacity-50">Learner view</button>
          </nav>
          {loading && !lessons.length && <p role="status">Loading lesson preview…</p>}
          {error && <p role="alert" className="text-red-200">{error}</p>}
          {!selectedLesson && !loading && !error && <p>Choose a lesson on the left to preview it here.</p>}
          {learnerView && previewLesson?.preview?.learnerPreviewUrl
            ? <iframe title={previewLesson.title+' — learner preview'} src={previewLesson.preview.learnerPreviewUrl}
                className="h-[75dvh] min-h-[36rem] w-full rounded-xl border border-slate-700 bg-white" allow="autoplay; fullscreen" />
            : <>            {lessons
              .filter((lesson) => lesson.lesson_key === selectedLesson)
              .map((lesson) => (
                <div key={lesson.lesson_key} className="mt-4 space-y-3">
                  <h4 className="text-lg font-bold">{lesson.title}</h4>
                  <p>
                    Saved lesson status: {lesson.status.replaceAll('_', ' ')}. Draft content updates
                    as checkpoints are saved.
                  </p>
                  {lesson.preview?.approvedVideoUrl && (
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={preferApproved}
                        onChange={(event) => setPreferApproved(event.target.checked)}
                      />
                      Show previously approved published video (uncheck to review current draft)
                    </label>
                  )}
                  <SavedVideo
                    buildId={buildId}
                    preferApproved={preferApproved}
                    lesson={lesson}
                    diagnostic={
                      lesson.preview?.videoUrl
                        ? lesson.preview
                        : actionResults[`${lesson.id}:${selected}`]?.diagnostic
                    }
                  />
                  {lesson.preview?.review &&
                    (!lesson.preview?.approvedVideoUrl || !preferApproved) && (
                      <LessonVideoReview
                        key={lesson.preview.review.artifactVersionId}
                        buildId={buildId}
                        lessonBuildId={lesson.id}
                        review={lesson.preview.review}
                        onSaved={() => setRetry((value) => value + 1)}
                      />
                    )}
                  {!lesson.saved && (
                    <p>This lesson has not been built. No saved video is available yet.</p>
                  )}
                  {lesson.preview?.objectives?.length > 0 && (
                    <div>
                      <h5 className="font-bold">Learning objectives</h5>
                      <ul className="list-disc pl-5">
                        {lesson.preview.objectives.map((text: string, i: number) => (
                          <li key={i}>{text}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {lesson.preview?.segments?.map((segment: any, i: number) => (
                    <article key={i} className="rounded-lg border border-slate-600 p-3">
                      <h5 className="font-bold">{segment.title}</h5>
                      <p className="mt-2 whitespace-pre-wrap">{segment.text}</p>
                    </article>
                  ))}
                  <AssessmentPreview key={lesson.id} assessment={lesson.preview?.assessment} />
                  {lesson.preview?.scenes?.map((scene: any, i: number) => (
                    <details key={i} className="rounded-lg border border-slate-600 p-3">
                      <summary className="cursor-pointer font-bold">
                        Scene {i + 1}: {scene.title}
                      </summary>
                      <p className="mt-2 whitespace-pre-wrap">{scene.narration}</p>
                      <p className="mt-2">Visual: {scene.visual}</p>
                      {scene.recap && <p className="mt-2">Recap: {scene.recap}</p>}
                    </details>
                  ))}
                  {lesson.saved &&
                    !lesson.preview?.segments?.length &&
                    !lesson.preview?.scenes?.length && (
                      <p>
                        The lesson is being prepared. Saved instruction will appear here before its
                        final video is ready.
                      </p>
                    )}
                  <p>
                    Select a checkpoint below to inspect this lesson’s saved evidence and rendered
                    video.
                  </p>
                </div>
              ))}</>}

        </section>, workspace.previewTarget)}
    </>
  );
}


