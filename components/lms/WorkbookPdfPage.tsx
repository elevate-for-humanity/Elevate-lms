'use client';
import { useEffect, useRef, useState } from 'react';

/**
 * Renders one page of the workbook's own stored PDF in place, beside the
 * section prompts. The illustrated book is the product (REAL, NOT SKELETON
 * rule): sections must never present as prompts alone while the real book
 * sits unrendered in storage. Rendering is canvas-based via pdfjs-dist so
 * the page displays identically on phone and desktop browsers.
 */
export default function WorkbookPdfPage({
  url,
  page,
  title,
}: {
  url: string;
  page: number;
  title: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading');

  useEffect(() => {
    let cancelled = false;
    setState('loading');
    (async () => {
      try {
        const pdfjs = await import('pdfjs-dist');
        // Vendored copy of pdfjs-dist@5.4.296's worker in apps/lms/public —
        // the new URL(..., import.meta.url) asset form cannot resolve here:
        // pdfjs-dist is a server-external package (pdf-parse needs Node's
        // native canvas), which makes webpack reject the worker asset in
        // the server bundle. Refresh the vendored file on version bumps.
        pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
        const doc = await pdfjs.getDocument({ url }).promise;
        if (cancelled) return;
        const pageNumber = Math.min(Math.max(1, page), doc.numPages);
        const pdfPage = await doc.getPage(pageNumber);
        const canvas = canvasRef.current;
        if (cancelled || !canvas) return;
        const containerWidth = canvas.parentElement?.clientWidth || 640;
        const unscaled = pdfPage.getViewport({ scale: 1 });
        const scale = containerWidth / unscaled.width;
        const viewport = pdfPage.getViewport({ scale });
        const ratio = window.devicePixelRatio || 1;
        canvas.width = Math.floor(viewport.width * ratio);
        canvas.height = Math.floor(viewport.height * ratio);
        canvas.style.width = '100%';
        canvas.style.height = 'auto';
        const context = canvas.getContext('2d');
        if (!context) throw new Error('canvas unavailable');
        context.setTransform(ratio, 0, 0, ratio, 0, 0);
        await pdfPage.render({ canvas, canvasContext: context, viewport }).promise;
        if (!cancelled) setState('ready');
      } catch {
        if (!cancelled) setState('error');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [url, page]);

  return (
    <figure className="my-4 overflow-hidden rounded-xl border border-slate-300 bg-white shadow-sm">
      <canvas
        ref={canvasRef}
        role="img"
        aria-label={`Workbook page ${page}: ${title}`}
        className={state === 'ready' ? 'block w-full' : 'hidden'}
      />
      {state === 'loading' ? (
        <p className="p-5 text-sm leading-relaxed text-slate-600">Loading your workbook page…</p>
      ) : null}
      {state === 'error' ? (
        <p className="p-5 text-sm leading-relaxed">
          This page of your workbook could not be drawn here.{' '}
          <a href={url} target="_blank" rel="noreferrer" className="font-bold underline">
            Open the workbook PDF
          </a>{' '}
          to read page {page}.
        </p>
      ) : null}
      <figcaption className="border-t border-slate-200 bg-stone-50 px-4 py-2 text-xs font-semibold text-slate-600">
        From your workbook · page {page}
      </figcaption>
    </figure>
  );
}
