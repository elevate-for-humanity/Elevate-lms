'use client';
import { FormEvent, useState } from 'react';

export function StudentCommunicationActions({ enrollmentId, studentName, hasEmail, hasPhone }: { enrollmentId: string; studentName: string; hasEmail: boolean; hasPhone: boolean }) {
  const [open,setOpen]=useState(false);
  const [busy,setBusy]=useState(false);
  const [message,setMessage]=useState('');
  async function submit(event:FormEvent<HTMLFormElement>){
    event.preventDefault(); setBusy(true); setMessage('');
    const form=new FormData(event.currentTarget);
    const response=await fetch('/api/program-holder/student-communications',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({enrollmentId,channel:form.get('channel'),subject:form.get('subject'),message:form.get('message'),consentConfirmed:form.get('consentConfirmed')==='yes'})});
    const result=await response.json().catch(()=>({})); setBusy(false);
    setMessage(response.ok?(result.delivery === 'queued' ? `Text accepted for ${studentName}; delivery is pending.` : `Email sent to ${studentName}.`):result.error||'Message could not be sent.');
    if(response.ok) event.currentTarget.reset();
  }
  return <div className="min-w-[170px]">
    <button type="button" onClick={()=>setOpen(!open)} className="rounded-lg border border-blue-300 bg-blue-50 px-3 py-2 text-xs font-black text-blue-800">{open?'Close message':'Email or text'}</button>
    {open&&<form onSubmit={submit} className="mt-2 grid gap-2 rounded-xl border border-slate-200 bg-white p-3 shadow-lg">
      <select name="channel" required className="rounded-lg border px-2 py-2 text-xs">
        <option value="">Choose channel</option>
        <option value="email" disabled={!hasEmail}>Email{!hasEmail?' — missing':''}</option>
        <option value="sms" disabled={!hasPhone}>Text message{!hasPhone?' — missing':''}</option>
      </select>
      <input name="subject" maxLength={160} placeholder="Subject (email)" className="rounded-lg border px-2 py-2 text-xs" />
      <textarea name="message" required maxLength={2000} rows={4} placeholder="Write a message" className="rounded-lg border px-2 py-2 text-xs" />
      <label className="flex items-start gap-2 text-xs text-slate-700"><input type="checkbox" name="consentConfirmed" value="yes" className="mt-0.5" />I verified the student's consent to receive an operational text.</label>
      <button disabled={busy||(!hasEmail&&!hasPhone)} className="rounded-lg bg-blue-700 px-3 py-2 text-xs font-black text-white disabled:opacity-50">{busy?'Sending…':'Send message'}</button>
      {message&&<p role="status" className="text-xs font-bold text-slate-700">{message}</p>}
    </form>}
  </div>;
}
