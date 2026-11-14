'use client';
import { useState } from 'react';
import { ProgramNarration } from '@/components/programs/NarratedProgramIntro';

export default function WorkbookPreview({ subject }: { subject: string }) {
  const [open, setOpen] = useState(false);
  const [page, setPage] = useState(0);
  const [notes, setNotes] = useState(['', '', '']);
  const prompts = [
    'Write one learning goal to discuss with your trainer.',
    'Record a question you want to ask during supervised practice.',
    'Write your next step and how you will review it with your trainer.',
  ];
  return (
    <div className="mt-4 text-slate-950">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="min-h-11 w-full rounded-lg border border-slate-300 px-4 py-2 text-sm font-bold"
      >
        {open ? 'Close preview' : 'Open workbook preview'}
      </button>
      {open && (
        <div className="mt-3 rounded-xl border border-stone-300 bg-stone-50 p-4">
          <p className="text-xs font-bold uppercase text-orange-800">
            {subject} · Interface preview
          </p>
          <p className="mt-2 text-xs leading-5 text-slate-600">
            Sample activity. The purchased workbook contains the full curriculum. Preview notes stay
            in this page and are not saved to your account.
          </p>
          <h3 className="mt-3 text-base font-bold">
            {['Set a goal', 'Ask and practice', 'Reflect'][page]}
          </h3>
          <label className="mt-3 block text-sm leading-6">
            {prompts[page]}
            <textarea
              value={notes[page]}
              onChange={(event) =>
                setNotes((values) =>
                  values.map((value, index) => (index === page ? event.target.value : value)),
                )
              }
              rows={3}
              className="mt-2 block w-full rounded-lg border border-stone-300 bg-white p-3"
            />
          </label>
          <div className="mt-3 flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => setPage((value) => value - 1)}
              disabled={page === 0}
              className="min-h-11 px-3 text-sm font-bold disabled:opacity-40"
            >
              Back
            </button>
            <span className="text-xs">{page + 1} / 3</span>
            <button
              type="button"
              onClick={() => setPage((value) => (value + 1) % 3)}
              className="min-h-11 px-3 text-sm font-bold"
            >
              {page === 2 ? 'Start again' : 'Next'}
            </button>
          </div>
          <ProgramNarration
            key={page}
            text={`${subject} workbook preview. ${prompts[page]} Pause to write, then choose Next when ready.`}
          />
        </div>
      )}
    </div>
  );
}
