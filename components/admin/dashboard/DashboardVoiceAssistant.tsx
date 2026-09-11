'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp, Mic } from 'lucide-react';
import UnifiedEllieChat from '@/components/studio/UnifiedEllieChat';

export function DashboardVoiceAssistant() {
  const [open, setOpen] = useState(false);

  return (
    <div className="mt-5 overflow-hidden rounded-2xl border border-blue-200 bg-white shadow-sm">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-expanded={open}
        aria-controls="dashboard-voice-assistant"
        className="flex min-h-14 w-full items-center gap-3 px-4 py-3 text-left text-slate-950 hover:bg-blue-50"
      >
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-700 text-white">
          <Mic className="h-5 w-5" aria-hidden="true" />
        </span>
        <span>
          <span className="block text-sm font-black">Talk to Admin AI</span>
          <span className="block text-xs font-medium text-slate-600">
            Speak a request, edit the transcript if needed, then approve protected actions.
          </span>
        </span>
        {open ? (
          <ChevronUp className="ml-auto h-5 w-5" aria-hidden="true" />
        ) : (
          <ChevronDown className="ml-auto h-5 w-5" aria-hidden="true" />
        )}
      </button>
      {open ? (
        <div id="dashboard-voice-assistant" className="h-[620px] border-t border-blue-100">
          <UnifiedEllieChat embedded preferredAgent="LIZZY" />
        </div>
      ) : null}
    </div>
  );
}
