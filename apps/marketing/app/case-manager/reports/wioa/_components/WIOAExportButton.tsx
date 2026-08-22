'use client';

import { useState } from 'react';
import { Download } from 'lucide-react';

export default function WIOAExportButton() {
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState('');

  async function download() {
    setDownloading(true);
    setError('');
    try {
      // Identity and caseload scope are resolved exclusively from the authenticated session.
      const response = await fetch('/api/case-manager/wioa-export', { method: 'GET', cache: 'no-store' });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || 'Unable to export WIOA report.');
      }
      const blob = await response.blob();
      const disposition = response.headers.get('content-disposition') || '';
      const match = disposition.match(/filename="([^"]+)"/);
      const filename = match?.[1] || `wioa-outcomes-${new Date().toISOString().slice(0, 10)}.csv`;
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = filename;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to export WIOA report.');
    } finally {
      setDownloading(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button type="button" onClick={download} disabled={downloading} className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-brand-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-blue-800 disabled:opacity-60">
        <Download className="h-4 w-4" aria-hidden="true" />
        {downloading ? 'Preparing…' : 'Export CSV'}
      </button>
      {error ? <span role="alert" className="text-xs text-red-700">{error}</span> : null}
    </div>
  );
}
