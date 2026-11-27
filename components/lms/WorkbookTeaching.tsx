'use client';

import { useState } from 'react';
import { LearningPreview } from './LearningWorkspace';
import WorkbookNarration from './WorkbookNarration';
import { getWorkbookTeachingChapter } from '@/lib/lms/workbook-teaching';

/**
 * Generic workbook teaching block — the HVAC pattern
 * (components/lms/HvacWorkbookTeaching.tsx) for every workbook whose
 * authored content lives in lib/lms/workbook-teaching/. Renders, inside
 * the workbook's main flow: a labeled diagram of the section's process,
 * paged instruction condensed from the linked lesson with narration that
 * plays through the natural-voice service, a worked example, and a
 * self-check. Returns null for workbooks/sections without authored
 * content, leaving their existing rendering untouched.
 */
export default function WorkbookTeaching({
  slug,
  number,
}: {
  slug: string;
  number: number;
}) {
  const [active, setActive] = useState(0);
  const chapter = getWorkbookTeachingChapter(slug, number);
  if (!chapter) return null;

  const pages = [
    ...(chapter.lessons ?? []),
    { heading: chapter.heading, text: chapter.text },
    { heading: 'Worked example', text: chapter.example },
  ];
  const page = pages[Math.min(active, pages.length - 1)];
  const diagram = chapter.diagram.filter(Boolean);

  return (
    <section
      className="my-6 space-y-5 rounded-2xl border border-stone-300 bg-stone-50 p-4 sm:p-6"
      aria-label={`Section ${number} illustrated instruction`}
    >
      <h3 className="text-2xl font-bold">Learn and work through the example</h3>

      {diagram.length > 0 ? (
        <LearningPreview>
          <figure>
            <svg
              viewBox={`0 0 680 ${Math.max(90, Math.ceil(diagram.length / 2) * 92)}`}
              role="img"
              aria-label={diagram.join(' → ')}
              className="w-full rounded-xl bg-white"
            >
              {diagram.map((label, index) => {
                const col = index % 2;
                const row = Math.floor(index / 2);
                const x = col === 0 ? 24 : 356;
                const y = 18 + row * 92;
                const nextX = col === 0 ? 356 : 24;
                const nextY = col === 0 ? y : y + 92;
                const hasNext = index < diagram.length - 1;
                return (
                  <g key={`${label}-${index}`}>
                    <rect x={x} y={y} width={300} height={64} rx={12} fill="#eef2ff" stroke="#44403c" />
                    <circle cx={x + 26} cy={y + 32} r={15} fill="#4338ca">
                      <title>{`Step ${index + 1}`}</title>
                    </circle>
                    <text x={x + 26} y={y + 38} fontSize={16} fill="#ffffff" textAnchor="middle">
                      {index + 1}
                    </text>
                    <text x={x + 52} y={y + 38} fontSize={15} fill="#1c1917">
                      {label.length > 34 ? `${label.slice(0, 33)}…` : label}
                    </text>
                    {hasNext ? (
                      <path
                        d={
                          col === 0
                            ? `M ${x + 300} ${y + 32} H ${nextX}`
                            : `M ${x + 150} ${y + 64} V ${nextY}`
                        }
                        stroke="#4338ca"
                        strokeWidth={3}
                        markerEnd="url(#wb-arrow)"
                      />
                    ) : null}
                  </g>
                );
              })}
              <defs>
                <marker id="wb-arrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">
                  <path d="M0 0 L8 4 L0 8 Z" fill="#4338ca" />
                </marker>
              </defs>
            </svg>
            <figcaption className="mt-2 text-sm">
              Learning map: {chapter.heading}. Follow the steps in order; the prompts below ask you to
              apply them.
            </figcaption>
          </figure>
        </LearningPreview>
      ) : null}

      {chapter.image ? (
        <LearningPreview>
          <figure>
            <img
              src={chapter.image}
              alt={chapter.imageAlt || chapter.heading}
              loading="lazy"
              className="max-h-72 w-full rounded-xl bg-white object-contain"
            />
            <figcaption className="mt-2 text-sm">
              Workplace context for the matching lesson.
            </figcaption>
          </figure>
        </LearningPreview>
      ) : null}

      <article className="rounded-xl border bg-white p-4">
        <p className="mb-3 font-semibold">
          Instruction {active + 1} of {pages.length}
        </p>
        <h4 className="text-xl font-bold">{page.heading}</h4>
        <p className="mt-3 max-w-prose leading-loose">{page.text}</p>
        <WorkbookNarration
          text={`${page.heading}. ${page.text} Pause and explain the idea in your own words.`}
        />
        <nav aria-label="Workbook instruction pages" className="mt-4 flex flex-wrap gap-3">
          <button
            type="button"
            disabled={active === 0}
            onClick={() => setActive((value) => value - 1)}
            className="min-h-12 rounded-lg border px-4 py-3 disabled:opacity-40"
          >
            Previous explanation
          </button>
          <button
            type="button"
            disabled={active === pages.length - 1}
            onClick={() => setActive((value) => value + 1)}
            className="min-h-12 rounded-lg bg-stone-900 px-4 py-3 text-white disabled:opacity-40"
          >
            Next explanation
          </button>
        </nav>
      </article>

      <p className="rounded-lg bg-white p-4 font-semibold">Self-check: {chapter.review}</p>
    </section>
  );
}
