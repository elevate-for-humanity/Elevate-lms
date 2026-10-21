"use client";

import UnifiedCourseBuilder from "./UnifiedCourseBuilder";

/** The standalone route uses the same editor/browser shell as embedded Studio. */
export default function CourseProductionWorkspace({
  initialCourseId,
  initialTab,
}: {
  initialCourseId: string;
  initialTab: "courses" | "ultimate" | "registry" | "media";
}) {
  return (
    <div
      data-course-browser-workspace
      className="course-production-workspace h-[calc(100dvh-10rem)] min-h-[34rem] min-w-0"
    >
      <UnifiedCourseBuilder
        initialCourseId={initialCourseId}
        initialTab={initialTab}
        syncLocationWithUrl
        embedded
      />
    </div>
  );
}
