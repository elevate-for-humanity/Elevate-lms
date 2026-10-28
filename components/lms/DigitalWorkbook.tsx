'use client';
import { useState } from 'react';
import TheoryTimeclock from './TheoryTimeclock';
import type { Workbook, WorkbookSection, WorkbookResponse } from '@/lib/lms/digital-workbooks';
import { useWorkbookSave } from './useWorkbookSave';
import type { WorkbookAnswers } from '@/lib/lms/workbook-validation';

function SectionEditor({
  section,
  initial,
  hidden,
  readOnly,
  accountId,
}: {
  section: WorkbookSection;
  initial?: WorkbookResponse;
  hidden: boolean;
  readOnly: boolean;
  accountId: string;
}) {
  const { draft, edit, save, status, error } = useWorkbookSave(
    section.id,
    initial,
    readOnly,
    accountId,
  );
  const fields: { key: keyof WorkbookAnswers; label: string }[] = [
    { key: 'notes', label: 'My key ideas, words to define, and questions for my instructor' },
    ...section.prompts.map((label, index) => ({
      key: `practice${index + 1}` as keyof WorkbookAnswers,
      label: `${index + 1}. ${label}`,
    })),
    { key: 'nextGoal', label: 'Trainer feedback and my next practice goal' },
  ];
  return (
    <section hidden={hidden} aria-labelledby={`section-${section.id}`}>
      {!hidden && !readOnly && section.course_id && section.lesson_id ? (
        <TheoryTimeclock courseId={section.course_id} lessonId={section.lesson_id} />
      ) : null}
      {!hidden && readOnly && section.course_id ? (
        <p className="my-4 rounded-xl border border-amber-300 bg-amber-50 p-4 font-bold text-amber-950">
          Theory Timeclock is available for this section in the learner's own account. Clocking and
          saving are disabled in admin preview.
        </p>
      ) : null}
      <p className="text-sm text-slate-600">
        Workbook pages {section.pdf_page}–{section.pdf_page + 1} · {section.unit}
      </p>
      <h2
        id={`section-${section.id}`}
        className="mt-2 text-2xl font-bold leading-relaxed break-words"
      >
        {section.section_number}. {section.title}
      </h2>
      <div className="my-4 flex flex-wrap items-center gap-3">
        <button
          type="button"
          disabled={readOnly}
          onClick={() => {
            void save();
          }}
          className="min-h-12 rounded-lg bg-slate-900 px-5 py-3 font-semibold text-white disabled:opacity-50"
        >
          Save answers
        </button>
        <p
          role="status"
          aria-live="polite"
          className={`max-w-prose leading-relaxed ${error ? 'text-red-700' : 'text-slate-700'}`}
        >
          {status}
        </p>
      </div>
      {fields.map((field) => (
        <div key={field.key} className="my-6">
          <label
            htmlFor={`${section.id}-${field.key}`}
            className="mb-2 block text-lg font-semibold leading-relaxed"
          >
            {field.label}
          </label>
          <textarea
            id={`${section.id}-${field.key}`}
            value={draft.answers[field.key]}
            disabled={readOnly}
            onChange={(event) =>
              edit({ ...draft, answers: { ...draft.answers, [field.key]: event.target.value } })
            }
            onBlur={() => {
              void save();
            }}
            maxLength={6000}
            rows={5}
            className="w-full max-w-full rounded-lg border border-slate-400 bg-white p-4 text-base leading-loose focus:outline-none focus:ring-2 focus:ring-blue-700 disabled:bg-slate-100"
          />
        </div>
      ))}
      <label className="flex items-start gap-3 py-4 text-base leading-relaxed">
        <input
          type="checkbox"
          checked={draft.reviewed}
          disabled={readOnly}
          className="mt-1 h-6 w-6 shrink-0"
          onChange={(event) => edit({ ...draft, reviewed: event.target.checked })}
        />
        I reviewed this lesson and my practice responses. This is my study checklist, not instructor
        approval.
      </label>
      <button
        type="button"
        disabled={readOnly}
        onClick={() => {
          void save();
        }}
        className="min-h-12 rounded-lg bg-slate-900 px-5 py-3 font-semibold text-white disabled:opacity-50"
      >
        Save answers
      </button>
      <p className="mt-3 text-sm leading-relaxed">
        <span className={`mb-2 block font-semibold ${error ? 'text-red-700' : 'text-slate-700'}`}>
          {status}
        </span>
        Wait for “Saved to your account” before closing. Saving does not add training hours or mark
        a course lesson complete.
      </p>
    </section>
  );
}

export default function DigitalWorkbook({
  workbook,
  sections,
  responses,
  readOnly,
  accountId,
}: {
  workbook: Workbook;
  sections: WorkbookSection[];
  responses: WorkbookResponse[];
  readOnly: boolean;
  accountId: string;
}) {
  const [active, setActive] = useState(sections[0]?.id ?? '');
  return (
    <main className="min-h-screen bg-stone-50 px-4 py-8 text-slate-900">
      <div className="mx-auto max-w-3xl">
        <a href="/workbooks" className="inline-block py-3 underline">
          All my workbooks
        </a>
        <p className="mt-4 font-semibold tracking-wide">
          ELEVATE FOR HUMANITY · APPRENTICESHIP PROGRAM
        </p>
        <h1 className="mt-3 text-3xl font-bold leading-relaxed">{workbook.title}</h1>
        <aside
          aria-label="Workbook copyright and licensed access"
          className="my-4 rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm leading-relaxed text-slate-900"
        >
          <strong>© 2026 Elevate for Humanity. All rights reserved.</strong>
          <p>
            This workbook is licensed only to the authorized learner. Unauthorized copying,
            recording, resale, scraping, and redistribution are prohibited.
          </p>
          <p className="mt-2 break-all text-xs">Licensed account: {accountId}</p>
        </aside>
        <p className="my-4 rounded-lg border border-slate-300 bg-white p-3 text-sm">
          Protected workbook: complete and save your answers here. Source PDF downloads are
          disabled.
        </p>
        <p className="my-4 text-lg leading-relaxed">
          Write directly in the boxes below. Your answers save to your LMS account and reopen when
          you return.
        </p>
        {readOnly && (
          <p role="status" className="my-4 rounded-lg border border-amber-400 p-4">
            Read-only preview. Learners with an active enrollment or verified workbook purchase
            can save answers in their own accounts.
          </p>
        )}
        {sections.length ? (
          <>
            <label htmlFor="workbook-section" className="mb-2 block text-lg font-semibold">
              Choose a workbook section
            </label>
            <select
              id="workbook-section"
              value={active}
              onChange={(event) => setActive(event.target.value)}
              className="mb-6 min-h-12 w-full rounded-lg border border-slate-400 bg-white p-3 text-base"
            >
              {sections.map((section) => (
                <option key={section.id} value={section.id}>
                  {section.section_number}. {section.title}
                </option>
              ))}
            </select>
            <p className="mb-6 leading-relaxed text-slate-600">
              Use these published exercises alongside your course. Workbook study is available outside
              video study windows. Saving answers does not complete lessons or award training hours.
            </p>
            {sections.map((section) => (
              <SectionEditor
                key={section.id}
                section={section}
                initial={responses.find((row) => row.section_id === section.id)}
                hidden={section.id !== active}
                readOnly={readOnly}
                accountId={accountId}
              />
            ))}
          </>
        ) : (
          <p className="rounded-lg border p-5 leading-relaxed">
            No sections are available yet. Check your course release schedule or contact your
            instructor.
          </p>
        )}
      </div>
    </main>
  );
}
