'use client';
import { useEffect,useState,useRef,type FormEvent } from 'react';
import { money,parseHourlyRate } from '@/lib/cleaning/pricing';
import { TenantProviderRate } from './TenantProviderRate';
import { useTenantRequestHeaders,useReadOnlyTenantPreview } from './TenantPreviewContext';
const services=['standard','deep','moveout','commercial','event','carpet','valet-trash'];
const statusLabels:Record<string,string>={requested:'Request received',quoted:'Quote ready',offered:'Finding a provider',assigned:'Confirmed',completed:'Completed',cancelled:'Cancelled',refund_review:'Payment / refund review'};
const serviceLabels:Record<string,string>={standard:'Standard cleaning',deep:'Deep cleaning',moveout:'Move-in / move-out',commercial:'Commercial janitorial',event:'Event cleanup',carpet:'Carpet / upholstery','valet-trash':'Valet trash'};
const input='mt-2 w-full rounded-xl border border-slate-400 bg-white p-3 text-slate-950';
const button='rounded-full bg-slate-900 px-6 py-3 font-bold text-white disabled:opacity-50';
function useCleaningApi(){
 const headers=useTenantRequestHeaders();const readOnly=useReadOnlyTenantPreview();
 return async(path:string,body?:unknown,token?:string)=>{
  if(body&&readOnly)throw new Error('This preview cannot submit changes.');
  const response=await fetch(`/api/tenant-sites/cleaning/${path}`,{method:body?'POST':'GET',headers:{...headers,...(body?{'Content-Type':'application/json'}:{}),...(token?{Authorization:`Bearer ${token}`}:{})},...(body?{body:JSON.stringify(body)}:{}),cache:'no-store'});
  const result=await response.json();if(!response.ok)throw new Error(result.error||'Unable to complete this request.');return result;
 };
}
function SignIn(){return <p className="mt-4 leading-7"><a href="/login" className="font-bold underline">Sign in</a> with the verified email used for your membership, request or provider application, then return to this page.</p>;}
export function TenantCleaningBooking(){
 const api=useCleaningApi();const [jobs,setJobs]=useState<any[]>([]);const [notice,setNotice]=useState('');const [busy,setBusy]=useState(false);const key=useRef('');
 async function load(){try{setJobs((await api('jobs')).jobs||[]);}catch(e){setNotice(e instanceof Error?e.message:'Unable to load bookings.');}}
 useEffect(()=>{void load();},[]); // eslint-disable-line react-hooks/exhaustive-deps
 async function submit(event:FormEvent<HTMLFormElement>){event.preventDefault();if(busy)return;const form=event.currentTarget;const data=new FormData(form);setBusy(true);setNotice('');
  try{key.current ||= crypto.randomUUID();await api('jobs',{requestKey:key.current,name:data.get('name'),service:data.get('service'),zip:data.get('zip'),startsAt:new Date(String(data.get('starts'))).toISOString(),details:data.get('details')});key.current='';form.reset();setNotice('Request received. Review your quote here after 2Exclusive confirms the scope and price.');await load();}catch(e){setNotice(e instanceof Error?e.message:'Unable to save request.');}finally{setBusy(false);}}
 async function cancel(id:string){setBusy(true);try{await api('jobs',{action:'cancel',id,confirm:true});await load();setNotice('Cancellation recorded. Payments already received are sent for refund review.');}catch(e){setNotice(e instanceof Error?e.message:'Unable to cancel.');}finally{setBusy(false);}}
 async function checkout(id:string){setBusy(true);setNotice('');try{const result=await api('jobs',{action:'checkout',id});window.location.assign(result.checkoutUrl);}catch(e){setNotice(e instanceof Error?e.message:'Payment is unavailable.');}finally{setBusy(false);}}
 return <section className="mx-auto max-w-5xl px-5 py-14"><h2 className="text-3xl font-black">Request and manage cleaning</h2><SignIn/>
  <form onSubmit={submit} className="mt-8 grid gap-5 rounded-2xl border bg-white p-6 sm:grid-cols-2">
   <label className="font-bold">Your name<input name="name" required minLength={2} maxLength={160} className={input}/></label>
   <label className="font-bold">Service<select name="service" className={input}>{services.map(s=><option key={s} value={s}>{serviceLabels[s]}</option>)}</select></label>
   <label className="font-bold">Property ZIP<input name="zip" required pattern="[0-9]{5}" inputMode="numeric" className={input}/></label>
   <label className="font-bold">Requested local date and time<input name="starts" type="datetime-local" required className={input}/></label>
   <label className="font-bold sm:col-span-2">Property address, contact phone, cleaning needs and access notes<textarea name="details" required minLength={10} maxLength={4000} rows={5} className={input}/></label>
   <p className="leading-7 sm:col-span-2">Choose a date at least 24 hours away. Your detailed address and access notes are shared with your assigned provider after acceptance. You review the quote before payment.</p>
   <button className={button} disabled={busy}>{busy?'Saving…':'Request cleaning'}</button>
  </form>
  {notice?<p role="status" className="mt-5 rounded-xl border p-4 leading-7">{notice}</p>:null}
  <div className="mt-10 flex flex-wrap items-center justify-between gap-4"><h3 className="text-2xl font-bold">Your requests</h3><button type="button" onClick={()=>void load()} className="rounded-xl border px-4 py-2 font-bold">Refresh status</button></div>
  <div className="mt-5 space-y-5">{jobs.map(job=><article key={job.id} className="rounded-2xl border bg-white p-6"><h4 className="text-xl font-bold">{serviceLabels[job.service]} · {job.zip}</h4><p className="mt-2">{new Date(job.starts_at).toLocaleString()} · {statusLabels[job.status]||job.status}</p>{job.summary?<p className="mt-3 whitespace-pre-wrap leading-7">{job.summary}</p>:null}
   {job.customer_cents!==null?<p className="mt-3 font-bold">Agreed cleaning quote: {money(job.customer_cents)} · Membership savings: {money(job.discount_cents)}</p>:null}
   {job.status==='quoted'?<><p className="mt-3">Quote expires {new Date(job.quote_expires_at).toLocaleString()}. Confirm the scope and time above before paying. After payment, we email matching providers and send you confirmation when one accepts.</p><button className={`${button} mt-4`} type="button" disabled={busy} onClick={()=>void checkout(job.id)}>Review invoice and pay</button></>:null}
   {!['cancelled','refund_review','completed'].includes(job.status)?<form className="mt-5 space-y-3" onSubmit={e=>{e.preventDefault();void cancel(job.id);}}><label className="flex gap-3 leading-7"><input type="checkbox" required className="mt-2"/>I want to cancel this request. Any payment received will need refund review.</label><button className="font-bold underline" disabled={busy}>Request cancellation</button></form>:null}
   <p className="mt-3 text-sm">Reference: {job.id}</p></article>)}</div>
 </section>;
}
export function TenantCleaningProvider(){
 const api=useCleaningApi();const [provider,setProvider]=useState<any>(null);const [assigned,setAssigned]=useState<any[]>([]);const [rate,setRate]=useState('');const [notice,setNotice]=useState('');const [busy,setBusy]=useState(false);
 useEffect(()=>{void api('provider').then(r=>{setProvider(r.provider);setAssigned(r.jobs||[]);if(r.provider)setRate((r.provider.hourly_cents/100).toFixed(2));else setNotice('Your application must be added to the company directory before you can manage your rate here.');}).catch(e=>setNotice(e.message));},[]); // eslint-disable-line react-hooks/exhaustive-deps
 async function save(event:FormEvent){event.preventDefault();const cents=parseHourlyRate(rate);if(cents===null||busy)return;setBusy(true);try{await api('provider',{hourlyCents:cents});setNotice('Rate saved for future opportunities. Payments on accepted jobs stay unchanged.');}catch(e){setNotice(e instanceof Error?e.message:'Unable to save rate.');}finally{setBusy(false);}}
 return <section className="mx-auto max-w-4xl px-5 py-14"><h2 className="text-3xl font-black">Your cleaning business</h2><SignIn/>{provider?<><p className="mt-5 leading-7">{provider.name} · Review status: {provider.eligibility}. Job offers arrive by email when your reviewed services, ZIP coverage and rate match an opportunity.</p><form onSubmit={save} className="mt-6 space-y-5"><TenantProviderRate value={rate} onChange={setRate} required/><button disabled={busy||parseHourlyRate(rate)===null} className={button}>Save hourly rate</button></form><h3 className="mt-8 text-2xl font-bold">Your assignments</h3>{assigned.map(job=><article key={job.id} className="mt-5 rounded-xl border p-5"><p className="font-bold">{job.service} · {new Date(job.starts_at).toLocaleString()} · {statusLabels[job.status]||job.status}</p><p className="mt-3">{job.customer_name} · {job.customer_email} · Your business payment: {money(job.provider_pay_cents)}</p><p className="mt-3 whitespace-pre-wrap leading-7">{job.private_details}</p></article>)}</>:null}{notice?<p role="status" className="mt-5 leading-7">{notice}</p>:null}</section>;
}
export function TenantCleaningOffer(){
 const api=useCleaningApi();const [job,setJob]=useState<any>(null);const [credentials,setCredentials]=useState({id:'',token:''});const [accepted,setAccepted]=useState(false);const [notice,setNotice]=useState('');const [busy,setBusy]=useState(false);
 useEffect(()=>{const id=new URLSearchParams(window.location.search).get('offer')||'';const token=new URLSearchParams(window.location.hash.slice(1)).get('token')||'';setCredentials({id,token});if(!id||!token){setNotice('Open the private offer link from your email.');return;}void api(`offers?id=${encodeURIComponent(id)}`,undefined,token).then(r=>{setJob(r.job);setAccepted(r.accepted===true);}).catch(e=>setNotice(e.message));},[]); // eslint-disable-line react-hooks/exhaustive-deps
 async function accept(event:FormEvent){event.preventDefault();if(busy)return;setBusy(true);try{const result=await api(`offers?id=${encodeURIComponent(credentials.id)}`,{confirm:true},credentials.token);setJob({...job,...result.job});setAccepted(true);setNotice('You accepted this cleaning assignment. Customer details are below.');}catch(e){setNotice(e instanceof Error?e.message:'Unable to accept this offer.');}finally{setBusy(false);}}
 return <section className="mx-auto max-w-3xl px-5 py-14"><h2 className="text-3xl font-black">{accepted?'Your cleaning assignment':'Review cleaning opportunity'}</h2>{job?<article className="mt-6 space-y-4 rounded-2xl border bg-white p-6"><p className="text-xl font-bold">{job.service} · ZIP {job.zip}</p><p>{new Date(job.starts_at).toLocaleString()}</p><p className="whitespace-pre-wrap leading-7">{job.summary}</p><p className="font-bold">Your business receives {money(job.provider_pay_cents)} before your own expenses and taxes.</p>
  {accepted?<><p>{job.customer_name} · {job.customer_email}</p><p className="whitespace-pre-wrap leading-7">{job.private_details}</p></>:<form onSubmit={accept} className="space-y-5"><p>{job.cleaner_hours} total cleaner-hours. The first eligible provider to confirm receives the assignment.</p><label className="flex gap-3 leading-7"><input type="checkbox" required className="mt-2"/><span>I can perform this scope at the stated time and accept the displayed total business payment.</span></label><button disabled={busy} className={button}>{busy?'Confirming…':'Accept this job'}</button></form>}</article>:null}{notice?<p role="status" className="mt-5 leading-7">{notice}</p>:null}</section>;
}
