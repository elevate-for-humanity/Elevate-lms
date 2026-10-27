'use client';
import {useState,type FormEvent} from 'react';
export default function ForgotPasswordForm() {
 const [email,setEmail]=useState('');const [busy,setBusy]=useState(false);const [sent,setSent]=useState(false);const [error,setError]=useState('');
 async function submit(event:FormEvent<HTMLFormElement>) {
  event.preventDefault();setBusy(true);setError('');
  try {
   const response=await fetch('/api/auth/password-reset',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:email.trim()}),cache:'no-store',signal:AbortSignal.timeout(30000)});
   if(!response.ok)throw Error('Unable to request a reset link. Check your email address and try again.');
   setSent(true);
  } catch {setError('Unable to request a reset link. Check your email address and try again.');}
  finally {setBusy(false);}
 }
 if(sent)return <p role="status" className="mt-5 text-sm text-slate-700">If an account exists for that address, a secure password-reset link has been sent. Check your inbox.</p>;
 return <form onSubmit={submit} className="mt-6 space-y-4">
  <label className="block text-sm font-semibold">Email<input required type="email" autoComplete="email" value={email} onChange={e=>setEmail(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 p-3"/></label>
  {error&&<p role="alert" className="text-sm text-red-700">{error}</p>}
  <button disabled={busy} className="w-full rounded-lg bg-blue-700 px-4 py-3 font-semibold text-white disabled:opacity-60">{busy?'Sending…':'Send reset link'}</button>
 </form>;
}
