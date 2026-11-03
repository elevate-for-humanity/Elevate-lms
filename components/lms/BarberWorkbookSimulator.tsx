'use client';

import {useState} from 'react';
import WorkbookNarration from './WorkbookNarration';

const exercises = [
  {
    title: 'Choose the clipper guard',
    prompt: 'For a simulated longer side length, which guard preserves more hair?',
    choices: ['#1 guard (shorter cut)', '#4 guard (longer cut)', 'Remove the guard and use the bare blade'],
    correct: 1,
    explanation: 'A higher numbered standard guard leaves more length. Always confirm actual guard dimensions with the manufacturer before supervised practice.',
  },
  {
    title: 'Place the fade guideline',
    prompt: 'For a low fade on a mannequin, where should the initial transition stay?',
    choices: ['Low around the lower sides and nape', 'High near the parietal ridge', 'Across the top of the crown'],
    correct: 0,
    explanation: 'A low fade keeps the main transition low on the sides and back. Check the desired design with the client or trainer first.',
  },
  {
    title: 'Blend a visible weight line',
    prompt: 'A visible weight line remains. What is the safer controlled next decision?',
    choices: ['Take the shortest guard over the entire head', 'Inspect the transition and blend gradually using a suitable intermediate guard', 'Skip the inspection and proceed to edging'],
    correct: 1,
    explanation: 'Make a conservative adjustment after inspecting the line rather than removing unnecessary length.',
  },
] as const;

/** Interactive conceptual simulation only; never records workplace/practical hours. */
export default function BarberWorkbookSimulator({sectionNumber}:{sectionNumber:number}) {
  const [stage,setStage]=useState(0);
  const [choice,setChoice]=useState<number|null>(null);
  const [checked,setChecked]=useState(false);
  const [complete,setComplete]=useState(false);
  const [passes,setPasses]=useState(0);
  const task=exercises[stage];
  const correct=checked && choice===task.correct;
  const guard=stage===0 && correct?'#4':'#1';
  return <section className="my-6 rounded-2xl border border-slate-300 bg-white p-5" aria-label="Virtual barber mannequin practice">
    <p className="text-sm font-bold uppercase tracking-wide text-violet-800">Interactive virtual practice · Workbook section {sectionNumber}</p>
    <h3 className="mt-2 text-2xl font-bold">Practice on a virtual mannequin</h3>
    <p className="mt-2 leading-relaxed">Make a decision, see the illustrated haircut change, and retry until you understand the correct answer. This is not a real haircut, verified practical competence, or on-the-job training time.</p>
    <svg viewBox="0 0 360 280" role="img" aria-label={`Illustrated mannequin with ${guard} guard choice and ${stage===1?'fade guideline':'clipper section'}`} className="my-4 w-full max-w-md rounded-xl bg-slate-50">
      <rect x="0" y="0" width="360" height="280" rx="16" fill="#f8fafc"/>
      <path d="M152 203 L152 241 Q180 260 208 241 L208 203" fill="#bd896d" stroke="#574436" strokeWidth="3"/>
      <ellipse cx="180" cy="125" rx="73" ry="91" fill="#d9a786" stroke="#574436" strokeWidth="3"/>
      <path d="M109 131 Q87 45 155 32 Q229 8 251 100 Q244 74 234 58 Q208 92 124 81 Z" fill="#34241f"/>
      <path d="M108 129 Q111 187 145 200 M252 129 Q249 187 215 200" fill="none" stroke={correct?'#0f766e':'#a16207'} strokeWidth={stage===1?12:5} strokeLinecap="round"/>
      <path d={stage===1?'M113 166 Q180 194 247 166':'M112 128 Q180 150 248 128'} fill="none" stroke={correct?'#0f766e':'#a16207'} strokeWidth="4" strokeDasharray="8 6"/>
      <path d="M148 120 h18 M194 120 h18 M165 157 Q180 165 195 157" fill="none" stroke="#574436" strokeWidth="3" strokeLinecap="round"/>
      {passes>0&&<path d="M111 130 Q108 150 126 179" fill="none" stroke="#d7aa8b" strokeWidth="16" strokeDasharray={`${passes*14} 200`} strokeLinecap="round" />}
      <g transform={`translate(${60+passes*13} ${170-passes*10})`}>
        <rect x="0" y="0" width="26" height="47" rx="6" fill="#64748b" stroke="#0f172a" strokeWidth="2"/>
        <rect x="4" y="-6" width="18" height="12" rx="2" fill="#cbd5e1" stroke="#0f172a"/>
        <text x="-14" y="63" fontSize="11" fill="#334155">Virtual clipper</text>
      </g>
      <text x="18" y="260" fontSize="15" fill="#334155">{stage===0?'Guard selection':stage===1?'Fade placement':'Blend correction'}</text>
      <text x="230" y="260" fontSize="16" fontWeight="bold" fill="#334155">{stage===0?guard:'Virtual guide'}</text>
    </svg>
    <div className="my-4"><p className="font-bold">Step {stage+1} of {exercises.length}: {task.title}</p><p className="mt-2">{task.prompt}</p><WorkbookNarration text={`Virtual practice. ${task.title}. ${task.prompt} ${task.choices.join('. ')}`} /></div>
    <fieldset className="space-y-2"><legend className="sr-only">{task.prompt}</legend>{task.choices.map((option,index)=><label key={option} className="flex min-h-12 items-center gap-3 rounded-lg border border-stone-300 p-3"><input type="radio" name={`barber-practice-${stage}`} checked={choice===index} onChange={()=>{setChoice(index);setChecked(false);}} />{option}</label>)}</fieldset>
    {checked&&<p role="status" aria-live="polite" className={`my-4 rounded-lg p-4 font-semibold ${correct?'bg-emerald-50 text-emerald-900':'bg-amber-50 text-amber-950'}`}>{correct?'Correct. ':'Not quite—try again. '}{task.explanation}</p>}
    <div className="mt-4 flex flex-wrap gap-3">
      <button type="button" onClick={()=>setChecked(true)} disabled={choice===null||complete} className="min-h-12 rounded-lg bg-slate-900 px-5 py-3 font-semibold text-white disabled:opacity-50">Check my answer</button>
      <button type="button" onClick={()=>setPasses(value=>Math.min(4,value+1))} disabled={!correct||passes>=4||complete} className="min-h-12 rounded-lg border border-slate-500 px-5 py-3 font-semibold disabled:opacity-50">Make a virtual clipper pass ({passes}/4)</button>
      {correct&&!complete&&<button type="button" onClick={()=>{if(stage===exercises.length-1){setComplete(true);}else{setStage(s=>s+1);setChoice(null);setChecked(false);setPasses(0);}}} className="min-h-12 rounded-lg bg-emerald-700 px-5 py-3 font-semibold text-white">{stage===exercises.length-1?'Finish virtual practice':'Next practice step'}</button>}
      {complete&&<button type="button" onClick={()=>{setComplete(false);setStage(0);setChoice(null);setChecked(false);setPasses(0);}} className="min-h-12 rounded-lg border px-5 py-3 font-semibold">Practice again</button>}
    </div>
    {complete&&<p role="status" className="mt-4 rounded-lg bg-emerald-50 p-4 font-bold">Virtual practice completed. Record what you learned in the workbook. Your practical hours and instructor sign-off have not changed.</p>}
  </section>;
}
