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

/** Read-only saved media preview; opening it never queues or repairs a build. */
export default function CourseSidePreview({ courseId }: { courseId: string }) {
  const followActive = useRef(true);
  const [lessons, setLessons] = useState<SavedLesson[]>([]);
  const [selected, setSelected] = useState("");
  const [buildId, setBuildId] = useState("");
  const [activity, setActivity] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    let disposed = false;
    let pending = false;
    const controller = new AbortController();
    followActive.current = true;
    setLessons([]);
    setSelected("");
    setBuildId("");
    setActivity("");
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
          setActivity(
            job?.payload?.progress?.phase?.replaceAll(":", " · ") ||
              build.current_step?.replaceAll("_", " ") ||
              build.status ||
              "",
          );
        }
        const response = await fetch(
          `/api/admin/ultimate-course-builder?view=checkpoints&buildId=${encodeURIComponent(build.id)}`,
          { cache: "no-store", signal: controller.signal },
        );
        const payload = await response.json();
        if (!response.ok)
          throw new Error(payload.error || "Unable to load saved videos");
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
            return lesson
              ? [
                  {
                    id: competency.id,
                    lessonId: lesson.id,
                    running: lesson.status === "running",
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
            (followActive.current && rows.find((row) => row.running)?.id) ||
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
  return (
    <section
      aria-label="Saved course video preview"
      className="space-y-4 bg-slate-950 p-4 text-white"
    >
      <h3 className="font-bold">Live course preview</h3>
      {activity && <p role="status">Build activity: {activity}</p>}
      {!courseId && <p>Select a course to watch its saved lessons here.</p>}
      {error && <p role="alert">{error}</p>}
      {loading && !lessons.length && <p role="status">Loading saved videos…</p>}
      {courseId && !loading && !error && !lessons.length && (
        <p>No saved lesson videos yet.</p>
      )}
      {!!lessons.length && (
        <label className="block">
          Lesson to watch
          <select
            value={selected}
            onChange={(event) => {
              followActive.current = false;
              setSelected(event.target.value);
            }}
            className="mt-2 w-full rounded-lg border border-slate-600 bg-slate-900 p-3 text-white"
          >
            {lessons.map((row) => (
              <option key={row.id} value={row.id}>
                {row.title}
              </option>
            ))}
          </select>
        </label>
      )}
      {!!lessons.length && (
        <button
          type="button"
          className="min-h-11 rounded-lg border border-slate-600 px-3"
          onClick={() => {
            followActive.current = true;
            setSelected(lessons.find((row) => row.running)?.id || selected);
          }}
        >
          Follow current build
        </button>
      )}
      {lesson && (
        <>
          <h4 className="font-bold">{lesson.title}</h4>
          {lesson.videoUrl ? (
            <video
              controls
              playsInline
              preload="metadata"
              src={lesson.videoUrl}
              aria-label={`${lesson.title} side preview`}
              className="aspect-video w-full rounded-lg bg-black"
            />
          ) : lesson.running ? (
            <ProgressiveLessonVideo
              buildId={buildId}
              lessonId={lesson.lessonId}
              title={lesson.title}
            />
          ) : (
            <p>This lesson has no saved video yet.</p>
          )}
          <p className="text-sm text-slate-300">
            Latest saved video. New videos appear automatically as they are
            saved.
          </p>
        </>
      )}
    </section>
  );
}
