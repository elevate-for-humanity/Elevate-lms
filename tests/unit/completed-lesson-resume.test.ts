import { expect, it, vi } from "vitest";
import { runUltimateCourse } from "../../lib/ultimate-course-builder/core/full-course-runner";
import { ULTIMATE_BUILD_STEPS } from "../../lib/ultimate-course-builder/core/types";
vi.mock("../../lib/ultimate-course-builder/core/lesson-contract", () => ({
  assertCompleteLesson: vi.fn(),
}));
it("reuses a complete saved lesson without invoking generation or rendering", async () => {
  const make = vi.fn();
  const persistence: any = {
    updateBuild: vi.fn(),
    createLesson: vi.fn(async () => ({ id: "lesson" })),
    loadLessonCheckpoint: vi.fn(async () => ({
      passedSteps: ULTIMATE_BUILD_STEPS,
      artifacts: { lesson_film_render: { render: { videoUrl: "saved.mp4" } } },
      findings: [],
    })),
    finishLesson: vi.fn(),
  };
  const result = await runUltimateCourse(
    {
      buildId: "build",
      courseId: "course",
      profile: { competencies: [{ id: "one" }] } as any,
    },
    make,
    persistence,
  );
  expect(make).not.toHaveBeenCalled();
  expect(persistence.finishLesson).toHaveBeenCalledExactlyOnceWith({
    lessonBuildId: "lesson",
    status: "built",
    artifacts: { lesson_film_render: { render: { videoUrl: "saved.mp4" } } },
    findings: [],
  });
  expect(result.completed).toBe(true);
  expect(
    result.lessons[0].result.artifacts.lesson_film_render.render.videoUrl,
  ).toBe("saved.mp4");
});
