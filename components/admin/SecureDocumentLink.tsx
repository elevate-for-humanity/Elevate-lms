'use client';

import { useState, useCallback } from 'react';

interface SecureDocumentLinkProps {
  filePath: string;
  bucket?: string;
  className?: string;
  children?: React.ReactNode;
}

/**
 * Opens a document via a fresh short-lived signed URL.
 * Fetches the URL on click so it never expires before use.
 */
export function SecureDocumentLink({
  filePath,
  bucket = 'documents',
  className = 'text-brand-blue-600 hover:underline text-sm font-semibold',
  children = 'View',
}: SecureDocumentLinkProps) {
  const [loading, setLoading] = useState(false);

  const handleClick = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/admin/documents/signed-url?path=${encodeURIComponent(filePath)}&bucket=${encodeURIComponent(bucket)}`
      );
      if (!res.ok) return;
      const { url } = await res.json();
      if (url) window.open(url, '_blank', 'noopener,noreferrer');
    } finally {
      setLoading(false);
    }
  }, [filePath, bucket]);

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
