'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CreditCard, Loader2, ShieldCheck } from 'lucide-react';
import { TUITION_DOLLARS, MIN_SETUP_FEE_CENTS } from '@/lib/barber/pricing';

export default function PaymentSetupPage() {
  const router = useRouter();
  const [loading,setLoading]=useState(false);
  const [error,setError]=useState('');
  const minimumDeposit=MIN_SETUP_FEE_CENTS/100;

  async function startBilling(paymentPlan:'full'|'installments'){
    setLoading(true);setError('');
    try{
      const programRes=await fetch('/api/programs/resolve?slug=barber-apprenticeship');
      const program=await programRes.json();
      if(!programRes.ok||!program.id) throw new Error(program.error||'Barber program could not be loaded.');
      const res=await fetch('/api/programs/enroll/checkout',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({program_id:program.id,funding_source:'self_pay',payment_plan:paymentPlan})});
      const data=await res.json();
      if(!res.ok||!data.url) throw new Error(data.error||'Secure billing could not be started.');
      window.location.href=data.url;
    }catch(e){setError(e instanceof Error?e.message:'Secure billing could not be started.');setLoading(false);}
  }

  return <main className="min-h-screen bg-slate-950 px-4 py-14 text-white">
    <div className="mx-auto max-w-xl">
      <div className="mb-8 flex items-center gap-3"><ShieldCheck className="h-7 w-7 text-amber-400"/><div><p className="text-xs font-black uppercase tracking-widest text-amber-400">Barber Apprenticeship</p><h1 className="text-3xl font-black">Choose your payment option</h1></div></div>
      <div className="rounded-2xl border border-slate-700 bg-slate-900 p-6">
        <p className="text-slate-300">Tuition: <strong className="text-white">${TUITION_DOLLARS.toLocaleString()}</strong>. Billing is handled through Elevate's current QuickBooks payment system.</p>
        {error?<p className="mt-4 rounded-xl border border-red-700 bg-red-950/40 p-3 text-sm text-red-200">{error}</p>:null}
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <button disabled={loading} onClick={()=>startBilling('installments')} className="rounded-xl border border-amber-400 bg-amber-400/10 p-5 text-left hover:bg-amber-400/20 disabled:opacity-50"><CreditCard className="mb-3 h-6 w-6 text-amber-400"/><span className="block font-black">Payment plan</span><span className="mt-1 block text-sm text-slate-300">Start with the current installment amount. Minimum historical deposit reference: ${minimumDeposit.toLocaleString()}.</span></button>
          <button disabled={loading} onClick={()=>startBilling('full')} className="rounded-xl bg-amber-500 p-5 text-left text-slate-950 hover:bg-amber-400 disabled:opacity-50"><CreditCard className="mb-3 h-6 w-6"/><span className="block font-black">Pay in full</span><span className="mt-1 block text-sm">Create the full tuition invoice and continue to secure payment.</span></button>
        </div>
        {loading?<div className="mt-5 flex items-center gap-2 text-sm text-slate-300"><Loader2 className="h-4 w-4 animate-spin"/>Preparing secure billing…</div>:null}
      </div>
      <button onClick={()=>router.push('/programs/barber-apprenticeship')} className="mt-6 text-sm font-bold text-slate-300 hover:text-white">Back to Barber Apprenticeship</button>
    </div>
  </main>;
}
