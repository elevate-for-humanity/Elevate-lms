'use client';
import {useState} from 'react';
import {HVAC_COURSE_ID} from '@/lib/lms/hvac-workbook-contract';

export default function HvacCompletionReview({readOnly}:{readOnly:boolean}) {
 const [busy,setBusy]=useState(false);const [message,setMessage]=useState('');const [missing,setMissing]=useState<string[]>([]);
 async function review(){setBusy(true);setMessage('Checking saved course requirements…');setMissing([]);try{
  const response=await fetch(`/api/courses/${HVAC_COURSE_ID}/complete`,{method:'POST',headers:{'Content-Type':'application/json'},body:'{}'});
  const data=await response.json();
  if(!response.ok){setMissing(Array.isArray(data.missingRequirements)?data.missingRequirements:[]);throw Error(data.error||'Completion review could not finish.');}
  setMessage('Course requirements verified. Your completion record and certificate are available in your learner dashboard. Program practical and external credential requirements remain separate.');
 }catch(error){setMessage(error instanceof Error?error.message:'Completion review could not finish.');}finally{setBusy(false);}}
 return <section className="my-6 rounded-xl border border-stone-400 bg-white p-5" aria-label="Final HVAC course completion review"><h2 className="text-xl font-bold">Finished the workbook and practice tests?</h2><p className="mt-3 leading-relaxed">After all lessons, saved workbook responses, chapter reviews, and four practice passes are complete, request the server's final course check. It verifies your actual records; clicking does not invent missing work or award practical hours.</p><button type="button" disabled={readOnly||busy} onClick={()=>void review()} className="mt-4 min-h-12 rounded-lg bg-stone-900 px-5 py-3 font-bold text-white disabled:opacity-50">{readOnly?'Completion review is disabled in administrator preview':busy?'Checking…':'Check requirements and finish course'}</button>{message&&<p role="status" className="mt-4 font-semibold">{message}</p>}{missing.length>0&&<ul className="mt-3 list-disc space-y-2 pl-6">{missing.map(item=><li key={item}>{item}</li>)}</ul>}</section>;
}
