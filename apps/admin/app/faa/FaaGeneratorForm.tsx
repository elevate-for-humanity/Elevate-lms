'use client';
import {useState, type FormEvent, type ChangeEvent} from 'react';
type Props={students:{id:string;name:string;email:string}[];programs:{key:string;label:string;weeks:number;source:string;total:number}[];signerName:string};
function endDateFor(start:string,weeks:number){
  if(!/^\d{4}-\d{2}-\d{2}$/.test(start))return '';
  const d=new Date(start+'T12:00:00Z');if(Number.isNaN(d.valueOf()))return '';
  d.setUTCDate(d.getUTCDate()+weeks*7);return d.toISOString().slice(0,10);
}
export default function FaaGeneratorForm({students,programs,signerName}:Props){
  const [studentId,setStudentId]=useState('');
  const [programKey,setProgramKey]=useState(programs[0]?.key||'');
  const [startDate,setStartDate]=useState('');
  const [sign,setSign]=useState(false),[approved,setApproved]=useState(false);
  const [confirmName,setConfirmName]=useState(''),[image,setImage]=useState('');
  const [imageConsent,setImageConsent]=useState(false),[busy,setBusy]=useState(false);
  const [error,setError]=useState(''),[result,setResult]=useState('');
  const program=programs.find(p=>p.key===programKey);
  const endDate=program?endDateFor(startDate,program.weeks):'';
  function selectImage(e:ChangeEvent<HTMLInputElement>){
    setError('');setImage('');const file=e.target.files?.[0];if(!file)return;
    if(file.type!=='image/png'||file.size>300000){setError('Choose your PNG signature under 300 KB.');return;}
    const reader=new FileReader();reader.onload=()=>setImage(String(reader.result||''));reader.readAsDataURL(file);
  }
  async function saveSignature(){
    setError('');setResult('');setBusy(true);
    try{
      const r=await fetch('/api/admin/faa/signature',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({image,consent:imageConsent})});
      const data=await r.json();if(!r.ok)throw Error(data.error||'Signature save failed');
      setResult('Private signature saved. Every signed FAA still requires your approval.');setImage('');setImageConsent(false);
    }catch(e){setError(e instanceof Error?e.message:'Signature save failed');}finally{setBusy(false);}
  }
  async function generate(e:FormEvent<HTMLFormElement>){
    e.preventDefault();setError('');setResult('');setBusy(true);
    try{
      if(!studentId||!startDate||!endDate)throw Error('Choose a student and a valid start date.');
      const r=await fetch('/api/admin/faa/generate',{method:'POST',headers:{'Content-Type':'application/json'},
        body:JSON.stringify({studentId,programKey,startDate,sign,approved,confirmName})});
      if(!r.ok){const data=await r.json().catch(()=>({}));throw Error(data.error||'FAA generation failed');}
      const file=await r.blob();if(file.type!=='application/pdf')throw Error('Unexpected document response');
      const url=URL.createObjectURL(file),a=document.createElement('a');
      const name=students.find(s=>s.id===studentId)?.name||'student';
      a.href=url;a.download='FAA_'+name.replace(/[^a-z0-9_-]/gi,'_')+'_'+startDate+(sign?'_signed':'_draft')+'.pdf';
      document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),20000);
      setResult('FAA stored in the private student binder and downloaded. WorkOne funding remains pending.');
      setApproved(false);setConfirmName('');
    }catch(e){setError(e instanceof Error?e.message:'Could not generate FAA');}finally{setBusy(false);}
  }
  return <div className="space-y-6">
    <section className="rounded-xl border bg-white p-5">
      <h2 className="text-xl font-bold">Save your signature once</h2>
      <p className="my-2 text-sm text-slate-600">Upload a PNG of your actual signature; it is kept private and used only when you approve a specific FAA.</p>
      <input type="file" accept="image/png" onChange={selectImage} className="block w-full"/>
      <label className="mt-3 flex gap-2 text-sm"><input type="checkbox" checked={imageConsent} onChange={e=>setImageConsent(e.target.checked)}/>I own this signature and authorize its private storage.</label>
      <button type="button" disabled={!image||!imageConsent||busy} onClick={saveSignature} className="mt-3 rounded-lg bg-slate-900 px-4 py-2 text-white disabled:opacity-50">Save signature</button>
    </section>
    <form onSubmit={generate} className="space-y-4 rounded-xl border bg-white p-5">
      <h2 className="text-xl font-bold">Generate WorkOne FAA</h2>
      <label className="block text-sm font-semibold">Student<select required value={studentId} onChange={e=>setStudentId(e.target.value)} className="mt-1 block w-full rounded border p-3">
        <option value="">Select student...</option>{students.map(s=><option key={s.id} value={s.id}>{s.name} — {s.email}</option>)}
      </select></label>
      <label className="block text-sm font-semibold">Program<select value={programKey} onChange={e=>setProgramKey(e.target.value)} className="mt-1 block w-full rounded border p-3">
        {programs.map(p=><option key={p.key} value={p.key}>{p.label}</option>)}
      </select></label>
      {program&&<p className="rounded bg-amber-50 p-3 text-sm text-amber-900">
        Duration: {program.weeks} weeks. Proposed total: {'$'+(program.total/100).toFixed(2)}.
        Source: {program.source}. Verify costs before signing.
      </p>}
      <label className="block text-sm font-semibold">Start date<input required type="date" value={startDate} onChange={e=>setStartDate(e.target.value)} className="mt-1 block w-full rounded border p-3"/></label>
      <label className="block text-sm font-semibold">End date<input readOnly value={endDate} className="mt-1 block w-full rounded border bg-slate-100 p-3"/></label>
      <label className="flex gap-2 text-sm"><input type="checkbox" checked={sign} onChange={e=>{setSign(e.target.checked);setApproved(false);setConfirmName('');}}/>Automatically place my saved signature on this FAA after I approve it.</label>
      {sign&&<div className="space-y-3 rounded border border-blue-300 bg-blue-50 p-4">
        <p className="text-sm">Signer: {signerName||'Unavailable'}. This does not constitute WorkOne funding approval.</p>
        <label className="flex gap-2 text-sm"><input type="checkbox" checked={approved} onChange={e=>setApproved(e.target.checked)}/>I reviewed this FAA and authorize my signature for this student.</label>
        <label className="block text-sm">Type exact signer name<input value={confirmName} onChange={e=>setConfirmName(e.target.value)} className="mt-1 block w-full rounded border p-2"/></label>
      </div>}
      <button disabled={busy||!studentId||!startDate||(sign&&(!approved||confirmName.trim()!==signerName.trim()))} className="rounded-lg bg-blue-800 px-5 py-3 font-semibold text-white disabled:opacity-50">
        {busy?'Generating...':sign?'Approve, sign and download':'Generate unsigned FAA'}
      </button>
      {error&&<p role="alert" className="rounded bg-red-50 p-3 text-red-800">{error}</p>}
      {result&&<p role="status" className="rounded bg-green-50 p-3 text-green-800">{result}</p>}
    </form>
  </div>;
}
