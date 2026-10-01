'use client';
import { useRef, useState } from 'react';
import InteractiveVideoPlayer from './InteractiveVideoPlayer';
export default function StagedLessonExperience({ runId, snapshot, initialProgress }: { runId: string; snapshot: any; initialProgress: any }) {
  const [progress, setProgress] = useState(initialProgress), [error, setError] = useState('');
  const [answers, setAnswers] = useState<Record<string, number>>({}), [written, setWritten] = useState<Record<string, string>>({});
  const saving = useRef(false), lastSave = useRef(0), root = useRef<HTMLDivElement>(null);
  const b = snapshot.blueprint;
  async function act(body: any) {
    const res = await fetch(`/api/learner-testing/runs/${runId}`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
    const data = await res.json();
    if (!res.ok) { setError(data.error); throw new Error(data.error); }
    setError(''); setProgress(data.progress); return data;
  }
  async function savePlayback() {
    const video = root.current?.querySelector('video');
    if (!video || saving.current || Date.now() - lastSave.current < 3000 || !Number.isFinite(video.duration)) return;
    saving.current = true; lastSave.current = Date.now();
    try { await act({ action: 'progress', position: video.currentTime, duration: video.duration }); }
    catch { /* act displays the save failure; playback can retry on its next update. */ }
    finally { saving.current = false; }
  }
  const retake = progress.assessment && !progress.assessment.passed && progress.remediationReviewed;
  const questions = retake ? b.assessment.reassessment : b.assessment.questions;
  return <div ref={root} className="space-y-6" data-testid="staged-lesson">
    <InteractiveVideoPlayer videoUrl={snapshot.render.videoUrl} captionsUrl={snapshot.render.captionsUrl} title={snapshot.title}
      initialPositionSeconds={Number(initialProgress.position ?? 0)} onProgress={() => { void savePlayback(); }} onComplete={() => { void savePlayback(); }} />
    <p role="status" data-testid="saved-position">Saved position: {Number(progress.position ?? 0).toFixed(1)}</p>
    {b.stages.map((s: any) => <section key={s.stage}><h2 className="text-lg font-bold">{s.stage.replaceAll('_', ' ')}</h2><p className="text-base leading-7">{s.instruction}</p></section>)}
    {b.activities.filter((a: any) => ['guided_practice', 'independent_practice', 'knowledge_check'].includes(a.type)).map((a: any) => <section key={a.id} data-testid={a.type}>
      <h2 className="text-lg font-bold">{a.type.replaceAll('_', ' ')}</h2><p>{a.prompt}</p>
      <label className="block">Your response<textarea className="mt-2 w-full rounded border p-3" aria-label={a.prompt} value={written[a.id] ?? progress.activities?.[a.id]?.answer ?? ''} onChange={e => setWritten({ ...written, [a.id]: e.target.value })} /></label>
      <button className="rounded bg-cyan-800 p-3 text-white" onClick={() => { void act({ action: 'activity', activityId: a.id, answer: written[a.id] }).catch(() => {}); }}>Submit practice</button>
      {progress.activities?.[a.id] ? <p role="status">Practice saved. {a.feedback}</p> : null}
    </section>)}
    {b.mistakes?.length ? <section data-testid="scenario"><h2 className="text-lg font-bold">Choose the professional correction</h2><p>{b.mistakes[0].mistake}</p>
      <button className="my-2 block rounded border p-3" onClick={() => { void act({ action: 'scenario', choice: 0 }).catch(() => {}); }}>Continue with the mistake</button>
      <button className="my-2 block rounded border p-3" onClick={() => { void act({ action: 'scenario', choice: 1 }).catch(() => {}); }}>{b.mistakes[0].correction}</button>
      {progress.scenario ? <p role="status">{progress.scenario.passed ? 'Correct decision.' : 'Review this decision.'} {progress.scenario.feedback}</p> : null}
    </section> : null}
    <section data-testid={retake ? 'reassessment' : 'lesson_assessment'}><h2 className="text-lg font-bold">{retake ? 'Reassessment' : 'Lesson assessment'}</h2>
      {questions.map((q: any) => <fieldset key={q.id} className="my-4"><legend>{q.prompt}</legend>{q.choices.map((choice: string, i: number) => <label key={i} className="my-2 flex gap-3"><input type="radio" name={q.id} checked={answers[q.id] === i} onChange={() => setAnswers({ ...answers, [q.id]: i })} />{choice}</label>)}</fieldset>)}
      <button className="rounded bg-cyan-800 p-3 text-white" onClick={() => { void act({ action: retake ? 'reassessment' : 'assessment', responses: questions.map((q: any) => answers[q.id]) }).catch(() => {}); }}>Submit assessment</button>
      {(progress.reassessment ?? progress.assessment) ? <p role="status">Score: {(progress.reassessment ?? progress.assessment).score}. {(progress.reassessment ?? progress.assessment).passed ? 'Passed.' : 'Review required.'}</p> : null}
    </section>
    {progress.assessment && !progress.assessment.passed ? <section data-testid="remediation"><h2 className="text-lg font-bold">Required review</h2>{progress.assessment.missed.map((q: any) => <p key={q.id}>{q.remediation}</p>)}<button className="rounded border p-3" onClick={() => { void act({ action: 'remediation' }).catch(() => {}); }}>I have reviewed the missed objectives</button></section> : null}
    {snapshot.practicalRequired ? <p data-testid="practical">Practical evidence requires instructor evaluation. Written practice does not award practical competency.</p> : null}
    <button className="rounded bg-cyan-800 p-3 text-white" onClick={() => { void act({ action: 'complete' }).catch(() => {}); }}>Complete lesson</button>
    {progress.completed ? <p role="status" data-testid="lesson-completed">Lesson completed</p> : null}
    {error ? <p role="alert">{error}</p> : null}
  </div>;
}
