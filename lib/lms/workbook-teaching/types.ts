/**
 * lib/lms/workbook-teaching/types.ts
 *
 * Authored workbook teaching content — the generic form of the HVAC
 * pattern (lib/lms/hvac-workbook-content.json). Each workbook that has no
 * stored PDF (or whose PDF page mapping is incomplete) carries one JSON
 * per workbook under lib/lms/workbook-teaching/, authored from the
 * sections' linked lessons so the workbook teaches the same curriculum
 * the lesson teaches. components/lms/WorkbookTeaching.tsx renders it in
 * the workbook's main flow: a labeled diagram, paged instruction with
 * narration, a worked example, and a self-check — next to the section's
 * prompts, which keep their answers and save behavior unchanged.
 */

export type WorkbookTeachingChapter = {
  /** Section number within the workbook (digital_workbook_sections.section_number). */
  number: number;
  /** Short heading for the main teaching page. */
  heading: string;
  /** Main teaching text, condensed from the linked lesson. */
  text: string;
  /** Optional additional instruction pages before the main page. */
  lessons?: Array<{ heading: string; text: string }>;
  /** Worked example page (trades and courses with applied work). */
  example: string;
  /** One-line self-check the learner answers before the prompts. */
  review: string;
  /** Ordered labels for the main-flow diagram (a process/concept flow). */
  diagram: string[];
  image?: string;
  imageAlt?: string;
};

export type WorkbookTeachingContent = {
  version: number;
  workbookSlug: string;
  chapters: WorkbookTeachingChapter[];
};
