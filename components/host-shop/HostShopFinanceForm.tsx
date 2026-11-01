'use client';
import { useEffect, useState, type FormEvent } from 'react';
type RequestRow = {id:string; file_name:string; status:string};
export default function HostShopFinanceForm() {
  const [rows,setRows]=useState<RequestRow[]>([]),[busy,setBusy]=useState(false),[message,setMessage]=useState('');
  async function load(){
    const response=await fetch('/api/host-shop/finance',{cache:'no-store'});
    const result=await response.json();
    if(!response.ok)throw new Error(result.error||'Finance requests could not load.');
    setRows(result.requests||[]);
  }
  useEffect(()=>{load().catch(error=>setMessage(error.message));},[]);
  async function view(id:string){
    try{
      const response=await fetch('/api/host-shop/documents/'+id+'/download');
      const result=await response.json();
      if(!response.ok||!result.url)throw new Error(result.error||'Document could not open.');
      window.location.assign(result.url);
    }catch(error){setMessage(error instanceof Error?error.message:'Document could not open.');}
  }
  async function submit(event:FormEvent<HTMLFormElement>){
    event.preventDefault();const form=event.currentTarget,fields=new FormData(form);
    setBusy(true);setMessage('');
    try{
      const response=await fetch('/api/host-shop/finance',{
        method:'POST',headers:{'content-type':'application/json'},
        body:JSON.stringify(Object.fromEntries([...fields.entries(),['attested',fields.get('attested')==='yes']])),
      });
      const result=await response.json();
      if(!response.ok)throw new Error(result.error||'Request could not be submitted.');
      form.reset();await load();setMessage('Finance request submitted to Admin for review.');
    }catch(error){setMessage(error instanceof Error?error.message:'Submission failed.');}
    finally{setBusy(false);}
  }
  return <section className="mt-6 space-y-4 rounded-2xl border bg-white p-5">
    <h2 className="text-xl font-black">Submit a finance request</h2>
    <p className="text-sm text-slate-700">Fill out an invoice, reimbursement request, or billing correction. Admin reviews the saved request before any charge or payment is approved.</p>
    <form onSubmit={submit}><fieldset disabled={busy} className="grid gap-3 sm:grid-cols-2">
      <label className="grid gap-1 text-sm font-bold">Request type<select name="kind" required className="min-h-11 rounded-xl border p-2">
        <option value="host_shop_invoice">Invoice to Elevate</option><option value="host_shop_reimbursement">Reimbursement request</option><option value="host_shop_billing_correction">Billing correction</option>
      </select></label>
      <label className="grid gap-1 text-sm font-bold">Invoice / reference number<input name="reference" required maxLength={120} className="min-h-11 rounded-xl border p-2" /></label>
      <label className="grid gap-1 text-sm font-bold">Service / expense date<input name="date" type="date" required className="min-h-11 rounded-xl border p-2" /></label>
      <label className="grid gap-1 text-sm font-bold">Amount (USD)<input name="amount" type="number" required min="0.01" max="9999999.99" step="0.01" className="min-h-11 rounded-xl border p-2" /></label>
      <label className="grid gap-1 text-sm font-bold sm:col-span-2">Services, expense, or correction details<textarea name="description" required minLength={10} maxLength={2000} rows={4} className="rounded-xl border p-2" /></label>
      <label className="flex gap-2 text-sm sm:col-span-2"><input type="checkbox" name="attested" value="yes" required />I certify that this request and amount are accurate.</label>
      <button className="min-h-11 rounded-xl bg-blue-800 px-5 py-3 font-bold text-white disabled:opacity-50">{busy?'Submitting…':'Submit for Admin review'}</button>
    </fieldset></form>
    {message&&<p role="status" className="text-sm font-semibold">{message}</p>}
    <h3 className="font-bold">Saved finance requests</h3>
    {!rows.length?<p className="text-sm text-slate-600">No saved requests.</p>:<ul className="divide-y">{rows.map(row=><li key={row.id} className="flex flex-wrap justify-between gap-3 py-3">
      <button type="button" onClick={()=>void view(row.id)} className="min-h-11 break-all font-bold underline">{row.file_name}</button>
      <span className="text-sm capitalize">{row.status}</span>
    </li>)}</ul>}
  </section>;
}
