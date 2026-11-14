"use client";

import UnifiedCourseBuilder from "./UnifiedCourseBuilder";
import { useLayoutEffect, useRef } from "react";

/** The standalone route uses the same editor/browser shell as embedded Studio. */
export default function CourseProductionWorkspace({
  initialCourseId,
  initialTab,
}: {
  initialCourseId: string;
  initialTab: "courses" | "ultimate" | "registry" | "media";
}) {
  const workspace = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const element = workspace.current;
    if (!element) return;
    const fitViewport = () => {
      const measuredTop = element.getBoundingClientRect().top;
      const top = Number.isFinite(measuredTop) ? Math.max(0, measuredTop) : 0;
      const viewportHeight = window.visualViewport?.height ?? window.innerHeight;
      const height = `${Math.max(160, viewportHeight - top - 12)}px`;
      if (element.style.height !== height) element.style.height = height;
    };
    fitViewport();
    window.addEventListener('resize', fitViewport);
    window.visualViewport?.addEventListener('resize', fitViewport);
    const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(fitViewport);
    if (element.parentElement) observer?.observe(element.parentElement);
    return () => {
      window.removeEventListener('resize', fitViewport);
      window.visualViewport?.removeEventListener('resize', fitViewport);
      observer?.disconnect();
    };
  }, []);
  return (
    <div
      ref={workspace}
      data-course-browser-workspace
      className="course-production-workspace h-[calc(100dvh-10rem)] min-h-0 min-w-0 overflow-hidden"
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
