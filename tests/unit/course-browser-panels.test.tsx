import React from "react";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import UnifiedCourseBuilder from "@/components/admin/course-builder/UnifiedCourseBuilder";
import CourseProductionWorkspace from "@/components/admin/course-builder/CourseProductionWorkspace";
import { CourseStudioApplication } from "@/components/studio/CourseStudioApplication";

vi.mock("@/components/studio/UnifiedEllieChat",()=>({
  default:()=> <label>AI course instruction<input defaultValue=""/></label>,
}));
vi.mock("@/components/studio/DeployPanel",()=>({default:()=> <button>Deploy Admin</button>}));
vi.mock("@/components/admin/course-builder/UltimateStageInspector", () => ({
  default: () => null,
}));
vi.mock("next/dynamic", () => ({
  default: () => () => (
    <iframe title="Cloud browser session" src="about:blank" />
  ),
}));
vi.mock("@/components/admin/course-builder/CredentialRegistryPanel", () => ({
  default: () => null,
}));
vi.mock("@/components/studio/CourseProvider", () => ({
  useCourse: () => ({
    state: {
      course: { id: "course", title: "Course", status: "draft" },
      publishState: { isPublished: false },
      autosave: { isDirty: true, lastSavedAt: null },
      warnings: [],
      lessons: [],
    },
    save: vi.fn(),
    setPanel: vi.fn(),
  }),
}));
beforeEach(() => {
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({ width: 1280, height: 800 } as DOMRect);
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => ({
      ok: true,
      json: async () => ({ courses: [], programs: [] }),
    })),
  );
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

it("keeps course selection, AI instructions and deployment controls on the left with previews only on the right",async()=>{
  render(<UnifiedCourseBuilder />);
  await waitFor(()=>expect(fetch).toHaveBeenCalled());
  const preview=screen.getByRole("region",{name:"Course preview pane"});
  const controls=screen.getByRole("region",{name:"Course AI controls"});
  expect(preview).toBeVisible();expect(controls).toBeVisible();
  expect(preview).not.toContainElement(screen.getByRole("textbox",{name:"AI course instruction"}));
  expect(screen.queryByRole("button",{name:"Web browser",exact:true})).toBeNull();
  expect(screen.queryByText(/Podcast & program guide/)).toBeNull();
  const input=screen.getByRole("textbox",{name:"AI course instruction"});
  fireEvent.change(input,{target:{value:"Change the introduction"}});
  fireEvent.click(screen.getByRole("button",{name:"Deploy",exact:true}));
  expect(controls).toContainElement(screen.getByRole("button",{name:"Deploy Admin"}));
  fireEvent.click(screen.getByRole("button",{name:"Close Course previews"}));
  fireEvent.click(screen.getByRole("button",{name:"Open Course previews"}));
  expect(input).toHaveValue("Change the introduction");
  expect(screen.getByRole("separator",{name:"Resize Course previews"})).toBeInTheDocument();
});

it("keeps the lesson editor, learner preview and browser mounted when changing side panels", async () => {
  render(
    <CourseStudioApplication>
      <label>
        Lesson draft
        <input defaultValue="Draft" />
      </label>
    </CourseStudioApplication>,
  );
  await waitFor(() => expect(fetch).toHaveBeenCalled());
  const learnerFrame = screen.getByTitle("Live learner course preview");
  const input = screen.getByRole("textbox", { name: "Lesson draft" });
  fireEvent.change(input, { target: { value: "Unsaved edits" } });
  fireEvent.click(screen.getByRole("button", { name: "Cloud Studio browser" }));
  const cloudFrame = screen.getByTitle("Cloud browser session");
  fireEvent.click(
    screen.getByRole("button", { name: "Close Course side panel" }),
  );
  fireEvent.click(
    screen.getByRole("button", { name: "Open Course side panel" }),
  );
  fireEvent.click(
    screen.getByRole("button", { name: "Learner preview", exact: true }),
  );
  expect(screen.getByTitle("Live learner course preview")).toBe(learnerFrame);
  expect(screen.getByTitle("Cloud browser session")).toBe(cloudFrame);
  expect(input).toHaveValue("Unsaved edits");
});

it("provides the course preview without launching a homepage browser on the standalone route", async () => {
  render(
    <CourseProductionWorkspace initialCourseId="" initialTab="ultimate" />,
  );
  await waitFor(() => expect(fetch).toHaveBeenCalled());
  expect(
    screen.getByRole("region", { name: "Course preview pane" }),
  ).toBeVisible();
  expect(screen.queryByTitle("Cloud browser session")).toBeNull();
  expect(screen.getAllByRole("separator")).toHaveLength(1);
});

