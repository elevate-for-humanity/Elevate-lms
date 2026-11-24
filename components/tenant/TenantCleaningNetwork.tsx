'use client';
import { useEffect,useState,useRef,type FormEvent } from 'react';
import { money,parseHourlyRate } from '@/lib/cleaning/pricing';
import { siteUrls } from '@/lib/utils/site-urls';
import { createClient } from '@/lib/supabase/client';
import { TenantProviderRate } from './TenantProviderRate';
import { useTenantRequestHeaders,useReadOnlyTenantPreview } from './TenantPreviewContext';
const services=['standard','deep','moveout','commercial','event','carpet','valet-trash'];
const statusLabels:Record<string,string>={requested:'Request received',quoted:'Quote ready',offered:'Finding a provider',assigned:'Confirmed',completed:'Completed',cancelled:'Cancelled',refund_review:'Payment / refund review'};
const serviceLabels:Record<string,string>={standard:'Standard cleaning',deep:'Deep cleaning',moveout:'Move-in / move-out',commercial:'Commercial janitorial',event:'Event cleanup',carpet:'Carpet / upholstery','valet-trash':'Valet trash'};
const input='mt-2 w-full rounded-xl border border-slate-400 bg-white p-3 text-slate-950';
const button='rounded-full bg-slate-900 px-6 py-3 font-bold text-white disabled:opacity-50';
class CleaningApiError extends Error {
  constructor(message: string, readonly code?: string) { super(message); }
}
function useCleaningApi(){
 const headers=useTenantRequestHeaders();const readOnly=useReadOnlyTenantPreview();
 return async(path:string,body?:unknown,token?:string)=>{
  if(body&&readOnly)throw new Error('This preview cannot submit changes.');
  const response=await fetch(`/api/tenant-sites/cleaning/${path}`,{method:body?'POST':'GET',headers:{...headers,...(body?{'Content-Type':'application/json'}:{}),...(token?{Authorization:`Bearer ${token}`}:{})},...(body?{body:JSON.stringify(body)}:{}),cache:'no-store'});
  const result=await response.json();if(!response.ok)throw new CleaningApiError(result.error||'Unable to complete this request.',result.code);return result;
 };
}
const cleaningSiteUrl = `${siteUrls.site}/sites/2exclusive-platinum-cleaning`;
function SignIn({ path = '/book-cleaning' }: { path?: '/book-cleaning' | '/provider' }) {
  const next = encodeURIComponent(`${cleaningSiteUrl}${path}`);
  return <p className="mt-4 leading-7">
    <a href={`${siteUrls.login}?next=${next}`} className="font-bold underline">Sign in</a>
    {' or '}<a href={`${siteUrls.lms}/signup?next=${next}`} className="font-bold underline">Create an account</a>
    {' with the email used for your application or request. Verify that email to continue here.'}
  </p>;
}
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
type CleaningProvider = {
  name: string;
  hourly_cents: number;
  zips: string[];
  services: string[];
  opted_in: boolean;
  eligibility: 'pending' | 'eligible' | 'suspended';
};

export function TenantCleaningProvider() {
  const api = useCleaningApi();
  const readOnly = useReadOnlyTenantPreview();
  const [provider, setProvider] = useState<CleaningProvider | null>(null);
  const [applicantName, setApplicantName] = useState<string | null>(null);
  const [assigned, setAssigned] = useState<any[]>([]);
  const [rate, setRate] = useState('');
  const [zips, setZips] = useState('');
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [optedIn, setOptedIn] = useState(false);
  const [jobOffersEnabled, setJobOffersEnabled] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const [needsEmailVerification, setNeedsEmailVerification] = useState(false);
  const pending = !provider || provider.eligibility === 'pending';

  function showProvider(value: CleaningProvider | null) {
    setProvider(value);
    if (!value) return;
    setRate((value.hourly_cents / 100).toFixed(2));
    setZips(value.zips.join(', '));
    setSelectedServices(value.services);
    setOptedIn(value.opted_in);
  }

  function showError(error: unknown, fallback: string) {
    if (error instanceof CleaningApiError && error.code === 'provider_email_verification_required') {
      setNeedsEmailVerification(true);
      setProvider(null);
      setApplicantName(null);
      setAssigned([]);
      setLoaded(false);
    }
    setNotice(error instanceof Error ? error.message : fallback);
  }

  useEffect(() => {
    void api('provider').then(result => {
      showProvider(result.provider);
      setApplicantName(result.application?.name || null);
      setAssigned(result.jobs || []);
      setJobOffersEnabled(result.jobOffersEnabled === true);
      setLoaded(true);
      setNeedsEmailVerification(false);
    }).catch(error => showError(error, 'Unable to load your profile.'));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function sendEmailLink() {
    if (busy) return;
    setBusy(true);
    setNotice('');
    try {
      if (readOnly) throw new Error('This preview cannot send sign-in links.');
      const supabase = createClient();
      const { data: { user }, error: identityError } = await supabase.auth.getUser();
      if (identityError || !user?.email) throw new Error('Sign in with your account email before requesting a secure link.');
      const callback = new URL('/auth/callback', siteUrls.lms);
      callback.searchParams.set('redirect', `${cleaningSiteUrl}/provider`);
      const { error } = await supabase.auth.signInWithOtp({
        email: user.email,
        options: { shouldCreateUser: false, emailRedirectTo: callback.toString() },
      });
      if (error) throw error;
      setNotice('Check your account email for the secure sign-in link. Open it in this browser to return to your provider profile.');
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Unable to request your secure email sign-in link.');
    } finally {
      setBusy(false);
    }
  }

  async function save(event: FormEvent) {
    event.preventDefault();
    const cents = parseHourlyRate(rate);
    if (cents === null || busy) return;
    const submittedZips = [...new Set(zips.split(/[\s,]+/).filter(Boolean))];
    if (pending && (!submittedZips.length || submittedZips.some(zip => !/^\d{5}$/.test(zip)) || !selectedServices.length)) {
      setNotice('Enter five-digit ZIP codes and select at least one cleaning service.');
      return;
    }
    setBusy(true);
    setNotice('');
    try {
      const result = await api('provider', pending
        ? { action: 'onboard', hourlyCents: cents, zips: submittedZips, services: selectedServices, optedIn }
        : { hourlyCents: cents });
      if (result.provider) showProvider(result.provider);
      setNotice(result.alreadySubmitted
        ? 'Your profile already exists. Review the saved details shown here.'
        : pending
          ? 'Provider profile saved for review. Job offers require eligibility approval and an open network.'
          : 'Rate saved for future opportunities. Payments on accepted jobs stay unchanged.');
    } catch (error) {
      showError(error, 'Unable to save your provider profile.');
    } finally {
      setBusy(false);
    }
  }

  return <section className="mx-auto max-w-4xl px-5 py-14">
    <h2 className="text-3xl font-black">Your cleaning business</h2>
    <SignIn path="/provider" />
    <div className="mt-5 flex flex-wrap gap-5 leading-7">
      <a href={`${cleaningSiteUrl}/join-network`} className="font-bold underline">Cleaning network application</a>
      <a href={`${siteUrls.lms}/community`} className="font-bold underline">Open the community</a>
    </div>
    {needsEmailVerification ? <div className="mt-6 rounded-2xl border bg-white p-6">
      <h3 className="text-xl font-bold">Verify access to your email</h3>
      <p className="mt-3 leading-7">Open a secure sign-in link sent to your account email before viewing your application, provider profile, or assignments. Use the same browser to open the link.</p>
      <button type="button" onClick={() => void sendEmailLink()} disabled={busy || readOnly} className={`${button} mt-5`}>
        {busy ? 'Requesting link…' : 'Email me a secure sign-in link'}
      </button>
    </div> : null}
    {loaded && !provider && !applicantName ? <p className="mt-5 leading-7">Submit the cleaning network application with your verified account email, then return here to finish your provider profile.</p> : null}
    {provider || applicantName ? <>
      <p className="mt-6 font-bold">{provider?.name || applicantName}</p>
      <p className="mt-2 leading-7">Review status: {provider?.eligibility === 'eligible' ? 'Approved' : provider?.eligibility === 'suspended' ? 'Paused' : 'Pending review'}.</p>
      {pending ? <p className="mt-3 leading-7">Tell us your requested rate, service area, and services. The network team reviews your qualifications before approving job offers.</p>
        : provider?.eligibility === 'eligible' ? <p className="mt-3 leading-7">When the network is open, opted-in providers receive matching opportunities by email. Review the scope, payment, and stated time before choosing to accept a job.</p>
          : <p className="mt-3 leading-7">Contact the network team to review your paused status. Updating your rate does not restore eligibility.</p>}
      {!jobOffersEnabled ? <p className="mt-3 rounded-xl bg-slate-100 p-4 leading-7">Provider profiles are being prepared for review. Online job offers are not open yet; saving your profile does not confirm work.</p> : null}
      <form onSubmit={save} className="mt-6 space-y-6">
        <TenantProviderRate value={rate} onChange={setRate} required />
        {pending ? <>
          <label className="block font-bold">ZIP codes you can serve
            <input value={zips} onChange={event => setZips(event.target.value)} required maxLength={600} placeholder="46204, 46201" className={input} />
            <span className="mt-2 block text-sm font-normal">Separate five-digit ZIP codes with commas or spaces.</span>
          </label>
          <fieldset>
            <legend className="font-bold">Cleaning services you can provide</legend>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">{services.map(service => <label key={service} className="flex gap-3 rounded-xl border p-3">
              <input type="checkbox" checked={selectedServices.includes(service)} onChange={event => setSelectedServices(current => event.target.checked ? [...current, service] : current.filter(value => value !== service))} />
              <span>{serviceLabels[service]}</span>
            </label>)}</div>
          </fieldset>
          <label className="flex gap-3 rounded-xl border p-4 leading-7">
            <input type="checkbox" checked={optedIn} onChange={event => setOptedIn(event.target.checked)} className="mt-2" />
            <span>I want job-opportunity emails after my provider profile is approved and the network opens. Each job requires my separate acceptance.</span>
          </label>
          <p className="text-sm leading-7">You may save a profile without email opt-in. Job emails require your permission, approval, and a matching opportunity. Work is not guaranteed.</p>
        </> : null}
        <button disabled={busy || parseHourlyRate(rate) === null} className={button}>{busy ? 'Saving…' : pending ? 'Save provider profile for review' : 'Save hourly rate'}</button>
      </form>
      {provider?.eligibility === 'eligible' ? <>
        <h3 className="mt-8 text-2xl font-bold">Your assignments</h3>
        {!assigned.length ? <p className="mt-3 leading-7">No accepted assignments are listed.</p> : null}
        {assigned.map(job => <article key={job.id} className="mt-5 rounded-xl border p-5">
          <p className="font-bold">{job.service} · {new Date(job.starts_at).toLocaleString()} · {statusLabels[job.status] || job.status}</p>
          <p className="mt-3">{job.customer_name} · {job.customer_email} · Your business payment: {money(job.provider_pay_cents)}</p>
          <p className="mt-3 whitespace-pre-wrap leading-7">{job.private_details}</p>
        </article>)}
      </> : null}
    </> : null}
    {notice ? <p role="status" className="mt-5 leading-7">{notice}</p> : null}
  </section>;
}
export function TenantCleaningOffer(){
 const api=useCleaningApi();const [job,setJob]=useState<any>(null);const [credentials,setCredentials]=useState({id:'',token:''});const [accepted,setAccepted]=useState(false);const [notice,setNotice]=useState('');const [busy,setBusy]=useState(false);
 useEffect(()=>{const id=new URLSearchParams(window.location.search).get('offer')||'';const token=new URLSearchParams(window.location.hash.slice(1)).get('token')||'';setCredentials({id,token});if(!id||!token){setNotice('Open the private offer link from your email.');return;}void api(`offers?id=${encodeURIComponent(id)}`,undefined,token).then(r=>{setJob(r.job);setAccepted(r.accepted===true);}).catch(e=>setNotice(e.message));},[]); // eslint-disable-line react-hooks/exhaustive-deps
 async function accept(event:FormEvent){event.preventDefault();if(busy)return;setBusy(true);try{const result=await api(`offers?id=${encodeURIComponent(credentials.id)}`,{confirm:true},credentials.token);setJob({...job,...result.job});setAccepted(true);setNotice('You accepted this cleaning assignment. Customer details are below.');}catch(e){setNotice(e instanceof Error?e.message:'Unable to accept this offer.');}finally{setBusy(false);}}
 return <section className="mx-auto max-w-3xl px-5 py-14"><h2 className="text-3xl font-black">{accepted?'Your cleaning assignment':'Review cleaning opportunity'}</h2>{job?<article className="mt-6 space-y-4 rounded-2xl border bg-white p-6"><p className="text-xl font-bold">{job.service} · ZIP {job.zip}</p><p>{new Date(job.starts_at).toLocaleString()}</p><p className="whitespace-pre-wrap leading-7">{job.summary}</p><p className="font-bold">Your business receives {money(job.provider_pay_cents)} before your own expenses and taxes.</p>
  {accepted?<><p>{job.customer_name} · {job.customer_email}</p><p className="whitespace-pre-wrap leading-7">{job.private_details}</p></>:<form onSubmit={accept} className="space-y-5"><p>{job.cleaner_hours} total cleaner-hours. The first eligible provider to confirm receives the assignment.</p><label className="flex gap-3 leading-7"><input type="checkbox" required className="mt-2"/><span>I can perform this scope at the stated time and accept the displayed total business payment.</span></label><button disabled={busy} className={button}>{busy?'Confirming…':'Accept this job'}</button></form>}</article>:null}{notice?<p role="status" className="mt-5 leading-7">{notice}</p>:null}</section>;
}
