'use client';
import { useState } from 'react';
export function WorkOneOutreachButton({ count }: { count: number }) {
  const [busy,setBusy]=useState(false); const [message,setMessage]=useState('');
  async function send(){ setBusy(true); setMessage(''); const response=await fetch('/api/program-holder/workone-outreach',{method:'POST'}); const result=await response.json().catch(()=>({})); setBusy(false); setMessage(response.ok ? `${result.sent} WorkOne emails sent.` : result.error || 'Emails could not be sent.'); }
  return <div><button type="button" onClick={send} disabled={busy || count===0} className="inline-flex min-h-10 items-center rounded-xl bg-blue-700 px-4 py-2 text-sm font-black text-white disabled:opacity-50">{busy?'Sending…':`Email WorkOne steps (${count})`}</button>{message&&<p role="status" className="mt-2 text-xs font-bold text-slate-700">{message}</p>}</div>;
}
