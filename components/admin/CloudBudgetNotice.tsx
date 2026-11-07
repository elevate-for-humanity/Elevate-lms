'use client';

import { useEffect, useState } from 'react';
import { CLOUD_BILLING_URL, type CloudBudgetState } from '@/lib/gcp/cloud-budget';

export function CloudBudgetNotice() {
  const [state, setState] = useState<CloudBudgetState | null>(null);
  const [unavailable, setUnavailable] = useState(false);
  useEffect(() => {
    let active = true;
    const check = async () => {
      try {
        const response = await fetch('/api/admin/cloud-budget', { cache: 'no-store', signal: AbortSignal.timeout(10000) });
        if (response.status === 401 || response.status === 403) return;
        if (!response.ok) throw new Error();
        const result = await response.json();
        if (active) { setState(result.state); setUnavailable(!result.state); }
      } catch { if (active) setUnavailable(true); }
    };
    void check();
    const timer = window.setInterval(check, 300000);
    return () => { active = false; window.clearInterval(timer); };
  }, []);
  const stale = state && Date.now() - Date.parse(state.reportedAt) > 86400000;
  if (!unavailable && !stale && (!state || state.costAmount < 90)) return null;
  return <aside role="status" aria-label="Google Cloud spending alert" className="border-b border-amber-300 bg-amber-50 px-4 py-3 text-base text-amber-950">
    <strong>{state && !stale ? `Cloud spending warning: $${state.costAmount.toFixed(2)}` : 'Cloud spending monitoring needs attention'}</strong>
    <p>{state && !stale ? 'Your $90 warning level has been reached. Review billing before a payment failure interrupts your services.' : 'A current Cloud spending report is unavailable. Check Google billing directly.'} Spending reports can be delayed and do not show your unpaid balance.</p>
    <a className="inline-flex min-h-11 items-center font-semibold underline" href={CLOUD_BILLING_URL} target="_blank" rel="noreferrer">Review Google Cloud billing</a>
  </aside>;
}
