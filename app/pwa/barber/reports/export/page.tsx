'use client';

import { useState } from 'react';
import Link from 'next/link';
import { 
  ArrowLeft, Download, FileText, Calendar, 
  CheckCircle, Loader2, AlertCircle, FileSpreadsheet,
  Printer, Mail, Share2
} from 'lucide-react';

type ExportFormat = 'pdf' | 'csv' | 'excel';
type DateRange = 'week' | 'month' | 'quarter' | 'year' | 'all' | 'custom';

interface ExportOptions {
  format: ExportFormat;
  dateRange: DateRange;
  customStartDate: string;
  customEndDate: string;
  includePhotos: boolean;
  includeSignatures: boolean;
  groupByCategory: boolean;
}

const FORMAT_OPTIONS: { value: ExportFormat; label: string; icon: React.ReactNode; description: string }[] = [
  { value: 'pdf', label: 'PDF Document', icon: <FileText className="w-5 h-5" />, description: 'Best for printing and official records' },
  { value: 'csv', label: 'CSV Spreadsheet', icon: <FileSpreadsheet className="w-5 h-5" />, description: 'Compatible with any spreadsheet app' },
  { value: 'excel', label: 'Excel File', icon: <FileSpreadsheet className="w-5 h-5" />, description: 'Full formatting for Microsoft Excel' },
];

const DATE_RANGES: { value: DateRange; label: string }[] = [
  { value: 'week', label: 'This Week' },
  { value: 'month', label: 'This Month' },
  { value: 'quarter', label: 'This Quarter' },
  { value: 'year', label: 'This Year' },
  { value: 'all', label: 'All Time' },
  { value: 'custom', label: 'Custom Range' },
];

export default function ExportReportsPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  
  const [options, setOptions] = useState<ExportOptions>({
    format: 'pdf',
    dateRange: 'month',
    customStartDate: '',
    customEndDate: '',
    includePhotos: false,
    includeSignatures: true,
    groupByCategory: true,
  });

  const handleExport = async () => {
    if (options.dateRange === 'custom' && (!options.customStartDate || !options.customEndDate)) {
      setError('Please select start and end dates for custom range');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/reports/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(options),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Export failed');
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      setDownloadUrl(url);
      setSuccess(true);

      // Auto-download
      const a = document.createElement('a');
      a.href = url;
      a.download = `hours-report.${options.format === 'excel' ? 'xlsx' : options.format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (err: any) {
      setError('An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async () => {
    if (navigator.share && downloadUrl) {
      try {
        const response = await fetch(downloadUrl);
        const blob = await response.blob();
        const file = new File([blob], `hours-report.${options.format}`, { type: blob.type });
        
        await navigator.share({
          title: 'Hours Report',
          files: [file],
        });
      } catch (err) {
        // User cancelled or share failed
      }
    }
  };

  const handleEmail = () => {
    const subject = encodeURIComponent('Hours Report');
    const body = encodeURIComponent('Please find my hours report attached.');
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  };

  const handlePrint = () => {
    if (downloadUrl && options.format === 'pdf') {
      const printWindow = window.open(downloadUrl, '_blank');
      printWindow?.print();
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6">
        <div className="text-center max-w-md w-full">
          <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-4">Report Exported!</h1>
          <p className="text-slate-400 mb-8">
            Your {FORMAT_OPTIONS.find(f => f.value === options.format)?.label} has been generated.
          </p>
          
          <div className="bg-slate-800 rounded-xl p-4 mb-6">
            <div className="flex justify-center gap-4">
              {options.format === 'pdf' && (
                <button
                  onClick={handlePrint}
                  className="flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-slate-700 transition-colors"
                >
                  <div className="w-12 h-12 bg-slate-700 rounded-full flex items-center justify-center">
                    <Printer className="w-5 h-5 text-brand-blue-400" />
                  </div>
                  <span className="text-slate-300 text-sm">Print</span>
                </button>
              )}
              <button
                onClick={handleEmail}
                className="flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-slate-700 transition-colors"
              >
                <div className="w-12 h-12 bg-slate-700 rounded-full flex items-center justify-center">
                  <Mail className="w-5 h-5 text-brand-blue-400" />
                </div>
                <span className="text-slate-300 text-sm">Email</span>
              </button>
              {'share' in navigator && (
                <button
                  onClick={handleShare}
                  className="flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-slate-700 transition-colors"
                >
                  <div className="w-12 h-12 bg-slate-700 rounded-full flex items-center justify-center">
                    <Share2 className="w-5 h-5 text-brand-blue-400" />
                  </div>
                  <span className="text-slate-300 text-sm">Share</span>
                </button>
              )}
            </div>
          </div>

          <div className="space-y-3">
            {downloadUrl && (
              <a
                href={downloadUrl}
                download={`hours-report.${options.format === 'excel' ? 'xlsx' : options.format}`}
                className="block w-full bg-brand-blue-600 text-white font-bold py-4 rounded-xl hover:bg-brand-blue-700"
              >
                <Download className="w-5 h-5 inline mr-2" />
                Download Again
              </a>
            )}
            <button
              onClick={() => {
                setSuccess(false);
                setDownloadUrl(null);
              }}
              className="w-full bg-slate-800 text-white font-bold py-4 rounded-xl hover:bg-slate-700"
            >
              Export Another Report
            </button>
            <Link
              href="/pwa/barber"
              className="block w-full text-slate-400 py-4 hover:text-white"
            >
              Return to Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900">
      <header className="bg-slate-800 px-4 pt-12 pb-6 safe-area-inset-top">
        <div className="flex items-center gap-4">
          <Link href="/pwa/barber" className="w-10 h-10 bg-slate-700 rounded-full flex items-center justify-center">
            <ArrowLeft className="w-5 h-5 text-white" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-white">Export Report</h1>
            <p className="text-slate-400 text-sm">Download your hours record</p>
          </div>
        </div>
      </header>

      <main className="px-4 py-6 space-y-6">
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-red-200 text-sm">{error}</p>
          </div>
        )}

        {/* Format Selection */}
        <div className="bg-slate-800 rounded-xl p-4">
          <label className="text-slate-400 text-sm mb-3 block">Export Format</label>
          <div className="space-y-2">
            {FORMAT_OPTIONS.map((format) => (
              <button
                key={format.value}
                onClick={() => setOptions(prev => ({ ...prev, format: format.value }))}
                className={`w-full flex items-center gap-4 p-4 rounded-xl transition-colors ${
                  options.format === format.value
                    ? 'bg-brand-blue-600 text-white'
                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                }`}
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  options.format === format.value ? 'bg-brand-blue-500' : 'bg-slate-600'
                }`}>
                  {format.icon}
                </div>
                <div className="text-left flex-1">
                  <div className="font-medium">{format.label}</div>
                  <div className={`text-sm ${options.format === format.value ? 'text-brand-blue-200' : 'text-slate-500'}`}>
                    {format.description}
                  </div>
                </div>
                {options.format === format.value && (
                  <CheckCircle className="w-5 h-5" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Date Range */}
        <div className="bg-slate-800 rounded-xl p-4">
          <label className="flex items-center gap-3 text-slate-400 text-sm mb-3">
            <Calendar className="w-4 h-4" />
            Date Range
          </label>
          <div className="grid grid-cols-2 gap-2">
            {DATE_RANGES.map((range) => (
              <button
                key={range.value}
                onClick={() => setOptions(prev => ({ ...prev, dateRange: range.value }))}
                className={`p-3 rounded-xl text-sm font-medium transition-colors ${
                  options.dateRange === range.value
                    ? 'bg-brand-blue-600 text-white'
                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                }`}
              >
                {range.label}
              </button>
            ))}
          </div>

          {options.dateRange === 'custom' && (
            <div className="mt-4 space-y-3">
              <div>
                <label className="text-slate-500 text-xs mb-1 block">Start Date</label>
                <input
                  type="date"
                  value={options.customStartDate}
                  onChange={(e) => setOptions(prev => ({ ...prev, customStartDate: e.target.value }))}
                  className="w-full bg-slate-700 text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-brand-blue-500"
                />
              </div>
              <div>
                <label className="text-slate-500 text-xs mb-1 block">End Date</label>
                <input
                  type="date"
                  value={options.customEndDate}
                  onChange={(e) => setOptions(prev => ({ ...prev, customEndDate: e.target.value }))}
                  max={new Date().toISOString().split('T')[0]}
                  className="w-full bg-slate-700 text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-brand-blue-500"
                />
              </div>
            </div>
          )}
        </div>

        {/* Options */}
        <div className="bg-slate-800 rounded-xl p-4">
          <label className="text-slate-400 text-sm mb-3 block">Report Options</label>
          <div className="space-y-3">
            <label className="flex items-center justify-between p-3 bg-slate-700 rounded-xl cursor-pointer">
              <span className="text-slate-300">Group by category</span>
              <input
                type="checkbox"
                checked={options.groupByCategory}
                onChange={(e) => setOptions(prev => ({ ...prev, groupByCategory: e.target.checked }))}
                className="w-5 h-5 rounded bg-slate-600 border-slate-500 text-brand-blue-600 focus:ring-brand-blue-500"
              />
            </label>
            <label className="flex items-center justify-between p-3 bg-slate-700 rounded-xl cursor-pointer">
              <span className="text-slate-300">Include supervisor signatures</span>
              <input
                type="checkbox"
                checked={options.includeSignatures}
                onChange={(e) => setOptions(prev => ({ ...prev, includeSignatures: e.target.checked }))}
                className="w-5 h-5 rounded bg-slate-600 border-slate-500 text-brand-blue-600 focus:ring-brand-blue-500"
              />
            </label>
            {options.format === 'pdf' && (
              <label className="flex items-center justify-between p-3 bg-slate-700 rounded-xl cursor-pointer">
                <div>
                  <span className="text-slate-300">Include photo proof</span>
                  <p className="text-slate-500 text-xs">May increase file size</p>
                </div>
                <input
                  type="checkbox"
                  checked={options.includePhotos}
                  onChange={(e) => setOptions(prev => ({ ...prev, includePhotos: e.target.checked }))}
                  className="w-5 h-5 rounded bg-slate-600 border-slate-500 text-brand-blue-600 focus:ring-brand-blue-500"
                />
              </label>
            )}
          </div>
        </div>

        {/* Export Button */}
        <button
          onClick={handleExport}
          disabled={loading}
          className="w-full bg-brand-blue-600 text-white font-bold py-4 rounded-xl hover:bg-brand-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Generating Report...
            </>
          ) : (
            <>
              <Download className="w-5 h-5" />
              Export Report
            </>
          )}
        </button>

        <p className="text-slate-500 text-xs text-center">
          Reports include all approved hours within the selected date range
        </p>
      </main>
    </div>
  );
}
