'use client';

import { Download } from 'lucide-react';

export function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="inline-flex items-center justify-center px-8 py-4 bg-teal-700 text-white rounded-lg font-bold hover:bg-teal-600 transition-colors border-2 border-white/30"
    >
      <Download className="w-5 h-5 mr-2" />
      Print This Page
    </button>
  );
}
