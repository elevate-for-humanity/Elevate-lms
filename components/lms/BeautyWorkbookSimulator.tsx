'use client';
import { LearningPreview } from './LearningWorkspace';
import {useState} from 'react';
import WorkbookNarration from './WorkbookNarration';

const LABS = {
  'prestige-elevation-cosmetology': {
    name:'Virtual salon preparation',
    action:'Hair service readiness',
    question:'Before beginning a haircut on a mannequin, what should the learner do?',
    choices:['Check the assigned lesson, sanitize the station, inspect tools and confirm the trainer’s plan','Start cutting immediately to save time','Use whatever blade or attachment is closest'],
    correct:0,
    explanation:'A prepared station, inspected equipment, and an approved plan come before simulated or supervised service.',
    caption:'A mannequin and workstation illustrate the setup decision.',
  },
  'prestige-elevation-esthetics': {
    name:'Virtual facial consultation',
    action:'Skin-service readiness',
    question:'A client reports unexpected irritation during preparation. What should the learner do?',
    choices:['Continue the product application to finish the service','Pause, document the observation and consult the qualified supervisor','Make a medical diagnosis from the description'],
    correct:1,
    explanation:'Pause the service, preserve factual observations, and involve the qualified supervisor. A learner does not diagnose a condition.',
    caption:'A virtual facial station demonstrates a safe decision point.',
  },
  'prestige-elevation-nail-technology': {
    name:'Virtual nail station',
    action:'Nail-service readiness',
    question:'A reusable tool may have contacted a contaminated surface. What is the correct first decision?',
    choices:['Put it back in the clean tray','Wipe it on a towel and continue','Separate it from clean tools and follow the applicable cleaning/disinfection procedure'],
    correct:2,
    explanation:'A potentially contaminated tool must not be returned to clean service. Follow site procedures and product instructions.',
    caption:'A virtual nail station illustrates the clean and used tool areas.',
  },
} as const;
type Slug = keyof typeof LABS;

/** Self-check only. No practical hours, assessment grade or skills signoff. */
export default function BeautyWorkbookSimulator({slug}:{slug:string}) {
  const lab=LABS[slug as Slug];
  const [selected,setSelected]=useState<number|null>(null);
  const [checked,setChecked]=useState(false);
  if(!lab)return null;
  const correct=checked&&selected===lab.correct;
  return <section className="my-6 rounded-2xl border border-slate-300 bg-white p-5" aria-label={lab.name}>
    <p className="text-xs font-extrabold uppercase tracking-wide text-violet-900">Virtual practice · No workplace hours</p>
    <h3 className="mt-2 text-2xl font-bold">{lab.name}</h3>
    <p className="mt-2">{lab.caption} Use the choices below to rehearse the decision before supervised practice.</p>
    <LearningPreview><svg viewBox="0 0 440 240" role="img" aria-label={lab.caption} className="my-4 w-full max-w-lg rounded-xl bg-stone-50">
      <rect x="10" y="10" width="420" height="220" rx="12" fill="#fafaf9" stroke="#57534e"/>
      <rect x="42" y="130" width="356" height="42" rx="8" fill="#d6d3d1" stroke="#57534e"/>
      <circle cx="220" cy="88" r="48" fill="#d7aa8b" stroke="#7c624d" strokeWidth="2"/>
      <path d="M172 82 Q168 28 220 34 Q270 26 268 82" fill={slug.includes('nail')?'#f2c1b0':'#44332c'} stroke="#57534e"/>
      <rect x="68" y="98" width="38" height="32" rx="5" fill="#c4b5fd" stroke="#57534e"/>
      <rect x="334" y="98" width="38" height="32" rx="5" fill="#c4b5fd" stroke="#57534e"/>
      <text x="45" y="202" fontSize="15" fill="#334155">Preparation</text>
      <text x="270" y="202" fontSize="15" fill={correct?'#065f46':'#334155'}>{correct?'Correct safe decision':'Choose your next action'}</text>
    </svg></LearningPreview>
    <h4 className="font-bold">{lab.action}</h4>
    <p className="mt-2">{lab.question}</p>
    <WorkbookNarration text={`${lab.name}. ${lab.question} ${lab.choices.join('. ')}`} />
    <fieldset className="mt-3 space-y-2"><legend className="sr-only">{lab.question}</legend>{lab.choices.map((choice,index)=><label key={choice} className="flex min-h-12 items-center gap-3 rounded-lg border p-3"><input type="radio" checked={selected===index} name={`virtual-${slug}`} onChange={()=>{setSelected(index);setChecked(false);}}/>{choice}</label>)}</fieldset>
    <button type="button" disabled={selected===null} onClick={()=>setChecked(true)} className="mt-4 min-h-12 rounded-lg bg-slate-900 px-5 py-3 font-semibold text-white disabled:opacity-50">Check my decision</button>
    {checked&&<p role="status" aria-live="polite" className={`mt-4 rounded-lg p-4 font-semibold ${correct?'bg-emerald-50 text-emerald-900':'bg-amber-50 text-amber-950'}`}>{correct?'Correct. ':'Not yet—choose again. '}{lab.explanation}</p>}
    <p className="mt-4 text-sm text-slate-700">Save what you learned in your workbook. This virtual practice cannot approve attendance, replace supervision, or certify practical competency.</p>
  </section>;
}
