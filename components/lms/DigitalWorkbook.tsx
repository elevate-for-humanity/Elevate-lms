'use client';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import WorkbookNarration from './WorkbookNarration';
import LearningWorkspace from './LearningWorkspace';
import WorkbookLessonPicture from './WorkbookLessonPicture';
import WorkbookPdfPage from './WorkbookPdfPage';
import { workbookVisualAssignments, type WorkbookVisual } from '@/lib/lms/workbook-visuals';
import { workbookSlides } from '@/lib/lms/workbook-slides';
import { workbookCover } from '@/lib/store/workbook-products';
import TheoryTimeclock from './TheoryTimeclock';
import HvacSystemLab from './HvacSystemLab';
import HvacWorkbookTeaching from './HvacWorkbookTeaching';
import WorkbookTeaching from './WorkbookTeaching';
import BarberWorkbookSimulator from './BarberWorkbookSimulator';
import BeautyWorkbookSimulator from './BeautyWorkbookSimulator';
import BusinessRetailWorkbookLab from './BusinessRetailWorkbookLab';
import { BUSINESS_RETAIL_WORKBOOK_SLUG } from '@/lib/lms/business-retail-workbook.mjs';
import HvacCompletionReview from './HvacCompletionReview';
import {
  HVAC_COURSE_ID,
  HVAC_WORKBOOK_SLUG,
  HVAC_PRACTICE_LESSONS,
} from '@/lib/lms/hvac-workbook-contract';
import type { Workbook, WorkbookSection, WorkbookResponse } from '@/lib/lms/digital-workbooks';
import { useWorkbookSave } from './useWorkbookSave';
import type { WorkbookAnswers } from '@/lib/lms/workbook-validation';
import { workbookWritingComplete } from '@/lib/lms/workbook-progression';
import { BOOKKEEPING_WORKBOOK_SLUG } from '@/lib/lms/bookkeeping-workbook-contract';
import { bookkeepingWorkedExample } from '@/lib/lms/bookkeeping-workbook-guidance';

function PromptText({ text, id }: { text: string; id?: string }) {
  const parts = text.split(/\s+(?=Guided:|Independent:|Expected |Reviewer rubric:)/);
  return <div id={id} className="mt-4 max-w-prose space-y-3 text-base leading-relaxed sm:text-lg">
    {parts.map((part, index) => <p key={index}>{part}</p>)}
  </div>;
}

export function SectionEditor({
  section,
  initial,
  hidden,
  readOnly,
  accountId,
  visual,
  workbookSlug,
  pdfUrl,
  onReviewSaved,
  sectionPicker,
  showTimeclock = true,
}: {
  section: WorkbookSection;
  initial?: WorkbookResponse;
  hidden: boolean;
  readOnly: boolean;
  accountId: string;
  visual?: WorkbookVisual;
  workbookSlug: string;
  pdfUrl?: string | null;
  onReviewSaved?: (sectionId: string, reviewed: boolean) => void;
  sectionPicker: ReactNode;
  showTimeclock?: boolean;
}) {
  const { draft, edit, save, status, error, recoveryText } = useWorkbookSave(
    section.id,
    initial,
    readOnly,
    accountId,
  );
  const slides = workbookSlides(section, visual?.caption);
  const hasMissingWriting = !workbookWritingComplete(
    draft.answers,
    Math.min(3, section.prompts.length),
  );
  const [step, setStep] = useState(0);
  const [moving, setMoving] = useState(false);
  const slide = slides[step];
  const bookkeeping = workbookSlug === BOOKKEEPING_WORKBOOK_SLUG;
  const workedExample = bookkeeping ? bookkeepingWorkedExample(section.prompts[1] || '') : null;
  const activityText = slide.field === 'practice2' && workedExample ? workedExample.activity : slide.text;
  const positionKey = `workbook-screen:${accountId}:${section.id}`;
  useEffect(() => {
    if (readOnly) return;
    try {
      // A different section is a different lesson. Never infer its completion
      // from training hours or from a previous browser session.
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
      <LearningWorkspace
        instructionLabel="Workbook instructions & answers"
        previewLabel="Practice preview"
        instructions={
          <>
            {sectionPicker}
            {!hidden &&
            showTimeclock &&
            !readOnly &&
            section.course_id &&
            section.course_id !== 'd48c61c4-8880-4d9d-9ab5-fab4dd51b201' &&
            section.lesson_id ? (
              <TheoryTimeclock courseId={section.course_id} lessonId={section.lesson_id} />
            ) : null}
            {!hidden &&
            showTimeclock &&
            readOnly &&
            section.course_id &&
            section.course_id !== 'd48c61c4-8880-4d9d-9ab5-fab4dd51b201' ? (
              <p className="my-4 rounded-xl border border-amber-300 bg-amber-50 p-4 font-bold text-amber-950">
                Theory Timeclock is available for this section in the learner's own account.
                Clocking and saving are disabled in admin preview.
              </p>
            ) : null}
            <p className="text-sm text-slate-600">Guided workbook · {section.unit.split(' — Objectives:')[0]}</p>
            <h2
              id={`section-${section.id}`}
              className="mt-2 break-words text-xl font-bold leading-snug sm:text-2xl"
            >
              {section.section_number}. {section.title}
            </h2>
            {section.course_id && section.lesson_id ? (
              <a className="inline-flex min-h-12 items-center font-bold underline"
                href={`/lms/courses/${section.course_id}/lessons/${section.lesson_id}`}>
                Open the matching course lesson
              </a>
            ) : null}
            <div className="my-6 overflow-hidden rounded-2xl border border-stone-300 bg-white shadow-sm">
              <div className="bg-teal-50 p-5 text-slate-950 sm:p-8">
                <p className="text-sm font-semibold text-teal-800">
                  Screen {step + 1} of {slides.length}
                </p>
                <progress
                  aria-label="Section screens"
                  value={step + 1}
                  max={slides.length}
                  className="my-3 h-2 w-full accent-amber-300"
                />
                <h3 className="text-xl font-bold leading-snug sm:text-2xl">{slide.title}</h3>
                <PromptText text={activityText} id={`${section.id}-activity-instructions`} />
              </div>
              <div className="p-5 sm:p-8">
                {!hidden && <WorkbookNarration text={slide.narration} />}
                {workedExample && slide.field && slide.field !== 'nextGoal' ? (
                  <aside aria-label="Worked bookkeeping example" className="my-5 rounded-xl border border-slate-300 bg-slate-50 p-4">
                    <h4 className="font-bold">Worked example — read before writing</h4>
                    <PromptText text={workedExample.example} />
                  </aside>
                ) : null}
                {slide.field && (
                  <div className="my-5">
                    <label
                      htmlFor={`${section.id}-${slide.field}`}
                      className="mb-3 block text-lg font-semibold"
                    >
                      {slide.field === 'notes'
                        ? 'My key ideas, words to define, and questions for my instructor'
                        : slide.field === 'nextGoal'
                          ? 'My next practice goal and any instructor feedback'
                          : `My answer for ${slide.title.toLowerCase()}`}
                    </label>
                    <textarea
                      id={`${section.id}-${slide.field}`}
                      aria-describedby={`${section.id}-activity-instructions`}
                      value={draft.answers[slide.field]}
                      disabled={readOnly}
                      onChange={(event) => {
                        edit({
                          ...draft,
                          answers: { ...draft.answers, [slide.field!]: event.target.value },
                          reviewed: false,
                        });
                        onReviewSaved?.(section.id, false);
                      }}
                      onBlur={() => {
                        void save();
                      }}
                      maxLength={6000}
                      rows={6}
                      className="w-full rounded-xl border border-stone-400 bg-white p-4 text-lg leading-loose focus:outline-none focus:ring-2 focus:ring-amber-600 disabled:bg-stone-100"
                    />
                  </div>
                )}
                {!hidden &&
                workbookSlug === 'prestige-elevation-barbering' &&
                [15, 18, 22, 23, 24, 25, 26, 27].includes(section.section_number) ? (
                  <BarberWorkbookSimulator sectionNumber={section.section_number} />
                ) : null}
                {!hidden &&
                section.section_number === 1 &&
                [
                  'prestige-elevation-cosmetology',
                  'prestige-elevation-esthetics',
                  'prestige-elevation-nail-technology',
                ].includes(workbookSlug) ? (
                  <BeautyWorkbookSimulator slug={workbookSlug} />
                ) : null}

                {!hidden && workbookSlug === HVAC_WORKBOOK_SLUG ? (
                  <HvacWorkbookTeaching number={section.section_number} />
                ) : null}
                {!hidden && workbookSlug !== HVAC_WORKBOOK_SLUG ? (
                  <WorkbookTeaching slug={workbookSlug} number={section.section_number} />
                ) : null}
                {!hidden &&
                section.course_id === 'd48c61c4-8880-4d9d-9ab5-fab4dd51b201' &&
                [5, 12].includes(section.section_number) ? (
                  <HvacSystemLab />
                ) : null}
                {!hidden &&
                [
                  BUSINESS_RETAIL_WORKBOOK_SLUG,
                  `${BUSINESS_RETAIL_WORKBOOK_SLUG}-startup`,
                ].includes(workbookSlug) ? (
                  <BusinessRetailWorkbookLab
                    sectionNumber={section.section_number}
                    readOnly={readOnly}
                    onRecord={async (record) => {
                      const next = [draft.answers.practice3, record].filter(Boolean).join('\n\n');
                      if (next.length > 6000) return false;
                      edit({ answers: { ...draft.answers, practice3: next }, reviewed: false });
                      onReviewSaved?.(section.id, false);
                      return save();
                    }}
                  />
                ) : null}

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
                          {(draft.answers[item.field!] || '').trim().length < 10 ? (
                            <p className="mt-2 text-sm font-semibold text-amber-900">Add a complete response of at least 10 characters before reviewing this chapter.</p>
                          ) : null}
                          <button type="button" disabled={moving} onClick={() => { void move(slides.indexOf(item)); }} className="mt-2 min-h-12 rounded-lg border border-slate-400 px-4 py-3 font-semibold">Edit {item.title.toLowerCase()}</button>
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
                    {moving ? 'Saving…' : slide.review ? 'Review below' : 'Next'}
                  </button>
                </nav>
              </div>
            </div>
            {slide.review && (
              <label className="flex items-start gap-3 py-4 text-base leading-relaxed">
                <input
                  type="checkbox"
                  checked={draft.reviewed}
                  disabled={readOnly || hasMissingWriting}
                  className="mt-1 h-6 w-6 shrink-0"
                  onChange={(event) => {
                    const reviewed = event.target.checked;
                    edit({ ...draft, reviewed });
                    void save().then((saved) => {
                      if (saved) onReviewSaved?.(section.id, reviewed);
                    });
                  }}
                />
                I reviewed this lesson and my practice responses. This is my study checklist, not
                instructor approval.
              </label>
            )}
            {slide.review && hasMissingWriting && (
              <p className="text-sm font-semibold text-amber-900">
                Finish each writing activity with at least 10 characters before checking this
                section as reviewed. Personal reflections are saved without right-or-wrong grades.
              </p>
            )}
            {recoveryText && (
              <details className="my-4 rounded-xl border border-amber-400 bg-amber-50 p-4">
                <summary className="cursor-pointer font-bold">
                  Copy unsaved answers from this browser
                </summary>
                <p className="my-3">
                  Compare this copy with your saved work before editing. It has not replaced your
                  account answers.
                </p>
                <textarea
                  aria-label="Unsaved workbook recovery copy"
                  readOnly
                  value={recoveryText}
                  rows={12}
                  className="w-full rounded-lg border border-slate-400 bg-white p-3"
                />
              </details>
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
              <span
                role="status"
                aria-live="polite"
                className={`mb-2 block font-semibold ${error ? 'text-red-700' : 'text-slate-700'}`}
              >
                {status}
              </span>
              Wait for “Saved to your account” before closing. Saving does not add training hours or
              mark a course lesson complete.
            </p>
          </>
        }
        preview={
          <>
            <p className="text-sm font-semibold text-teal-900">
              {section.section_number}. {section.title} · {slide.title}
            </p>
            {pdfUrl && section.pdf_page > 0 ? (
              <WorkbookPdfPage url={pdfUrl} page={section.pdf_page} title={section.title} />
            ) : null}
            {visual ? (
              <WorkbookLessonPicture key={visual.src} visual={visual} />
            ) : (
              <p className="rounded-xl border border-slate-200 bg-white p-5 leading-relaxed">
                {section.course_id && section.lesson_id
                  ? 'Use Open the matching course lesson to review the teaching. The activity instructions and answer box are in Workbook instructions & answers.'
                  : 'Follow the activity instructions and write in the answer box. Use Back to check an earlier screen.'}
              </p>
            )}

            <p className="text-sm leading-relaxed text-slate-600">
              Read the activity instructions, write in the answer box, then choose Next.
              On a phone, the practice preview appears below the answer area in Split view.
            </p>
          </>
        }
      />
    </section>
  );
}

export default function DigitalWorkbook({
  workbook,
  sections,
  responses,
  readOnly,
  accountId,
  pdfUrl,
}: {
  workbook: Workbook;
  sections: WorkbookSection[];
  responses: WorkbookResponse[];
  readOnly: boolean;
  accountId: string;
  pdfUrl?: string | null;
}) {
  // Always start with the first workbook lesson when entering from a dashboard.
  // Existing writing is preserved, but a saved browser slide position must never
  // teleport a learner to Week 7 or conceal earlier sections.
  const [active, setActive] = useState(sections[0]?.id ?? '');
  const [reviewedIds, setReviewedIds] = useState<Set<string>>(
    () => new Set(responses.filter((row) => row.reviewed).map((row) => row.section_id)),
  );
  const chapterNavigation = useRef<HTMLDivElement>(null);
  const previousChapter = useRef(active);
  useEffect(() => {
    if (previousChapter.current === active) return;
    previousChapter.current = active;
    chapterNavigation.current?.focus();
  }, [active]);
  useEffect(() => {
    function selectLinkedSection() {
      const requested = window.location.hash.replace(/^#section-/, '');
      const index = sections.findIndex((section) => section.id === requested);
      if (index >= 0) setActive(requested);
    }
    selectLinkedSection();
    window.addEventListener('hashchange', selectLinkedSection);
    return () => window.removeEventListener('hashchange', selectLinkedSection);
  }, [sections]);
  const reviewSaved = (id: string, reviewed: boolean) => {
    setReviewedIds((previous) => {
      const next = new Set(previous);
      if (reviewed) next.add(id);
      else next.delete(id);
      return next;
    });
    // Let the learner decide when to move on after a confirmed saved review.
  };
  const chapterIndex = sections.findIndex((section) => section.id === active);
  const courseId = sections.find((section) => section.course_id)?.course_id;
  const visuals = workbookVisualAssignments(workbook.slug, sections);
  return (
    <div className="min-h-screen bg-stone-50 px-4 py-8 text-slate-900">
      <div className="mx-auto max-w-[1600px]">
        <nav aria-label="Workbook navigation" className="flex flex-wrap gap-5">
          <a href="/workbooks" className="inline-block py-3 underline">All my workbooks</a>
          {courseId ? <a href={`/lms/courses/${courseId}`} className="inline-block py-3 underline">Back to my course</a> : null}
        </nav>
        <p className="mt-3 text-sm font-semibold">ELEVATE FOR HUMANITY · WORKBOOK</p>
        <h1 className="mt-2 text-2xl font-bold leading-snug sm:text-3xl">{workbook.slug === BOOKKEEPING_WORKBOOK_SLUG ? 'Bookkeeping practice workbook' : workbook.title}</h1>
        {workbook.cover_image && (
          <img
            src={workbookCover(workbook.slug, workbook.cover_image)}
            alt={`${workbook.title} cover`}
            className="my-4 h-auto max-h-40 w-full max-w-xs rounded-lg object-contain sm:max-h-56"
          />
        )}
        {workbook.slug === HVAC_WORKBOOK_SLUG && (
          <details className="my-4 rounded-xl border border-slate-300 bg-white p-4">
            <summary className="cursor-pointer font-bold">
              HVAC workbook requirements & practice tests
            </summary>
            {workbook.slug === HVAC_WORKBOOK_SLUG && (
              <img
                src="/images/courses/epa608-workbook-20261102.webp"
                alt="Elevate for Humanity EPA 608 Refrigeration Types I, II and III illustrated practice workbook cover"
                width={1024}
                height={1536}
                className="my-5 h-auto w-32 max-w-full rounded-lg border border-stone-300 shadow-sm sm:w-40"
              />
            )}
            {workbook.slug === HVAC_WORKBOOK_SLUG && (
              <section
                className="my-5 rounded-xl border border-amber-400 bg-amber-50 p-5"
                aria-label="Required HVAC workbook and practice tests"
              >
                <h2 className="text-xl font-bold">Required to finish your HVAC course</h2>
                <p className="mt-3 leading-relaxed">
                  Complete all 17 chapters and 51 activities. Save notes, each practice response,
                  and your next goal with at least 10 meaningful characters in every field, then
                  review and save each chapter checklist. Pass each of the four practice tests at
                  80% or higher. Your existing lesson progress stays saved. Internal practice does
                  not award EPA certification or hands-on hours.
                </p>
                <div className="mt-4 flex flex-wrap gap-3">
                  {HVAC_PRACTICE_LESSONS.map((test) => (
                    <a
                      className="min-h-12 rounded-lg border border-stone-500 bg-white px-4 py-3 font-bold underline"
                      href={`/lms/courses/${HVAC_COURSE_ID}/lessons/${test.id}`}
                      key={test.id}
                    >
                      {test.title} practice test · 25 questions
                    </a>
                  ))}
                </div>
              </section>
            )}
          </details>
        )}
        <section aria-label="How to use this workbook" className="my-4 rounded-xl border border-teal-300 bg-teal-50 p-4">
          <h2 className="text-lg font-bold">What do I do first?</h2>
          <ol className="mt-3 list-decimal space-y-2 pl-5 leading-relaxed">
            <li>Choose a chapter. Read or watch its matching course lesson first.</li>
            <li>Write your notes and answer each practice activity. Next saves your work and opens the next screen.</li>
            <li>Write your next practice goal. On Review your work, check your answers and mark the chapter reviewed.</li>
            <li>Wait for “Saved to your account,” then choose Next chapter. Use Back to my course for lesson assessments.</li>
          </ol>
          <p className="mt-3 text-sm leading-relaxed">Saving writing and reviewing a chapter do not by themselves complete the course or award training hours.</p>
        </section>
        <details className="my-4 rounded-xl border border-stone-300 bg-white p-4">
          <summary className="cursor-pointer font-semibold">
            Workbook license and access
          </summary>
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
        {workbook.slug === HVAC_WORKBOOK_SLUG && (
          <details className="mb-5 rounded-xl border border-slate-300 bg-white p-4">
            <summary className="cursor-pointer font-bold">My HVAC completion checklist</summary>
            <HvacCompletionReview readOnly={readOnly} />
          </details>
        )}
        {sections.length ? (
          <>
            <div ref={chapterNavigation} tabIndex={-1} className="my-5 scroll-mt-4 rounded-xl border border-slate-300 bg-white p-4 focus:outline focus:outline-2 focus:outline-teal-700">
              <label htmlFor="workbook-section" className="mb-2 block text-lg font-bold">Choose a workbook section</label>
              <select id="workbook-section" value={active} onChange={(event) => setActive(event.target.value)} className="min-h-12 w-full min-w-0 rounded-lg border border-slate-400 bg-white p-3 text-base">
                {sections.map((section) => <option key={section.id} value={section.id}>{section.section_number}. {section.title}</option>)}
              </select>
              <p className="mt-3 text-sm leading-relaxed" aria-live="polite">Available chapter {chapterIndex + 1} of {sections.length} · {sections.filter((section) => reviewedIds.has(section.id)).length} reviewed</p>
              <p className="mt-2 text-sm leading-relaxed">You may return to any available chapter. Chapters still being prepared are not shown here.</p>
            </div>
            {sections.map((section) => (
              <SectionEditor
                key={section.id}
                section={section}
                workbookSlug={workbook.slug}
                pdfUrl={pdfUrl}
                visual={visuals[section.id]}
                initial={responses.find((row) => row.section_id === section.id)}
                hidden={section.id !== active}
                readOnly={readOnly}
                accountId={accountId}
                onReviewSaved={reviewSaved}
                sectionPicker={null}
              />
            ))}
            <nav aria-label="Workbook chapters" className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-300 bg-white p-4">
              <button type="button" disabled={chapterIndex <= 0} onClick={() => setActive(sections[chapterIndex - 1].id)} className="min-h-12 rounded-lg border px-4 py-3 font-bold disabled:opacity-40">Previous chapter</button>
              <button type="button" disabled={chapterIndex >= sections.length - 1 || !reviewedIds.has(active)} onClick={() => setActive(sections[chapterIndex + 1].id)} className="min-h-12 rounded-lg bg-teal-900 px-4 py-3 font-bold text-white disabled:opacity-40">Next chapter</button>
              {!reviewedIds.has(active) ? <p className="w-full text-sm leading-relaxed">Complete the writing and save your chapter review to use Next chapter. You can use the chapter menu to revisit other available work.</p> : null}
              {chapterIndex === sections.length - 1 && reviewedIds.has(active) ? <p className="w-full leading-relaxed">This is the last currently available chapter. Return to your course for assessments and any remaining requirements.</p> : null}
            </nav>
          </>
        ) : (
          <p className="rounded-lg border p-5 leading-relaxed">
            No sections are available yet. Check your course release schedule or contact your
            instructor.
          </p>
        )}
      </div>
    </div>
  );
}
