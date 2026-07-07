'use client';

import { useState } from 'react';
import { Download, Loader2 } from 'lucide-react';

interface DownloadReportButtonProps {
  reportId: string;
  format?: 'pdf' | 'csv';
}

export function DownloadReportButton({ reportId, format = 'pdf' }: DownloadReportButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleDownload = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/accreditation/reports/${reportId}/download?format=${format}`);
      if (res.ok) {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `accreditation-report-${reportId}.${format}`;
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch (err) {
      console.error('Download failed:', err);
    }
    setLoading(false);
  };

  return (
    <button
      onClick={handleDownload}
      disabled={loading}
      className="flex items-center gap-2 px-4 py-2 bg-brand-blue-600 text-white rounded-lg hover:bg-brand-blue-700 disabled:opacity-50"
    >
      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
      Download {format.toUpperCase()}
    </button>
  );
}
