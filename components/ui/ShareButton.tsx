'use client';

import { Share2 } from 'lucide-react';

export function ShareButton() {
  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    alert('Verification link copied to clipboard!');
  };

  return (
    <button
      onClick={handleShare}
      className="inline-flex items-center gap-2 px-6 py-3 bg-slate-600 text-white font-semibold rounded-lg hover:bg-slate-700"
    >
      <Share2 className="w-5 h-5" />
      Share Verification Link
    </button>
  );
}
