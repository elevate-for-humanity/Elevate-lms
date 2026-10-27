'use client';
import {useEffect,useState,type FormEvent} from 'react';
import Link from 'next/link';
import {createClient} from '@/lib/supabase/client';
import {validatePassword} from '@/lib/auth/password-validation';
export function StoreResetPassword() {
 const [ready,setReady]=useState(false);const [authenticated,setAuthenticated]=useState(false);const [password,setPassword]=useState('');const [confirm,setConfirm]=useState('');const [busy,setBusy]=useState(false);const [error,setError]=useState('');const [done,setDone]=useState(false);
 useEffect(()=>{
  let active=true;
  createClient().auth.getUser().then(({data,error})=>{if(active){setAuthenticated(Boolean(data.user&&!error));setReady(true);}}).catch(()=>{if(active)setReady(true);});
  return ()=>{active=false;};
 },[]);
 async function submit(event:FormEvent<HTMLFormElement>) {
  event.preventDefault();setError('');
  const validation=validatePassword(password);
  if(!validation.valid){setError(validation.errors[0]||'Choose a stronger password.');return;}
  if(password!==confirm){setError('Passwords do not match.');return;}
  setBusy(true);
  try {
   const client=createClient();const user=await client.auth.getUser();
   if(user.error||!user.data.user)throw Error('Your reset session expired. Request a new link.');
   const result=await client.auth.updateUser({password});
   if(result.error)throw Error('Unable to update your password. Request a new link and try again.');
   setPassword('');setConfirm('');setDone(true);
  }catch(error){setError(error instanceof Error?error.message:'Unable to update your password.');}
  finally{setBusy(false);}
 }
 return <main className="flex min-h-[70vh] items-center justify-center bg-slate-50 px-4 py-12"><section className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
  <h1 className="text-2xl font-bold">Reset your Store password</h1>
  {!ready?<p className="mt-4" role="status">Checking your reset session…</p>:!authenticated?<div className="mt-4"><p>Your reset session is missing or expired.</p><Link className="mt-4 inline-block text-blue-700" href="/forgot-password">Request a new secure link</Link></div>:done?<div className="mt-4"><p role="status">Your password has been updated.</p><Link className="mt-4 inline-block text-blue-700" href="/login?redirect=%2Fstore">Continue to Store sign in</Link></div>:<form onSubmit={submit} className="mt-6 space-y-4">
   <label className="block text-sm font-semibold">New password<input required minLength={8} type="password" autoComplete="new-password" value={password} onChange={e=>setPassword(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 p-3"/></label>
   <label className="block text-sm font-semibold">Confirm password<input required type="password" autoComplete="new-password" value={confirm} onChange={e=>setConfirm(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 p-3"/></label>
   {error&&<p role="alert" className="text-sm text-red-700">{error}</p>}
   <button disabled={busy} className="w-full rounded-lg bg-blue-700 px-4 py-3 font-semibold text-white disabled:opacity-60">{busy?'Updating…':'Update password'}</button>
  </form>}
 </section></main>;
}
