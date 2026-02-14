"use client";

import { Printer } from 'lucide-react';

interface PrintButtonProps {
  className?: string;
  label?: string;
}

export default function PrintButton({
  className = '',
  label = 'Print'
}: PrintButtonProps) {
  const handlePrint = () => {
    window.print();
  };

  return (
    <button
      onClick={handlePrint}
      className={`print-button flex items-center gap-2 px-4 py-2 bg-brand-blue-600 text-white rounded-lg hover:bg-brand-blue-700 transition-colors ${className}`}
      aria-label="Print this page"
    >
      <Printer className="w-5 h-5" />
      <span>{label}</span>
    </button>
  );
}

// Specific print components for different document types

export function PrintCertificateButton() {
  return (
    <PrintButton
      label="Print Certificate"
      className="fixed bottom-6 right-6 shadow-lg z-50"
    />
  );
}

export function PrintReportButton() {
  return (
    <PrintButton
      label="Print Report"
      className="inline-flex"
    />
  );
}

export function PrintTranscriptButton() {
  return (
    <PrintButton
      label="Print Transcript"
      className="inline-flex"
    />
  );
}
