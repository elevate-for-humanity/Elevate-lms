'use client';
import {useState,type FormEvent} from 'react';
import Link from 'next/link';
export function StoreSignIn({returnPath}:{returnPath:string}) {
  const [email,setEmail]=useState('');
  const [password,setPassword]=useState('');
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState('');
  async function submit(event:FormEvent<HTMLFormElement>) {
    event.preventDefault();setBusy(true);setError('');
    try {
      const response=await fetch('/api/auth/signin',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:email.trim(),password}),cache:'no-store',signal:AbortSignal.timeout(20000)});
      const body=await response.json().catch(()=>null);
      if(!response.ok||body?.success!==true||!body?.user?.id)throw Error(body?.error||'Unable to sign in. Check your details and try again.');
      window.location.assign(returnPath);
    } catch(error) {setError(error instanceof Error?error.message:'Unable to sign in. Please try again.');setBusy(false);}
  }
  return <main className="flex min-h-[70vh] items-center justify-center bg-slate-50 px-4 py-12">
    <section className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
      <Link href="/store" className="text-sm font-semibold text-blue-700">Elevate Store</Link>
      <h1 className="mt-4 text-3xl font-bold text-slate-950">Sign in to your Store account</h1>
      <p className="mt-3 text-sm text-slate-600">Use your existing Elevate email and password to continue your purchase.</p>
      <form onSubmit={submit} className="mt-6 space-y-4">
        <label className="block text-sm font-semibold">Email<input type="email" autoComplete="username" required value={email} onChange={e=>setEmail(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 p-3"/></label>
        <label className="block text-sm font-semibold">Password<input type="password" autoComplete="current-password" required value={password} onChange={e=>setPassword(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 p-3"/></label>
        {error&&<p role="alert" className="text-sm text-red-700">{error}</p>}
        <button disabled={busy} className="w-full rounded-lg bg-blue-700 px-4 py-3 font-semibold text-white disabled:opacity-60">{busy?'Signing in…':'Sign in'}</button>
      </form>
      <Link href="/forgot-password" className="mt-5 inline-block text-sm font-semibold text-blue-700">Reset your password</Link>
    </section>
  </main>;
}
