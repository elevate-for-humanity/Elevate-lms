"use client";

import { useEffect, useRef, useState } from "react";
import ProgressiveLessonVideo from "./ProgressiveLessonVideo";

type SavedLesson = {
  id: string;
  title: string;
  videoUrl: string;
  lessonId: string;
  running: boolean;
};

function followedLesson(rows: SavedLesson[]) {
  const active = rows.find((row) => row.running);
  // Keep saved media visible through both queued and partially rendered lessons.
  // The unfinished lesson remains selectable for watching its progressive frames.
  if (active?.videoUrl) return active.id;
  return rows.filter((row) => row.videoUrl).at(-1)?.id || active?.id || rows[0]?.id || "";
}

/** Read-only saved media preview; opening it never queues or repairs a build. */
export default function CourseSidePreview({ courseId }: { courseId: string }) {
  const followActive = useRef(true);
  const [following, setFollowing] = useState(true);
  const [lessons, setLessons] = useState<SavedLesson[]>([]);
  const [selected, setSelected] = useState("");
  const [buildId, setBuildId] = useState("");
  const [buildRunning, setBuildRunning] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    let disposed = false;
    let pending = false;
    const controller = new AbortController();
    followActive.current = true;
    setFollowing(true);
    setLessons([]);
    setSelected("");
    setBuildId("");
    setBuildRunning(false);
    setError("");
    if (!courseId) return () => controller.abort();
    async function refresh() {
      if (pending) return;
      pending = true;
      setLoading(true);
      try {
        const inventory = await fetch(
          `/api/admin/ultimate-course-builder?courseId=${encodeURIComponent(courseId)}`,
          { cache: "no-store", signal: controller.signal },
        );
        const data = await inventory.json();
        if (!inventory.ok)
          throw new Error(data.error || "Unable to load course preview");
        const build = data.builds?.[0];
        if (!build) {
          if (!disposed) setLessons([]);
          return;
        }
        if (!disposed) {
          setBuildId(build.id);
          const job = build.ultimate_build_jobs?.find(
            (row: { status: string }) => row.status === "running",
          );
          setBuildRunning(Boolean(job));
        }
        const response = await fetch(
          `/api/admin/ultimate-course-builder?view=checkpoints&buildId=${encodeURIComponent(build.id)}`,
          { cache: "no-store", signal: controller.signal },
        );
        const payload = await response.json();
        if (!response.ok)
          throw new Error(payload.error || "Unable to load saved videos");
        const activeJob = build.ultimate_build_jobs?.find(
          (row: { status: string }) =>
            ["running", "queued"].includes(row.status),
        );
        const activeCompetency =
          payload.build?.profile?.competencies?.[
            activeJob?.payload?.nextCompetencyIndex
          ]?.id;
        const rows: SavedLesson[] = (
          payload.build?.profile?.competencies ?? []
        ).flatMap(
          (competency: {
            id: string;
            title?: string;
            description?: string;
          }) => {
            const lesson = payload.build?.ultimate_lesson_builds?.find(
              (row: { competency_id: string }) =>
                row.competency_id === competency.id,
            );
            const videoUrl =
              lesson?.preview?.videoUrl || lesson?.preview?.approvedVideoUrl;
            return lesson || competency.id === activeCompetency
              ? [
                  {
                    id: competency.id,
                    lessonId: lesson?.id || "",
                    running: activeCompetency
                      ? competency.id === activeCompetency
                      : lesson?.status === "running",
                    title:
                      competency.title ||
                      competency.description ||
                      "Saved lesson",
                    videoUrl: videoUrl || "",
                  },
                ]
              : [];
          },
        );
        if (disposed) return;
        setLessons(rows);
        setSelected(
          (previous) =>
            (followActive.current && followedLesson(rows)) ||
            (rows.some((row) => row.id === previous)
              ? previous
              : rows[0]?.id || ""),
        );
        setError("");
      } catch (reason) {
        if (!disposed)
          setError(
            reason instanceof Error
              ? reason.message
              : "Unable to load saved videos",
          );
      } finally {
        pending = false;
        if (!disposed) setLoading(false);
      }
    }
    void refresh();
    const timer = window.setInterval(() => void refresh(), 15000);
    return () => {
      disposed = true;
      controller.abort();
      window.clearInterval(timer);
    };
  }, [courseId]);
  const lesson = lessons.find((row) => row.id === selected);
  const active = lessons.find((row) => row.running);
  const waitingFor = following && active && !active.videoUrl && active.id !== selected ? active : null;
  return (
    <section aria-label="Saved course video preview" className="flex h-full min-h-0 flex-col gap-3 bg-slate-950 p-3 text-white">
      <h3 className="sr-only">Live course preview</h3>
      {!courseId && <p>Select a course to watch its saved lessons here.</p>}
      {error && <p role="alert">{error}</p>}
      {loading && !lessons.length && <p role="status">Loading saved videos…</p>}
      {courseId && !loading && !error && !lessons.length && <p>No saved lesson videos yet.</p>}
      {!!lessons.length && (
        <div className="flex shrink-0 items-end gap-2">
          <label className="block min-w-0 flex-1 text-xs">
            Lesson to watch
            <select value={selected} onChange={(event) => { followActive.current = false; setFollowing(false); setSelected(event.target.value); }}
              className="mt-1 min-h-11 w-full rounded-lg border border-slate-600 bg-slate-900 px-2 text-sm text-white">
              {lessons.map((row) => <option key={row.id} value={row.id}>{row.title}</option>)}
            </select>
          </label>
          <button type="button" aria-label="Follow current build" className="min-h-11 shrink-0 rounded-lg border border-slate-600 px-2 text-xs"
            onClick={() => { followActive.current = true; setFollowing(true); setSelected(followedLesson(lessons) || selected); }}>
            Follow build
          </button>
        </div>
      )}
      {lesson && (
        <>
          <h4 className="sr-only">{lesson.title}</h4>
          {waitingFor && <p className="shrink-0 text-xs text-slate-300">{waitingFor.title} has no saved video yet. Showing {lesson.title} while waiting.</p>}
          <div className="min-h-0 flex-1 overflow-auto">
            {lesson.videoUrl ? (
              <video controls playsInline preload="metadata" src={lesson.videoUrl} aria-label={`${lesson.title} side preview`}
                className="h-full w-full rounded-lg bg-black object-contain" />
            ) : lesson.running && lesson.lessonId ? (
              <ProgressiveLessonVideo buildId={buildId} lessonId={lesson.lessonId} title={lesson.title} />
            ) : <p>This lesson has no saved video yet.</p>}
          </div>
          <p role="status" className="shrink-0 text-xs text-slate-300">
            {buildRunning ? "Course build in progress. Saved videos stay available." : "Latest saved lesson video."}
          </p>
        </>
      )}
    </section>
  );
}

