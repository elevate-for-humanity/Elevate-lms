'use client';
import { useEffect, useState } from 'react';
type Account = { id: string; name: string };
export function QuickBooksPayoutMapping() {
  const [accounts,setAccounts] = useState<{ bank: Account[]; expense: Account[] } | null>(null);
  const [bank,setBank] = useState(''), [expense,setExpense] = useState(''), [message,setMessage] = useState(''), [busy,setBusy] = useState(false);
  async function load() {
    try { const r=await fetch('/api/admin/integrations/quickbooks/payout-accounts',{cache:'no-store'});const d=await r.json();if(!r.ok)throw new Error(d.error);setAccounts(d);setBank(d.saved.QB_PAYOUT_BANK_ACCOUNT_ID || '');setExpense(d.saved.QB_CONTRACTOR_EXPENSE_ACCOUNT_ID || '');setMessage(''); }
    catch(e){setMessage(e instanceof Error?e.message:'Account list unavailable.');}
  }
  useEffect(()=>{void load();},[]);
  async function save(event: React.FormEvent) {
    event.preventDefault();setBusy(true);setMessage('');
    try {const r=await fetch('/api/admin/integrations/quickbooks/payout-accounts',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({bank,expense})});const d=await r.json();if(!r.ok)throw new Error(d.error);setMessage('Payment recording accounts saved. No payment was sent.');}
    catch(e){setMessage(e instanceof Error?e.message:'Mapping could not be saved.');}finally{setBusy(false);}
  }
  return <section className="my-6 space-y-3 rounded-xl border p-4"><h2 className="font-black">Program Holder payment recording</h2><p className="text-sm">Choose the real account used for external PayPal payments and the contractor expense category. The integration will not guess accounts or initiate a bank transfer.</p>{message&&<p role="status" className="text-sm">{message}</p>}{accounts?<form onSubmit={save} className="space-y-3"><label className="block text-sm font-bold">Payout bank / clearing account<select required value={bank} onChange={e=>setBank(e.target.value)} className="mt-1 min-h-11 w-full rounded border px-3"><option value="">Select account</option>{accounts.bank.map(a=><option key={a.id} value={a.id}>{a.name}</option>)}</select></label><label className="block text-sm font-bold">Contractor expense account<select required value={expense} onChange={e=>setExpense(e.target.value)} className="mt-1 min-h-11 w-full rounded border px-3"><option value="">Select account</option>{accounts.expense.map(a=><option key={a.id} value={a.id}>{a.name}</option>)}</select></label><button disabled={busy} className="min-h-11 rounded bg-blue-700 px-4 font-bold text-white disabled:opacity-50">Save payment accounts</button></form>:<button type="button" onClick={()=>void load()} className="min-h-11 font-bold underline">Load QuickBooks accounts</button>}</section>;
}
