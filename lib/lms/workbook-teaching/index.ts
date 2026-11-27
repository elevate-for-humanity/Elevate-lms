/**
 * lib/lms/workbook-teaching/index.ts
 *
 * Registry of authored workbook teaching content (see types.ts). Each
 * workbook's JSON is authored from its sections' linked lessons and
 * registered here; components/lms/WorkbookTeaching.tsx renders the
 * chapter for a section inside the workbook's main flow. Workbooks with
 * a stored PDF and full page mapping (barbering, cosmetology) teach
 * through the book itself and are not registered here; HVAC keeps its
 * bespoke content + teaching component.
 */
import type { WorkbookTeachingChapter, WorkbookTeachingContent } from './types';
import welding from './welding-foundations-guided-practice.json';
import forklift from './forklift-manufacturing-operations-workbook.json';
import financial from './financial-empowerment-guided-practice.json';
import bookkeeping from './intuit-bookkeeping-guided-practice.json';
import businessRetail from './business-esb-retail-projects.json';
import businessStartup from './business-esb-retail-projects-startup.json';
import hipaa from './hipaa-privacy-security-awareness-workbook.json';
import osha from './workplace-safety-osha-awareness-workbook.json';
import aiEngineering from './ai-engineering-applied-practice.json';
import esthetics from './prestige-elevation-esthetics.json';
import nail from './prestige-elevation-nail-technology.json';

const CONTENTS: WorkbookTeachingContent[] = [
  welding as WorkbookTeachingContent,
  forklift as WorkbookTeachingContent,
  financial as WorkbookTeachingContent,
  bookkeeping as WorkbookTeachingContent,
  businessRetail as WorkbookTeachingContent,
  businessStartup as WorkbookTeachingContent,
  hipaa as WorkbookTeachingContent,
  osha as WorkbookTeachingContent,
  aiEngineering as WorkbookTeachingContent,
  esthetics as WorkbookTeachingContent,
  nail as WorkbookTeachingContent,
];

const bySlug = new Map<string, Map<number, WorkbookTeachingChapter>>();
for (const content of CONTENTS) {
  const chapters = new Map<number, WorkbookTeachingChapter>();
  for (const chapter of content.chapters) chapters.set(chapter.number, chapter);
  bySlug.set(content.workbookSlug, chapters);
}

export function getWorkbookTeachingChapter(
  slug: string,
  sectionNumber: number,
): WorkbookTeachingChapter | null {
  return bySlug.get(slug)?.get(sectionNumber) ?? null;
}

export function listWorkbookTeachingSlugs(): string[] {
  return [...bySlug.keys()];
}
