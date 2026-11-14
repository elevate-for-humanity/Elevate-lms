'use client';
import { useState } from 'react';
export function FilingExportButton({ returnId }: { returnId: string }) {
  const [busy, setBusy] = useState(false),
    [error, setError] = useState('');
  async function download() {
    setBusy(true);
    setError('');
    try {
      const response = await fetch(
        '/api/tax/returns/export?returnId=' + encodeURIComponent(returnId),
        { cache: 'no-store' },
      );
      if (!response.ok) {
        const body = await response.json();
        throw Error(body.error || 'Unable to prepare your filing export');
      }
      const blob = await response.blob(),
        url = URL.createObjectURL(blob),
        link = document.createElement('a');
      link.href = url;
      link.download = 'federal-return-2026.xml';
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to prepare your filing export');
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <button
        onClick={() => void download()}
        disabled={busy}
        className="mt-4 inline-flex rounded-xl bg-red-700 px-5 py-3 font-semibold text-white disabled:opacity-50"
      >
        {busy ? 'Preparing export…' : 'Download federal filing file'}
      </button>
      {error && (
        <p role="alert" className="mt-3 text-sm text-red-800">
          {error}
        </p>
      )}
    </>
  );
}
