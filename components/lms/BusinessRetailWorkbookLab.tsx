'use client';
import { LearningPreview } from './LearningWorkspace';
import { useState } from 'react';
import WorkbookNarration from './WorkbookNarration';
import {businessRetailProjects,businessRetailCase,checkBusinessRetailNumber} from '@/lib/lms/business-retail-workbook.mjs';

/** Formative practice only. Results use the existing owner/version-checked
 * workbook save; no assessments, hours or instructor sign-offs are changed. */
export default function BusinessRetailWorkbookLab({sectionNumber,readOnly,onRecord}:{sectionNumber:number;readOnly:boolean;onRecord:(record:string)=>Promise<boolean>}) {
 const p=businessRetailProjects[sectionNumber-1];
 const [variant,setVariant]=useState(0),[choice,setChoice]=useState<number|null>(null),[numbers,setNumbers]=useState<string[]>([]),[checked,setChecked]=useState(false),[reason,setReason]=useState('');
 const [recordStatus,setRecordStatus]=useState('');
 if(!p)return null;
 const scenario=businessRetailCase(p.math,variant);
 const correct=choice===p.correct&&scenario.checks.every((c,i)=>checkBusinessRetailNumber(numbers[i]??'',c[1]));
 const summary=`Simulation: ${p.title}\nCase ${'ABC'[variant]}: ${scenario.facts}\nDecision: ${choice===null?'Not answered':p.choices[choice]}\n${scenario.checks.map((c,i)=>`${c[0]}: ${numbers[i]??''}`).join('\n')}\nSelf-check: ${correct?'Meets this case’s checks':'Revise and retry'}\nMy reasoning: ${reason.trim()}\nFormative practice only; instructor project review is separate.`;
 return <section aria-label={`${p.title} simulation`} className="my-6 space-y-4 rounded-2xl border border-teal-700 bg-teal-50 p-5 sm:p-7">
  <p className="font-semibold text-teal-900">Business & retail project lab</p><h3 className="text-2xl font-bold">{p.title}</h3>
  <p className="max-w-prose whitespace-pre-line leading-7">{p.teaching}</p>
  <WorkbookNarration text={`${p.title}. ${p.teaching} Case. ${p.scenario} ${scenario.facts} ${p.decision}`} />
  <label className="block font-semibold">Practice case<select className="mt-2 block min-h-12 w-full rounded border border-slate-500 bg-white p-3" value={variant} onChange={e=>{setVariant(Number(e.target.value));setChecked(false);setNumbers([]);setChoice(null);setReason('');}}>{['A','B','C'].map((v,i)=><option value={i} key={v}>Case {v}</option>)}</select></label>
  <p className="max-w-prose leading-7">{p.scenario}</p><p className="rounded-lg border border-teal-700 bg-white p-4 leading-7">{scenario.facts}</p>
  <LearningPreview><article className="space-y-3 rounded-xl border border-teal-300 bg-white p-5" aria-label="Business case preview"><h3 className="text-xl font-bold">{p.title} · Case {'ABC'[variant]}</h3><p>{p.scenario}</p><p>{scenario.facts}</p><p className="whitespace-pre-line leading-7">{summary}</p></article></LearningPreview>
  <fieldset className="space-y-3"><legend className="mb-3 text-lg font-bold">{p.decision}</legend>{p.choices.map((c,i)=><label className="flex min-h-12 items-start gap-3 rounded-lg border border-slate-400 bg-white p-3" key={c}><input type="radio" className="mt-1" name={`business-lab-${p.id}`} checked={choice===i} onChange={()=>{setChoice(i);setChecked(false);}}/>{c}</label>)}</fieldset>
  {scenario.checks.map((c,i)=><label className="block font-semibold" key={c[0]}>{c[0]}<input type="number" step="0.01" className="mt-2 block min-h-12 w-full rounded border border-slate-500 bg-white p-3" value={numbers[i]??''} onChange={e=>{setNumbers(old=>{const n=[...old];n[i]=e.target.value;return n;});setChecked(false);}}/></label>)}
  <label className="block font-semibold">Explain your decision and show your working<textarea className="mt-2 block w-full rounded border border-slate-500 bg-white p-3 leading-7" rows={4} maxLength={1800} value={reason} onChange={e=>setReason(e.target.value)}/></label>
  <button type="button" className="min-h-12 rounded-lg bg-teal-900 px-5 py-3 font-bold text-white disabled:opacity-50" disabled={choice===null||scenario.checks.some((_,i)=>!(numbers[i]??'').trim())} onClick={()=>setChecked(true)}>Check this case</button>
  {checked&&<div role="status" aria-live="polite" className="space-y-2 rounded-lg border border-slate-400 bg-white p-4"><p className="font-bold">{correct?'This case meets the self-check.':'Review the feedback, correct your work and retry.'}</p><p>{p.explanation}</p>{scenario.checks.map((c,i)=><p key={c[0]}>{c[0]}: {checkBusinessRetailNumber(numbers[i]??'',c[1])?'Correct.':'Check your calculation.'} {c[2]}.</p>)}</div>}
  <button type="button" className="ml-0 min-h-12 rounded-lg border border-teal-900 bg-white px-5 py-3 font-bold disabled:opacity-50 sm:ml-3" disabled={readOnly||!checked||reason.trim().length<20} onClick={async()=>{setRecordStatus('Saving attempt…');const saved=await onRecord(summary);setRecordStatus(saved?'Attempt saved in Practice 3.':'Attempt could not be saved. Check the workbook save status; if Practice 3 is full, keep your work and shorten it before retrying.');}}>Add this attempt to Practice 3</button>
  {recordStatus&&<p role="status" aria-live="polite">{recordStatus}</p>}
  <p className="text-sm leading-6">Attempts can be saved with corrections still needed. Check the workbook’s save status to confirm storage. Practice does not award attendance hours, complete course assessments, or certify a skill. A project needs instructor feedback beyond these numerical and decision checks.</p>
 </section>;
}
