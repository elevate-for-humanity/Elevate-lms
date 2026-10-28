'use client';
import { useEffect,useState } from 'react';
type Apprentice={enrollmentId:string;name:string;standard:{occupationTitle:string}};
type Entry={id:string;service_name:string;performed_on:string;subject_type:string};
type PracticeItem={id:string;service_name:string;exercise_title:string;instructions:string;requiredCount:number;recordedCount:number;complete:boolean;authority:string};
const services:Record<string,string[]>={
 barber:['Clipper cut','Fade','Taper','Scissor cut','Beard trim','Razor shave','Line-up','Shampoo','Client consultation'],
 cosmetology:['Haircut','Blowout','Silk press','Roller set','Braids','Updo','Single-process color','Highlights','Color correction','Relaxer','Perm','Shampoo and conditioning'],
 esthetician:['Skin analysis','Basic facial','Deep cleansing facial','Mask application','Waxing','Brow shaping','Makeup application','Facial massage'],
 manicurist:['Basic manicure','Pedicure','Gel polish','Acrylic full set','Nail fill','Nail art','Nail repair','Nail removal']
};
function listFor(program:string){const p=program.toLowerCase();return p.includes('barber')?services.barber:p.includes('esthet')?services.esthetician:p.includes('nail')||p.includes('manicur')?services.manicurist:services.cosmetology;}
export default function PracticalLogPage(){
 const [apprentices,setApprentices]=useState<Apprentice[]>([]);
 const [selected,setSelected]=useState('');
 const [entries,setEntries]=useState<Entry[]>([]);
 const [service,setService]=useState('');
 const [subject,setSubject]=useState('patron');
 const [date,setDate]=useState(new Date().toISOString().slice(0,10));
 const [message,setMessage]=useState('');
 const [busy,setBusy]=useState(false);
 const [canRecord,setCanRecord]=useState(false);
 const [practice,setPractice]=useState<{items:PracticeItem[];requiredCount:number;recordedCount:number;percent:number;complete:boolean}>({items:[],requiredCount:0,recordedCount:0,percent:100,complete:true});
 useEffect(()=>{fetch('/api/host-shop/competencies').then(r=>r.json()).then(d=>setApprentices(d.apprentices||[])).catch(()=>setMessage('Unable to load assigned apprentices.'));},[]);
 const apprentice=apprentices.find(a=>a.enrollmentId===selected);
 const options=apprentice?listFor(apprentice.standard.occupationTitle):[];
 useEffect(()=>{if(!selected){setEntries([]);setPractice({items:[],requiredCount:0,recordedCount:0,percent:100,complete:true});return;}fetch('/api/host-shop/practical-services?enrollmentId='+encodeURIComponent(selected)).then(r=>r.json()).then(d=>{if(d.error)throw Error(d.error);setEntries(d.entries||[]);setCanRecord(d.canRecord===true);setPractice(d.practice||{items:[],requiredCount:0,recordedCount:0,percent:100,complete:true});}).catch(e=>setMessage(String(e)));},[selected]);
 async function save(){
  if(!apprentice||!service||!canRecord)return;
  setBusy(true);setMessage('');
  try{
   // Practical categories are observational logs, not formal Appendix A approvals.
   const response=await fetch('/api/host-shop/practical-services',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({enrollmentId:selected,serviceName:service,subjectType:subject,performedOn:date})});
   const d=await response.json();if(!response.ok)throw Error(d.error||'Save failed');
   const refreshed=await fetch('/api/host-shop/practical-services?enrollmentId='+encodeURIComponent(selected));const data=await refreshed.json();setEntries(data.entries||[]);setPractice(data.practice||practice);setMessage('Practical service saved.');
  }catch(e){setMessage(e instanceof Error?e.message:'Save failed');}finally{setBusy(false);}
 }
 const totals=new Map<string,number>();entries.forEach(e=>totals.set(e.service_name,(totals.get(e.service_name)||0)+1));
 return <main className="mx-auto max-w-5xl space-y-6 px-4 py-8"><h1 className="text-3xl font-black">Practical Service Log</h1><p className="text-slate-700">Record each supervised haircut, hairstyle, color, facial or nail service. These are practice records, not Appendix A competency sign-offs. Elevate manages formal apprenticeship approvals.</p><label className="block font-bold">Select apprentice<select className="mt-2 w-full rounded-lg border p-3" value={selected} onChange={e=>{setSelected(e.target.value);setService('');}}><option value="">Choose an apprentice</option>{apprentices.map(a=><option key={a.enrollmentId} value={a.enrollmentId}>{a.name} — {a.standard.occupationTitle}</option>)}</select></label>{apprentice&&<>{!canRecord&&<p className="rounded-xl border border-amber-300 bg-amber-50 p-4">Read-only practice records. The Host Shop owner checks off completed services.</p>}{canRecord&&<section className="rounded-xl border bg-white p-5"><h2 className="text-xl font-bold">Record a completed service</h2><div className="mt-4 grid gap-3 sm:grid-cols-3"><label>Service<select className="mt-1 w-full rounded-lg border p-3" value={service} onChange={e=>setService(e.target.value)}><option value="">Select service</option>{options.map(v=><option key={v}>{v}</option>)}</select></label><label>Performed on<select className="mt-1 w-full rounded-lg border p-3" value={subject} onChange={e=>setSubject(e.target.value)}><option value="patron">Client</option><option value="mannequin">Mannequin</option><option value="student">Student</option></select></label><label>Date<input type="date" max={new Date().toISOString().slice(0,10)} className="mt-1 w-full rounded-lg border p-3" value={date} onChange={e=>setDate(e.target.value)}/></label></div><button disabled={busy||!service} onClick={save} className="mt-4 rounded-lg bg-blue-800 px-5 py-3 font-bold text-white disabled:opacity-50">Save completed service</button></section>}{practice.items.length>0&&<section className="rounded-xl border bg-white p-5"><h2 className="text-xl font-bold">Required hands-on exercises</h2><p className="mt-2 text-sm text-slate-600">Program practice target: {practice.recordedCount} of {practice.requiredCount} ({practice.percent}%). These targets are Elevate program requirements, not a claim about state-law service counts.</p><div className="mt-4 space-y-4">{practice.items.map(item=><article key={item.id} className="rounded-xl border p-4"><div className="flex flex-wrap items-center justify-between gap-2"><h3 className="font-bold">{item.exercise_title}</h3><strong className={item.complete?'text-emerald-700':'text-amber-700'}>{item.recordedCount} / {item.requiredCount}</strong></div><p className="mt-2 text-sm text-slate-700">{item.instructions}</p>{canRecord&&<button className="mt-3 rounded border px-3 py-2" onClick={()=>setService(item.service_name)}>Record {item.service_name}</button>}</article>)}</div></section>}<section className="rounded-xl border bg-white p-5"><h2 className="text-xl font-bold">Service count checklist</h2><div className="mt-3 overflow-x-auto"><table className="w-full text-left text-sm"><thead><tr className="border-b"><th className="p-2">Activity</th><th className="p-2">Recorded</th><th className="p-2">Mark completed</th></tr></thead><tbody>{options.map(v=><tr key={v} className="border-b"><td className="p-2">{v}</td><td className="p-2">{totals.get(v)||0}</td><td className="p-2">{canRecord ? <button className="rounded border px-3 py-2" onClick={()=>setService(v)}>Select +</button> : <span>Owner checkoff</span>}</td></tr>)}</tbody></table></div></section></>}{message&&<p role="status" className="rounded-lg bg-slate-100 p-3">{message}</p>}</main>;
}
