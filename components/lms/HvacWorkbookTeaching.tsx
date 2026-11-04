'use client';
import { useState } from 'react';
import content from '@/lib/lms/hvac-workbook-content.json';
import WorkbookNarration from './WorkbookNarration';

function ElectricalBench() {
  const [closed,setClosed]=useState(false);
  const [resistance,setResistance]=useState(12);
  const amps=closed?24/resistance:0;
  return <section className="my-5 rounded-xl border bg-white p-4" aria-label="Virtual low-voltage circuit">
    <h4 className="text-xl font-bold">Operate a virtual 24 V circuit</h4>
    <svg viewBox="0 0 620 240" role="img" aria-label={`Ideal circuit: switch ${closed?'closed':'open'}, current ${amps.toFixed(2)} amperes`} className="my-4 w-full bg-stone-50">
      <path d="M90 170V60H250 M310 60H510V170H90" stroke="#44403c" strokeWidth="5" fill="none"/>
      <circle cx="90" cy="115" r="32" fill="white" stroke="#44403c" strokeWidth="3"/>
      <text x="64" y="121" fontSize="18">24 V</text>
      <path d={closed?'M250 60H310':'M250 60L300 24'} stroke="#b45309" strokeWidth="6"/>
      <rect x="460" y="95" width="100" height="50" fill="#fef3c7" stroke="#44403c"/>
      <text x="478" y="125" fontSize="18">{resistance} Ω</text>
      <text x="225" y="215" fontSize="18">I = {amps.toFixed(2)} A · ideal resistive model</text>
    </svg>
    <button type="button" onClick={()=>setClosed(!closed)} aria-pressed={closed} className="min-h-12 rounded-lg bg-stone-900 px-4 py-3 text-white">{closed?'Open switch':'Close switch'}</button>
    <label className="my-4 block">Load resistance: {resistance} ohms<input type="range" min="6" max="48" step="6" value={resistance} onChange={e=>setResistance(Number(e.target.value))} className="block w-full"/></label>
    <p role="status">{closed?`Complete path: 24 V ÷ ${resistance} ohms = ${amps.toFixed(2)} A. Increasing resistance reduces current at this fixed voltage.`:'The open series switch interrupts the path. Current is zero in this model.'}</p>
    <p className="mt-3 text-sm">Predict the result before changing the switch or resistance. Record your explanation in Practice 1. This model is not an instruction to test live equipment.</p>
  </section>;
}

function RecoveryBench() {
  const [modern,setModern]=useState(true); const [works,setWorks]=useState(true);
  const target=modern&&works?90:80;
  return <section className="my-5 rounded-xl border p-4" aria-label="Type I recovery decision simulator">
    <h4 className="text-xl font-bold">Choose the Type I percentage branch</h4>
    <label className="my-4 flex gap-3"><input type="checkbox" checked={modern} onChange={e=>setModern(e.target.checked)} className="h-6 w-6"/>Recovery equipment manufactured on or after November 15, 1993</label>
    <label className="my-4 flex gap-3"><input type="checkbox" checked={works} onChange={e=>setWorks(e.target.checked)} className="h-6 w-6"/>Appliance compressor functions</label>
    <output className="block rounded-lg bg-amber-50 p-4">Percentage-method target: <strong>{target}%</strong>. For a ten-ounce example, that is {10*target/100} ounces.</output>
    <p className="mt-3">First verify that the appliance meets the complete small-appliance definition. The four-inches-Hg-vacuum alternative is a different measurement method. This selector is a knowledge exercise; it does not operate recovery equipment.</p>
  </section>;
}

function AirflowBench() {
  const [restricted,setRestricted]=useState(false);
  return <section className="my-5 rounded-xl border p-4" aria-label="Airflow reasoning simulator">
    <h4 className="text-xl font-bold">Investigate an airside restriction</h4>
    <svg viewBox="0 0 680 180" role="img" aria-label={`Return filter ${restricted?'restricted':'clear'}; inspect the complete return, blower, coil, and supply path`} className="my-4 w-full bg-stone-50">
      <path d="M30 90H650" stroke="#0369a1" strokeWidth={restricted?4:14}/>
      {['Return / filter','Blower','Coil','Supply'].map((label,i)=><g key={label}><rect x={15+i*170} y="50" width="145" height="80" rx="10" fill={i===0&&restricted?'#fecaca':'#e0f2fe'} stroke="#44403c"/><text x={28+i*170} y="95" fontSize="17">{label}</text></g>)}
      <text x="250" y="160" fontSize="18">Airflow direction →</text>
    </svg>
    <button type="button" aria-pressed={restricted} onClick={()=>setRestricted(!restricted)} className="min-h-12 rounded-lg bg-stone-900 px-4 py-3 text-white">{restricted?'Clear the virtual restriction':'Add a virtual filter restriction'}</button>
    <p role="status" className="mt-4">{restricted?'Observed change: a return-filter restriction is present. Investigate airflow using the approved equipment procedure. This alone does not prove a refrigerant shortage.':'Model condition: the illustrated filter path is clear. This does not establish that the complete real installation or charge is correct.'}</p>
    <p className="mt-3 text-sm">This is a qualitative reasoning model, not an airflow calculator. Write a discriminating test and an unsupported conclusion to avoid.</p>
  </section>;
}

export default function HvacWorkbookTeaching({number}:{number:number}) {
  const [active, setActive] = useState(0);
  const chapter=content.chapters.find(chapter=>chapter.number===number);
  if(!chapter)return null;
  const pages = [...chapter.lessons, { heading: chapter.heading, text: chapter.text }, { heading: 'Worked example', text: chapter.example }];
  const page = pages[Math.min(active, pages.length - 1)];
  return <section className="my-6 space-y-5 rounded-2xl border border-stone-300 bg-stone-50 p-4 sm:p-6" aria-label={`Chapter ${number} illustrated instruction`}>
    <h3 className="text-2xl font-bold">Learn and work through the example</h3>
    <figure><img src={`/images/workbooks/hvac/chapter-${number}.svg`} alt={chapter.diagram.join(' → ')} className="w-full rounded-xl bg-white"/><figcaption className="mt-2 text-sm">Learning map: {chapter.heading}. Diagram labels describe concepts; they are not equipment connection instructions.</figcaption></figure>
    {chapter.image&&<figure><img src={chapter.image} alt={chapter.imageAlt||chapter.title} loading="lazy" className="max-h-72 w-full rounded-xl bg-white object-contain"/><figcaption className="mt-2 text-sm">Workplace context for the matching lesson. This picture does not demonstrate every service step or verify student performance.</figcaption></figure>}
    <article className="rounded-xl border bg-white p-4">
      <p className="mb-3 font-semibold">Instruction {active + 1} of {pages.length}</p>
      <h4 className="text-xl font-bold">{page.heading}</h4>
      <p className="mt-3 max-w-prose leading-loose">{page.text}</p>
      <WorkbookNarration text={`${page.heading}. ${page.text} Pause and explain the idea in your own words.`} />
      <nav aria-label="Workbook instruction pages" className="mt-4 flex flex-wrap gap-3">
        <button type="button" disabled={active === 0} onClick={() => setActive(value => value - 1)} className="min-h-12 rounded-lg border px-4 py-3 disabled:opacity-40">Previous explanation</button>
        <button type="button" disabled={active === pages.length - 1} onClick={() => setActive(value => value + 1)} className="min-h-12 rounded-lg bg-stone-900 px-4 py-3 text-white disabled:opacity-40">Next explanation</button>
      </nav>
    </article>
    {number===3&&<ElectricalBench/>}{number===8&&<RecoveryBench/>}{[2,13,14].includes(number)&&<AirflowBench/>}
    <p className="rounded-lg bg-white p-4 font-semibold">Self-check: {chapter.review}</p>
    <details className="rounded-lg border bg-white p-4"><summary className="cursor-pointer font-bold">Official reference sources</summary><ul className="mt-3 space-y-2">{content.sources.map(source=><li key={source.url}><a href={source.url} target="_blank" rel="noopener noreferrer" className="underline">{source.title}</a></li>)}</ul><p className="mt-3 text-sm">Content version {content.version}. Practice tests are original Elevate learning questions, not official or leaked exam items. Follow the current applicable rule and exact equipment instructions.</p></details>
  </section>;
}
