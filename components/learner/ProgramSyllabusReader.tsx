'use client';
import { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';

export default function ProgramSyllabusReader({ title, path }: { title: string; path: string }) {
  const [body, setBody] = useState('');
  const [error, setError] = useState(false);
  useEffect(() => {
    const controller = new AbortController();
    setBody('');
    setError(false);
    fetch(path, { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error('Syllabus unavailable');
        const text = await response.text();
        if (!controller.signal.aborted) setBody(text);
      })
      .catch(() => {
        if (!controller.signal.aborted) setError(true);
      });
    return () => controller.abort();
  }, [path]);
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5">
      <h2 className="text-xl font-bold text-slate-950">{title}</h2>
      <p className="mt-2 text-sm text-slate-600">
        Read the plan below. Scroll inside this panel to continue.
      </p>
      {error ? (
        <p role="alert" className="mt-4 text-red-800">
          The syllabus could not load.{' '}
          <a className="underline" href={path}>
            Open the syllabus file
          </a>{' '}
          or contact program staff.
        </p>
      ) : !body ? (
        <p role="status">Loading syllabus…</p>
      ) : (
        <div
          tabIndex={0}
          role="region"
          aria-label={`${title} text`}
          className="prose mt-4 max-h-[28rem] max-w-none overflow-y-auto overscroll-contain rounded-xl border border-slate-100 p-4 text-slate-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal-700"
        >
          <ReactMarkdown>{body}</ReactMarkdown>
        </div>
      )}
    </section>
  );
}
