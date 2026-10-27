import React from "react";
import { afterEach, expect, it, vi } from "vitest";
import {
  cleanup,
  render,
  screen,
  waitFor,
  fireEvent,
} from "@testing-library/react";
import CourseSidePreview from "../../components/admin/course-builder/CourseSidePreview";
vi.mock("../../components/admin/course-builder/ProgressiveLessonVideo", () => ({
  default: () => <div>Live render portions</div>,
}));
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});
function mock(saved = true, activeJob = false, secondSaved = true) {
  const fetcher = vi.fn(async (url: string, options?: RequestInit) => ({
    ok: true,
    json: async () =>
      url.includes("view=checkpoints")
        ? {
            build: {
              profile: {
                competencies: [
                  { id: "one", title: "First lesson" },
                  { id: "two", title: "Second lesson" },
                ],
              },
              ultimate_lesson_builds: [
                {
                  id: "l1",
                  competency_id: "one",
                  status: "running",
                  preview: {
                    videoUrl: saved ? "https://media.example/one.mp4" : "",
                  },
                },
                {
                  id: "l2",
                  competency_id: "two",
                  status: "built",
                  preview: { videoUrl: secondSaved ? "https://media.example/two.mp4" : "" },
                },
              ],
            },
          }
        : {
            builds: [
              {
                id: "build",
                status: "running",
                current_step: "lesson_film_render",
                ...(activeJob ? { ultimate_build_jobs: [{ status: 'running', payload: { progress: { phase: 'render-frames:1800' } } }] } : {}),
              },
            ],
          },
  }));
  vi.stubGlobal("fetch", fetcher);
  return fetcher;
}
it("shows selected course video without a general browser or writes", async () => {
  const f = mock();
  render(<CourseSidePreview courseId="course" />);
  const video = await screen.findByLabelText("First lesson side preview");
  expect(video).toHaveAttribute("src", "https://media.example/one.mp4");
  expect(screen.queryByText("Live render portions")).toBeNull();
  expect(screen.getByRole("status")).toHaveTextContent("Latest saved lesson video.");
  expect(screen.queryByText(/lesson film render/)).toBeNull();
  fireEvent.change(screen.getByLabelText("Lesson to watch"), {
    target: { value: "two" },
  });
  expect(screen.getByLabelText("Second lesson side preview")).toHaveAttribute(
    "src",
    "https://media.example/two.mp4",
  );
  expect(
    f.mock.calls.every(([, options]) => !options || !("method" in options)),
  ).toBe(true);
});
it("keeps plain-language build status after the player instead of exposing render internals", async () => {
  mock(true, true);
  render(<CourseSidePreview courseId="course" />);
  const video = await screen.findByLabelText("First lesson side preview");
  const status = screen.getByRole('status');
  expect(status).toHaveTextContent('Course build in progress. Saved videos stay available.');
  expect(screen.queryByText(/render-frames/)).toBeNull();
  expect(video.compareDocumentPosition(status) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
});
it("shows completed render portions while a lesson has no saved final video", async () => {
  mock(false, false, false);
  render(<CourseSidePreview courseId="course" />);
  expect(await screen.findByText("Live render portions")).toBeInTheDocument();
});
it("keeps a saved video visible even after the unfinished lesson row exists", async () => {
  mock(false);
  render(<CourseSidePreview courseId="course" />);
  expect(await screen.findByLabelText('Second lesson side preview')).toHaveAttribute('src', 'https://media.example/two.mp4');
  expect(screen.getByText(/First lesson has no saved video yet/)).toBeVisible();
  fireEvent.change(screen.getByLabelText('Lesson to watch'), { target: { value: 'one' } });
  expect(screen.getByText('Live render portions')).toBeVisible();
  expect(screen.queryByText(/Showing Second lesson while waiting/)).toBeNull();
});
it("removes the old course video when switching courses", async () => {
  mock();
  const view = render(<CourseSidePreview courseId="course" />);
  await screen.findByLabelText("First lesson side preview");
  view.rerender(<CourseSidePreview courseId="" />);
  await waitFor(() =>
    expect(screen.queryByLabelText("First lesson side preview")).toBeNull(),
  );
  expect(
    screen.getByText("Select a course to watch its saved lessons here."),
  ).toBeInTheDocument();
});

it("keeps a saved video visible while the queued lesson has no preview, without hiding manual selection", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string) => ({
      ok: true,
      json: async () =>
        url.includes("view=checkpoints")
          ? {
              build: {
                profile: {
                  competencies: [
                    { id: "one", title: "Old lesson" },
                    { id: "two", title: "Lesson two" },
                    { id: "three", title: "Current third lesson" },
                  ],
                },
                ultimate_lesson_builds: [
                  {
                    id: "old",
                    competency_id: "one",
                    status: "running",
                    preview: { videoUrl: "old.mp4" },
                  },
                  {
                    id: "latest",
                    competency_id: "two",
                    status: "built",
                    preview: { videoUrl: "latest.mp4" },
                  },
                ],
              },
            }
          : {
              builds: [
                {
                  id: "build",
                  status: "running",
                  ultimate_build_jobs: [
                    { status: "queued", payload: { nextCompetencyIndex: 2 } },
                  ],
                },
              ],
            },
    })),
  );
  render(<CourseSidePreview courseId="course" />);
  const video = await screen.findByLabelText("Lesson two side preview");
  expect(video).toHaveAttribute('src', 'latest.mp4');
  expect(screen.getByLabelText("Lesson to watch")).toHaveValue("two");
  expect(screen.getByText(/Current third lesson has no saved video yet/)).toBeVisible();
  fireEvent.change(screen.getByLabelText('Lesson to watch'), { target: { value: 'three' } });
  expect(screen.getByText('This lesson has no saved video yet.')).toBeVisible();
  expect(screen.queryByText(/Showing Lesson two while waiting/)).toBeNull();
  fireEvent.click(screen.getByRole('button', { name: 'Follow current build' }));
  expect(screen.getByLabelText('Lesson two side preview')).toHaveAttribute('src', 'latest.mp4');
});

