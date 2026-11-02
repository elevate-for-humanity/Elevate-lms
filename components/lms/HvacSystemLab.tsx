'use client';
import { useState } from 'react';
import WorkbookNarration from '@/components/lms/WorkbookNarration';
import { refrigerationStages, superheat, subcooling } from '@/lib/lms/hvac-system-model';

/** SVG uses explicit labels and states; color is never the only teaching cue. */
export default function HvacSystemLab() {
  const [stage, setStage] = useState(0);
  const [running, setRunning] = useState(false);
  const [answer, setAnswer] = useState<number | null>(null);
  const [suction, setSuction] = useState(50);
  const [evaporating, setEvaporating] = useState(40);
  const [condensing, setCondensing] = useState(105);
  const [liquid, setLiquid] = useState(95);
  const item = refrigerationStages[stage];
  const positions = [[75,70],[425,70],[425,270],[75,270]];
  return <section className="my-6 rounded-2xl border border-stone-300 bg-white p-4 sm:p-6" aria-label="Interactive refrigeration cycle laboratory">
    <p className="text-sm font-bold uppercase tracking-wide text-amber-800">HVAC visual practice · refrigeration cycle</p>
    <h3 className="mt-2 text-2xl font-bold">Follow the refrigerant around the system</h3>
    <p className="my-3 leading-relaxed">Select each numbered component. Trace the arrows and explain where pressure changes and heat moves. This is an idealized steady-state cooling model; actual equipment and refrigerants vary.</p>
    <svg viewBox="0 0 700 440" role="img" aria-labelledby="hvac-cycle-title hvac-cycle-description" className="w-full rounded-xl bg-stone-50">
      <title id="hvac-cycle-title">Four-stage vapor-compression refrigeration cycle</title>
      <desc id="hvac-cycle-description">Compressor to condenser to metering device to evaporator and back to compressor. High-pressure flow is at the top and right; low-pressure flow is at the bottom and left. Heat leaves the condenser and enters the evaporator.</desc>
      <defs><marker id="hvac-flow-arrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0 0 L8 4 L0 8Z" fill="currentColor" /></marker></defs>
      <path d="M250 110H420 M510 150V265" stroke="#b45309" strokeWidth="8" fill="none" markerEnd="url(#hvac-flow-arrow)" />
      <path d="M425 310H255 M165 270V155" stroke="#0369a1" strokeWidth="8" fill="none" markerEnd="url(#hvac-flow-arrow)" />
      <text x="285" y="85" fontSize="15">High pressure →</text><text x="275" y="350" fontSize="15">← Low pressure</text>
      <text x="435" y="40" fontSize="16">Heat OUT ↑</text><text x="75" y="415" fontSize="16">Heat IN ↑</text>
      {running && <circle r="7" fill="#15803d"><animateMotion dur="8s" repeatCount="indefinite" path="M165 110H510V310H165Z" /></circle>}
      {refrigerationStages.map((entry,index)=><g key={entry.name}><rect x={positions[index][0]} y={positions[index][1]} width="180" height="80" rx="12" fill={index===stage?'#fef3c7':'white'} stroke="#292524" strokeWidth={index===stage?3:1}/><text x={positions[index][0]+12} y={positions[index][1]+45} fontSize="17" fontWeight="bold">{index+1}. {entry.name}</text></g>)}
    </svg>
    <div className="my-4 flex flex-wrap gap-2">{refrigerationStages.map((entry,index)=><button type="button" key={entry.name} aria-pressed={index===stage} onClick={()=>{setStage(index);setAnswer(null);}} className="min-h-12 rounded-lg border border-stone-500 px-4 py-3">{index+1}. {entry.name}</button>)}<button type="button" onClick={()=>setRunning(!running)} className="min-h-12 rounded-lg bg-stone-900 px-4 py-3 text-white">{running?'Pause flow':'Animate flow'}</button></div>
    <h4 className="text-xl font-bold">{item.name}: {item.state}</h4><p className="mt-2 leading-relaxed">{item.action}</p>
    <WorkbookNarration text={`I'm PARIS. Follow the refrigerant to the ${item.name}. ${item.action} The illustrated outlet condition is ${item.state}. Pause and explain the change in your own words. ${item.question}`} />
    <fieldset className="my-4"><legend className="font-bold">{item.question}</legend>{item.choices.map((choice,index)=><label className="mt-3 flex items-start gap-3 rounded-lg border p-3" key={choice}><input type="radio" name="cycle-question" checked={answer===index} onChange={()=>setAnswer(index)} className="mt-1 h-5 w-5"/>{choice}</label>)}</fieldset>
    {answer!==null&&<p role="status" className="rounded-lg bg-amber-50 p-4">{answer===item.answer?'Correct. ': 'Review this distinction and try again. '}{item.action}</p>}
    <h4 className="mt-6 text-xl font-bold">Virtual measurement bench</h4><p className="my-3">Use hypothetical Fahrenheit values. Saturation temperatures are supplied for this exercise. On real equipment, obtain the appropriate refrigerant pressure-temperature data; blends require the correct dew or bubble reference.</p>
    <div className="grid gap-4 sm:grid-cols-2">{[
      ['Suction-line temperature °F',suction,setSuction],['Evaporating saturation temperature °F',evaporating,setEvaporating],['Condensing saturation temperature °F',condensing,setCondensing],['Liquid-line temperature °F',liquid,setLiquid],
    ].map(([label,value,setter])=><label className="block font-semibold" key={String(label)}>{String(label)}<input type="number" min="-100" max="250" value={Number(value)} onChange={event=>{const value=event.currentTarget.valueAsNumber;if(Number.isFinite(value))(setter as (n:number)=>void)(value);}} className="mt-2 min-h-12 w-full rounded-lg border p-3"/></label>)}</div>
    <output className="my-4 block rounded-xl bg-stone-100 p-4">Superheat = {suction} − {evaporating} = <strong>{superheat(suction,evaporating)}°F</strong>. Subcooling = {condensing} − {liquid} = <strong>{subcooling(condensing,liquid)}°F</strong>.</output>
    {(superheat(suction,evaporating)<0||subcooling(condensing,liquid)<0)&&<p role="status">These readings do not match the assumed superheated-vapor/subcooled-liquid outlet model. Recheck the phase assumption, measurement location, units, and saturation reference.</p>}
    <p className="text-sm leading-relaxed">Record your explanation in the workbook. This practice does not award hours, establish exam readiness, or verify an observed hands-on skill. Do not use its hypothetical values as service targets.</p>
  </section>;
}
