import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

// REAL, NOT SKELETON (Elizabeth, 2026-11-26): a workbook whose illustrated
// PDF exists in storage must render the book's pages in the student view —
// never prompts alone. These contracts pin the wiring end to end.
const loader = readFileSync('lib/lms/digital-workbooks.ts', 'utf8');
const viewer = readFileSync('components/lms/DigitalWorkbook.tsx', 'utf8');
const pdfPage = readFileSync('components/lms/WorkbookPdfPage.tsx', 'utf8');
const lessonLoader = readFileSync('lib/lms/lesson-workbook.ts', 'utf8');
const lessonWorkbook = readFileSync('components/lms/LessonWorkbook.tsx', 'utf8');

describe('workbook PDF rendering', () => {
  it('loader selects the stored book and hands the viewer a signed URL', () => {
    expect(loader).toContain('pdf_storage_path');
    expect(loader).toContain(".from('documents')");
    expect(loader).toContain('createSignedUrl');
    expect(loader).toContain('pdfUrl');
  });

  it('viewer renders the real book page in the practice preview', () => {
    expect(viewer).toContain("import WorkbookPdfPage from './WorkbookPdfPage';");
    expect(viewer).toContain('<WorkbookPdfPage url={pdfUrl} page={section.pdf_page}');
    expect(viewer).toContain('pdfUrl={pdfUrl}');
  });

  it('book page renders via pdfjs canvas (phone + desktop safe)', () => {
    expect(pdfPage).toContain("await import('pdfjs-dist')");
    expect(pdfPage).toContain('getDocument');
    expect(pdfPage).toContain('canvas');
    // A failed draw still leaves the student a path to the real book.
    expect(pdfPage).toContain('Open the workbook PDF');
  });

  it('lesson-embedded workbook renders the same real book', () => {
    expect(lessonLoader).toContain('pdf_storage_path');
    expect(lessonLoader).toContain('createSignedUrl');
    expect(lessonWorkbook).toContain('pdfUrl={pdfUrl}');
  });

  it('narration stays wired to the slide content', () => {
    expect(viewer).toContain('<WorkbookNarration text={slide.narration} />');
  });
});
