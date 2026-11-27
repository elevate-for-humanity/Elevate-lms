import { describe, expect, it } from 'vitest';
import {
  getWorkbookTeachingChapter,
  listWorkbookTeachingSlugs,
} from '@/lib/lms/workbook-teaching';

/** Registered workbooks and their section counts (production census). */
const EXPECTED: Record<string, number> = {
  'welding-foundations-guided-practice': 14,
  'forklift-manufacturing-operations-workbook': 24,
  'financial-empowerment-guided-practice': 32,
  'intuit-bookkeeping-guided-practice': 18,
  'business-esb-retail-projects': 20,
  'business-esb-retail-projects-startup': 20,
  'hipaa-privacy-security-awareness-workbook': 12,
  'workplace-safety-osha-awareness-workbook': 12,
  'ai-engineering-applied-practice': 12,
  'prestige-elevation-esthetics': 28,
  'prestige-elevation-nail-technology': 26,
};

describe('workbook teaching content', () => {
  it('registers every expected workbook with a complete chapter per section', () => {
    for (const [slug, sections] of Object.entries(EXPECTED)) {
      expect(listWorkbookTeachingSlugs()).toContain(slug);
      for (let number = 1; number <= sections; number++) {
        const chapter = getWorkbookTeachingChapter(slug, number);
        expect(chapter, `${slug} section ${number}`).not.toBeNull();
        expect(chapter!.heading.length).toBeGreaterThan(10);
        expect(chapter!.text.length).toBeGreaterThan(400);
        expect(chapter!.example.length).toBeGreaterThan(200);
        expect(chapter!.review.length).toBeGreaterThan(20);
        expect(chapter!.diagram.length).toBeGreaterThanOrEqual(4);
        for (const label of chapter!.diagram) expect(label.length).toBeLessThanOrEqual(34);
      }
    }
  });

  it('returns null for unregistered workbooks and sections', () => {
    expect(getWorkbookTeachingChapter('hvac-epa608-guided-practice', 1)).toBeNull();
    expect(getWorkbookTeachingChapter('welding-foundations-guided-practice', 99)).toBeNull();
    expect(getWorkbookTeachingChapter('no-such-workbook', 1)).toBeNull();
  });
});
