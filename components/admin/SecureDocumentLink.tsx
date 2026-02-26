'use client';

import { useState, useCallback } from 'react';

interface SecureDocumentLinkProps {
  /** Document ID — preferred, resolves path server-side */
  documentId?: string;
  /** File path — fallback for legacy usage */
  filePath?: string;
  bucket?: string;
  className?: string;
  children?: React.ReactNode;
}

/**
 * Opens a document via a fresh short-lived signed URL.
 * Prefers documentId (server-side path resolution) over raw filePath.
 */
export function SecureDocumentLink({
  documentId,
  filePath,
  bucket = 'documents',
  className = 'text-brand-blue-600 hover:underline text-sm font-semibold',
  children = 'View',
}: SecureDocumentLinkProps) {
  const [loading, setLoading] = useState(false);

  const handleClick = useCallback(async () => {
    setLoading(true);
    try {
      // Prefer document ID (server-side resolution) over raw path
      const params = documentId
        ? `id=${encodeURIComponent(documentId)}`
        : `path=${encodeURIComponent(filePath || '')}&bucket=${encodeURIComponent(bucket)}`;

      const res = await fetch(`/api/admin/documents/signed-url?${params}`);
      if (!res.ok) return;
      const { url } = await res.json();
      if (url) window.open(url, '_blank', 'noopener,noreferrer');
    } finally {
      setLoading(false);
    }
  }, [documentId, filePath, bucket]);

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
