'use client';
import {courseExecutionState} from '@/lib/ultimate-course-builder/core/execution-state.mjs';
type Job={id:string;status:string;available_at?:string|null;heartbeat_at?:string|null;lease_expires_at?:string|null;lease_owner?:string|null;
 payload?:{autopilot?:{version:string;competencyId:string;lessonTitle?:string;role:string}}};
const roles=[['instruction','Instruction'],['media','Media production'],['quality','Quality & publication']] as const;
function state(job:Job|undefined){
 if(!job)return 'Not assigned';
 if(job.status==='completed')return 'Finished';
 if(job.status==='failed')return 'Needs repair';
 if(job.status==='running')return courseExecutionState(job).active?'Working':'Checking worker';
 return job.available_at==='infinity'?'Waiting for prior job':'Ready / retry scheduled';
}
export default function ParallelLessonAutopilots({jobs,busy,onStart}:{jobs:Job[];busy:boolean;onStart:()=>void}){
 const grouped=new Map<string,Job[]>();
 for(const job of jobs){const task=job.payload?.autopilot;if(task?.version!=='three-role-v1')continue;
  grouped.set(task.competencyId,[...(grouped.get(task.competencyId)??[]),job]);}
 const rows=[...grouped.values()];
 const active=jobs.filter(job=>job.payload?.autopilot && courseExecutionState(job).active).length;
 return <section aria-label="Parallel lesson teams" className="mt-5 rounded-xl border border-emerald-700 bg-slate-950 p-4 text-white">
  <h3 className="font-bold">Three autopilots for each lesson</h3>
  <div className="mt-3 grid gap-3 sm:grid-cols-3">{roles.map(([key,title],index)=><div key={key} className="rounded-lg bg-slate-900 p-3">
   <span className="text-sm text-emerald-300">{index+1}</span><p className="font-bold">{title}</p>
  </div>)}</div>
  <p className="mt-3 text-sm text-slate-200">Teams work across different lessons. Media follows instruction; publication follows independent quality checks.</p>
  {rows.length?<>
   <p className="mt-3 font-semibold">{rows.length} lesson teams · {active} workers with a current heartbeat</p>
   <div className="mt-3 overflow-x-auto"><table className="w-full text-left text-sm"><thead><tr><th className="p-2">Lesson</th>{roles.map(([key,title])=><th key={key} className="p-2">{title}</th>)}</tr></thead>
    <tbody>{rows.map(team=><tr key={team[0].payload!.autopilot!.competencyId} className="border-t border-slate-700">
     <th className="p-2">{team[0].payload!.autopilot!.lessonTitle ?? 'Saved lesson'}</th>
     {roles.map(([role])=><td key={role} className="p-2">{state(team.find(job=>job.payload?.autopilot?.role===role))}</td>)}
    </tr>)}</tbody></table></div>
  </>:<button type="button" disabled={busy} onClick={onStart} className="mt-3 min-h-11 rounded-lg bg-emerald-400 px-4 py-2 font-bold text-slate-950 disabled:opacity-50">Start parallel lesson teams</button>}
 </section>;
}
