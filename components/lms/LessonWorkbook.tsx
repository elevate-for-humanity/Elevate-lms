'use client';

import { useState } from 'react';
import { SectionEditor } from './DigitalWorkbook';
import { workbookVisualAssignments } from '@/lib/lms/workbook-visuals';
import type { Workbook, WorkbookSection, WorkbookResponse } from '@/lib/lms/digital-workbooks';

export default function LessonWorkbook({
  workbook,
  section,
  response,
  accountId,
  readOnly,
}: {
  workbook: Workbook;
  section: WorkbookSection;
  response?: WorkbookResponse;
  accountId: string;
  readOnly: boolean;
}) {
  const [reviewed, setReviewed] = useState(response?.reviewed === true);
  const visual = workbookVisualAssignments(workbook.slug, [section])[section.id];
  return (
    <section
      id="lesson-workbook"
      aria-label="Required lesson workbook"
      className="rounded-2xl border border-teal-300 bg-white p-4 sm:p-6"
    >
      <h2 className="text-2xl font-bold">Workbook · work alongside this lesson</h2>
      <p className="my-3 leading-relaxed">
        Study the lesson, complete the matching practice below, save your answers, and review your
        chapter before marking the lesson complete.
      </p>
      <p role="status" className="my-3 font-semibold">
        {readOnly
          ? 'Administrator preview · saving is disabled'
          : reviewed
            ? 'Chapter review saved. You can finish the lesson assessment below.'
            : 'This chapter’s saved activities and review are required for lesson completion.'}
      </p>
      <SectionEditor
        key={`${accountId}:${section.id}`}
        section={section}
        initial={response}
        hidden={false}
        readOnly={readOnly}
        accountId={accountId}
        workbookSlug={workbook.slug}
        sectionPicker={null}
        visual={visual}
        onReviewSaved={(_, value) => setReviewed(value)}
      />
    </section>
  );
}
