'use client';

import { useState } from 'react';
import { PhoneCall, Check, Loader2 } from 'lucide-react';

interface Props {
  leadId: string;
  leadName: string | null;
}

export function LeadActionButtons({ leadId, leadName }: Props) {
  const [state, setState] = useState<'idle' | 'loading' | 'done'>('idle');

  async function handleMarkContacted(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (state !== 'idle') return;
    setState('loading');
    try {
      await fetch('/api/admin/crm/follow-ups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contact_id: leadId,
          title: 'Contacted',
          follow_up_type: 'call',
          notes: `Marked contacted from dashboard`,
        }),
      });
      setState('done');
    } catch {
      setState('idle');
    }
  }

  return (
    <div className="flex items-center gap-1 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
      <button
        onClick={handleMarkContacted}
        title={`Mark ${leadName ?? 'lead'} as contacted`}
        className="p-1.5 rounded-lg hover:bg-brand-green-50 text-slate-400 hover:text-brand-green-600 transition-colors disabled:opacity-50"
        disabled={state !== 'idle'}
      >
        {state === 'loading' ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : state === 'done' ? (
          <Check className="w-3.5 h-3.5 text-brand-green-500" />
        ) : (
          <PhoneCall className="w-3.5 h-3.5" />
        )}
      </button>
    </div>
  );
}
