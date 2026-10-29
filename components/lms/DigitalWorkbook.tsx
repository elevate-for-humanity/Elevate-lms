'use client';
import { useEffect, useState } from 'react';
import WorkbookNarration from './WorkbookNarration';
import WorkbookLessonPicture from './WorkbookLessonPicture';
import { workbookVisualAssignments, type WorkbookVisual } from '@/lib/lms/workbook-visuals';
import { workbookSlides } from '@/lib/lms/workbook-slides';
import { workbookCover } from '@/lib/store/workbook-products';
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
  visual,
}: {
  section: WorkbookSection;
  initial?: WorkbookResponse;
  hidden: boolean;
  readOnly: boolean;
  accountId: string;
  visual?: WorkbookVisual;
}) {
  const { draft, edit, save, status, error } = useWorkbookSave(
    section.id,
    initial,
    readOnly,
    accountId,
  );
  const slides = workbookSlides(section);
  const [step, setStep] = useState(0);
  const [moving, setMoving] = useState(false);
  const slide = slides[step];
  const positionKey = `workbook-screen:${accountId}:${section.id}`;
  useEffect(() => {
    if (readOnly) return;
    try {
      const stored = sessionStorage.getItem(positionKey);
      if (stored !== null) {
        const value = Number(stored);
        if (Number.isInteger(value) && value >= 0 && value < slides.length) setStep(value);
      }
    } catch {
      /* Navigation still works when browser storage is disabled. */
    }
  }, [positionKey, readOnly, slides.length]);
  async function move(next: number) {
    if (moving) return;
    setMoving(true);
    try {
      if (!(await save())) return;
      setStep(next);
      if (!readOnly) {
        try {
          sessionStorage.setItem(positionKey, String(next));
        } catch {
          /* Optional position only. */
        }
      }
    } finally {
      setMoving(false);
    }
  }
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
      <p className="text-sm text-slate-600">Guided workbook · {section.unit}</p>
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
      <div className="my-6 overflow-hidden rounded-2xl border border-stone-300 bg-white shadow-sm">
        <div className="bg-stone-950 p-5 text-white sm:p-8">
          <p className="text-sm font-semibold text-amber-200">
            Screen {step + 1} of {slides.length}
          </p>
          <progress
            aria-label="Section screens"
            value={step + 1}
            max={slides.length}
            className="my-3 h-2 w-full accent-amber-300"
          />
          <h3 className="text-2xl font-bold leading-relaxed sm:text-3xl">{slide.title}</h3>
          {step === 0 && visual && (
            <div className="mt-5">
              <WorkbookLessonPicture key={visual.src} visual={visual} />
            </div>
          )}
          <p className="mt-4 max-w-prose text-xl leading-relaxed">{slide.text}</p>
        </div>
        <div className="p-5 sm:p-8">
          {!hidden && (
            <WorkbookNarration
              text={
                step === 0 && visual
                  ? `${slide.narration} Look at the lesson picture. ${visual.caption}`
                  : slide.narration
              }
            />
          )}
          {slide.field && (
            <div className="my-5">
              <label
                htmlFor={`${section.id}-${slide.field}`}
                className="mb-3 block text-lg font-semibold"
              >
                {slide.field === 'notes'
                  ? 'My key ideas, words to define, and questions for my instructor'
                  : slide.field === 'nextGoal'
                    ? 'Trainer feedback and my next practice goal'
                    : slide.text}
              </label>
              <textarea
                id={`${section.id}-${slide.field}`}
                value={draft.answers[slide.field]}
                disabled={readOnly}
                onChange={(event) =>
                  edit({
                    ...draft,
                    answers: { ...draft.answers, [slide.field!]: event.target.value },
                  })
                }
                onBlur={() => {
                  void save();
                }}
                maxLength={6000}
                rows={6}
                className="w-full rounded-xl border border-stone-400 bg-white p-4 text-lg leading-loose focus:outline-none focus:ring-2 focus:ring-amber-600 disabled:bg-stone-100"
              />
            </div>
          )}
          {slide.review && (
            <dl className="space-y-4">
              {slides
                .filter((item) => item.field)
                .map((item) => (
                  <div key={item.field}>
                    <dt className="font-bold">{item.title}</dt>
                    <dd className="mt-1 whitespace-pre-wrap break-words leading-relaxed">
                      {draft.answers[item.field!] ||
                        'No response yet. Return to this activity to add your answer.'}
                    </dd>
                  </div>
                ))}
            </dl>
          )}
          <nav
            aria-label="Workbook screens"
            className="mt-6 flex items-center justify-between gap-4"
          >
            <button
              type="button"
              disabled={step === 0 || moving}
              onClick={() => {
                void move(step - 1);
              }}
              className="min-h-12 rounded-lg border border-stone-400 px-5 py-3 font-semibold disabled:opacity-40"
            >
              Back
            </button>
            <span className="text-sm">
              {step + 1} / {slides.length}
            </span>
            <button
              type="button"
              disabled={step === slides.length - 1 || moving}
              onClick={() => {
                void move(step + 1);
              }}
              className="min-h-12 rounded-lg bg-stone-900 px-5 py-3 font-semibold text-white disabled:opacity-40"
            >
              {moving ? 'Saving…' : 'Next'}
            </button>
          </nav>
        </div>
      </div>
      {slide.review && (
        <label className="flex items-start gap-3 py-4 text-base leading-relaxed">
          <input
            type="checkbox"
            checked={draft.reviewed}
            disabled={readOnly}
            className="mt-1 h-6 w-6 shrink-0"
            onChange={(event) => edit({ ...draft, reviewed: event.target.checked })}
          />
          I reviewed this lesson and my practice responses. This is my study checklist, not
          instructor approval.
        </label>
      )}
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
  const visuals = workbookVisualAssignments(workbook.slug, sections);
  return (
    <main className="min-h-screen bg-stone-50 px-4 py-8 text-slate-900">
      <div className="mx-auto max-w-5xl">
        <a href="/workbooks" className="inline-block py-3 underline">
          All my workbooks
        </a>
        <p className="mt-4 font-semibold tracking-wide">
          ELEVATE FOR HUMANITY · APPRENTICESHIP PROGRAM
        </p>
        <h1 className="mt-3 text-3xl font-bold leading-relaxed">{workbook.title}</h1>
        <p className="my-4 text-lg leading-relaxed">
          Listen with PARIS. Pause to write. Choose Next when you are ready.
        </p>
        <details className="my-4 rounded-xl border border-stone-300 bg-white p-4">
          <summary className="cursor-pointer font-semibold">
            Workbook cover and licensed access
          </summary>
          {workbook.cover_image && (
            <img
              src={workbookCover(workbook.slug, workbook.cover_image)}
              alt={`${workbook.title} cover`}
              className="my-4 max-h-96 w-full object-contain"
            />
          )}
          <p className="text-sm leading-relaxed">
            © 2026 Elevate for Humanity. All rights reserved. This workbook is licensed only to the
            authorized learner. Unauthorized copying, recording, resale, scraping, and
            redistribution are prohibited.
          </p>
          <p className="mt-2 break-all text-xs">Licensed account: {accountId}</p>
        </details>
        {readOnly && (
          <p role="status" className="my-4 rounded-lg border border-amber-400 p-4">
            Read-only preview. Learners with an active enrollment or verified workbook purchase can
            save answers in their own accounts.
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
              Use these published exercises alongside your course. Workbook study is available
              outside video study windows. Saving answers does not complete lessons or award
              training hours.
            </p>
            {sections.map((section) => (
              <SectionEditor
                key={section.id}
                section={section}
                visual={visuals[section.id]}
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
