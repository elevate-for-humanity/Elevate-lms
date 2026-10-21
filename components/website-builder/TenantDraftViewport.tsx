'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

/** Keep editable draft previews in a real viewport without saving or publishing. */
export function TenantDraftViewport({ children, width, title }: { children: ReactNode; width: number; title: string }) {
  const [frameDocument, setFrameDocument] = useState<Document | null>(null);
  const frameRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    const frame = frameRef.current;
    if (!frame) return;
    const initialize = () => setFrameDocument(frame.contentDocument);
    frame.addEventListener('load', initialize);
    // Server-rendered iframes can finish loading before React hydrates them.
    initialize();
    return () => frame.removeEventListener('load', initialize);
  }, []);

  useEffect(() => {
    if (!frameDocument) return;
    const styles = Array.from(document.querySelectorAll('link[rel="stylesheet"], style')).map((source) => {
      const copy = source.cloneNode(true);
      frameDocument.head.appendChild(copy);
      return copy;
    });
    return () => styles.forEach((style) => style.parentNode?.removeChild(style));
  }, [frameDocument]);

  return <iframe
    ref={frameRef}
    title={title}
    srcDoc={'<!doctype html><html lang="en"><head><meta name="viewport" content="width=device-width, initial-scale=1"><style>body{margin:0}</style></head><body></body></html>'}
    style={{ width, height: 800 }}
    className="mx-auto block border-0 bg-white shadow-sm"
    allow="microphone 'none'; camera 'none'"
  >{frameDocument ? createPortal(children, frameDocument.body) : null}</iframe>;
}
