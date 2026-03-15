'use client';

import { Printer } from 'lucide-react';

export function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-white transition"
    >
      <Printer className="w-4 h-4" /> Print / Save PDF
    </button>
  );
}
