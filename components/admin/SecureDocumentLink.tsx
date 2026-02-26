'use client';

import { useState, useCallback } from 'react';

interface SecureDocumentLinkProps {
  /** Document ID — resolved to storage path server-side */
  documentId: string;
  className?: string;
  children?: React.ReactNode;
}

/**
 * Opens a document via a fresh short-lived signed URL.
 * Uses document ID only — path resolution is server-side.
 */
export function SecureDocumentLink({
  documentId,
  className = 'text-brand-blue-600 hover:underline text-sm font-semibold',
  children = 'View',
}: SecureDocumentLinkProps) {
  const [loading, setLoading] = useState(false);

  const handleClick = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/admin/documents/signed-url?id=${encodeURIComponent(documentId)}`
      );
      if (!res.ok) return;
      const { url } = await res.json();
      if (url) window.open(url, '_blank', 'noopener,noreferrer');
    } finally {
      setLoading(false);
    }
  }, [documentId]);

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className={className}
      aria-label="View document securely"
    >
      {loading ? 'Loading…' : children}
    </button>
  );
}
