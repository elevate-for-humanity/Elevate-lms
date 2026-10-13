'use client';

import { useMemo, useState } from 'react';

type Item = Record<string, unknown>;
const t=(v:unknown)=>typeof v==='string'?v:'';
const n=(v:unknown)=>typeof v==='number'?v:Number(v)||0;

export function TenantAssessment({ content, accent }:{content:Record<string,unknown>;accent:string}) {
  const questions=Array.isArray(content.questions)?content.questions.filter((x):x is Item=>!!x&&typeof x==='object'):[];
  const [answers,setAnswers]=useState<Record<number,number>>({});
  const [done,setDone]=useState(false);
  const score=useMemo(()=>questions.reduce((sum,q,i)=>sum+n((Array.isArray(q.options)?q.options:[])[answers[i]??-1] && (Array.isArray(q.options)?q.options:[])[answers[i]??-1] && typeof (Array.isArray(q.options)?q.options:[])[answers[i]??-1]==='object' ? ((Array.isArray(q.options)?q.options:[])[answers[i]??-1] as Item).score:0),0),[answers,questions]);
  const max=useMemo(()=>questions.reduce((sum,q)=>sum+Math.max(0,...(Array.isArray(q.options)?q.options:[]).map(o=>o&&typeof o==='object'?n((o as Item).score):0)),0),[questions]);
  const pct=max?Math.round(score/max*100):0;
  const results=Array.isArray(content.results)?content.results.filter((x):x is Item=>!!x&&typeof x==='object'):[];
  const result=results.find(r=>pct>=n(r.min)&&pct<=n(r.max))||results.at(-1);
  return <section className="mx-auto max-w-4xl px-5 py-14 sm:px-6">
    <h2 className="text-3xl font-black">{t(content.title)||'Assessment'}</h2>
    {t(content.text)&&<p className="mt-3 leading-7 text-slate-600">{t(content.text)}</p>}
    <div className="mt-8 space-y-6">{questions.map((q,i)=><fieldset key={i} className="rounded-2xl border p-5"><legend className="px-2 font-black">{i+1}. {t(q.question)}</legend><div className="mt-3 space-y-2">{(Array.isArray(q.options)?q.options:[]).map((o,j)=>{const x=o as Item;return <label key={j} className="flex gap-3 rounded-xl border p-3"><input type="radio" name={'q'+i} checked={answers[i]===j} onChange={()=>setAnswers(a=>({...a,[i]:j}))}/><span>{t(x.label)}</span></label>})}</div></fieldset>)}</div>
    {!done?<button disabled={Object.keys(answers).length!==questions.length} onClick={()=>setDone(true)} className="mt-7 rounded-full px-6 py-3 font-black text-white disabled:opacity-40" style={{backgroundColor:accent}}>See my results</button>:<div className="mt-8 rounded-3xl border p-7"><p className="text-sm font-black uppercase tracking-widest" style={{color:accent}}>Your result · {pct}%</p><h3 className="mt-2 text-2xl font-black">{t(result?.title)||'Assessment complete'}</h3><p className="mt-3 leading-7 text-slate-600">{t(result?.text)}</p>{t(result?.href)&&<a href={t(result?.href)} className="mt-5 inline-flex rounded-full px-5 py-3 font-black text-white" style={{backgroundColor:accent}}>{t(result?.buttonText)||'Next step'}</a>}</div>}
  </section>;
}

export function TenantJournal({content,accent}:{content:Record<string,unknown>;accent:string}) {
 const items=Array.isArray(content.items)?content.items.filter((x):x is Item=>!!x&&typeof x==='object'):[];
 return <section className="mx-auto max-w-7xl px-5 py-14 sm:px-6"><h2 className="text-3xl font-black">{t(content.title)||'Journal'}</h2><div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">{items.map((x,i)=><article key={i} className="overflow-hidden rounded-3xl border bg-white">{t(x.image)&&<img src={t(x.image)} alt="" className="aspect-[16/9] w-full object-cover"/>}<div className="p-6"><p className="text-xs font-black uppercase tracking-wider" style={{color:accent}}>{t(x.category)}</p><h3 className="mt-2 text-xl font-black">{t(x.title)}</h3><p className="mt-3 leading-7 text-slate-600">{t(x.excerpt)}</p>{t(x.href)&&<a href={t(x.href)} className="mt-4 inline-block font-black" style={{color:accent}}>Read more →</a>}</div></article>)}</div></section>
}

export function TenantEvents({content,accent}:{content:Record<string,unknown>;accent:string}) {
 const items=Array.isArray(content.items)?content.items.filter((x):x is Item=>!!x&&typeof x==='object'):[];
 return <section className="mx-auto max-w-5xl px-5 py-14 sm:px-6"><h2 className="text-3xl font-black">{t(content.title)||'Events'}</h2><div className="mt-8 space-y-4">{items.map((x,i)=><article key={i} className="rounded-3xl border bg-white p-6 sm:flex sm:items-center sm:justify-between sm:gap-6"><div><p className="text-sm font-black" style={{color:accent}}>{t(x.date)}{t(x.time)?' · '+t(x.time):''}</p><h3 className="mt-1 text-xl font-black">{t(x.title)}</h3><p className="mt-2 text-slate-600">{t(x.description)}</p></div>{t(x.href)&&<a href={t(x.href)} className="mt-4 inline-flex shrink-0 rounded-full px-5 py-3 font-black text-white sm:mt-0" style={{backgroundColor:accent}}>{t(x.buttonText)||'Register'}</a>}</article>)}</div></section>
}
