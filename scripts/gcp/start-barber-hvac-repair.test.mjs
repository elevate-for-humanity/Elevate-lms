import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const AsyncFunction=Object.getPrototypeOf(async function(){}).constructor;
const source=readFileSync(new URL('./start-barber-hvac-repair.mjs',import.meta.url),'utf8').replace(/^import .*;\n/gm,'').replaceAll('process.exit(0)','return');
async function run({fits=true,unrelated=false}={}){
 const digest='sha256:'+ 'b'.repeat(64),image='worker@'+digest;
 const task={containers:[{image,resources:{limits:{cpu:'4',memory:'8Gi'}}}]};
 const job={spec:{template:{spec:{template:{spec:task}}}}};
 const builds=[['078529f7-3cb3-4863-8afa-9d6bcaf167dd','2c723bfa-8c40-4acc-b961-98d917710ffc'],['d1d4ed9b-d45b-410e-8d89-53e751daa510','9ca9fb50-7119-46ea-ab81-9b0193c29c31'],['0f00cbcc-f79c-469d-84e8-303e2ad025cc','0ba9a61c-1f1b-4019-be6f-90e92eba2bc0']].map(([id,course_id])=>({id,course_id}));
 const jobs=builds.map((b,i)=>({id:'job-'+i,build_id:b.id,status:'running',lease_owner:'old-'+i,execution_generation:10,heartbeat_at:'2026-10-13T18:00:00Z',payload:{repairCompetencyIds:[],unresolvedCompetencyIds:['barber-b','other-blocker'],lessonRepairCounts:{'barber-b':3}}}));
 const before=structuredClone(jobs),writes=[],commands=[];
 const google=args=>{commands.push(args);if(args.includes('describe'))return JSON.stringify(args[0]==='artifacts'?{image_summary:{digest}}:job);if(args.includes('execute'))for(const j of jobs.filter(j=>j.id!=='job-1'))Object.assign(j,{lease_owner:'new-'+j.id,status:'running',heartbeat_at:'2026-10-13T19:00:00Z'});return '{}';};
 const fetch=async(url,init)=>{
  let rows;
  if(url.includes('ultimate_course_builds'))rows=builds;
  else if(init.method==='PATCH'){
   const id=new URL(url).searchParams.get('id').slice(3),patch=JSON.parse(init.body);writes.push({id,patch});Object.assign(jobs.find(j=>j.id===id),patch);rows=[jobs.find(j=>j.id===id)];
  }else if(url.includes('status=eq.queued'))rows=unrelated?[{id:'unrelated'}]:[];
  else if(url.includes('id=eq.job-1'))rows=[jobs[1]];
  else rows=jobs;
  return {ok:true,status:200,json:async()=>structuredClone(rows)};
 };
 const execute=new AsyncFunction('google','PROJECT','inspectRegionalCapacity','fetch','mkdtempSync','writeFileSync','rmSync','join','tmpdir','process','console','setTimeout',source);
 let error;
 try{await execute(google,'project',async()=>({fits}),fetch,()=>'/tmp/mock',()=>{},()=>{},(...p)=>p.join('/'),()=>'/tmp',{env:{REPAIRED_IMAGE_SHA:'a'.repeat(40),SUPABASE_SERVICE_ROLE_KEY:'test-only'}},{log:()=>{}},fn=>fn());}catch(e){error=e;}
 return {jobs,before,writes,commands,error};
}
test('only affected jobs restart and exhausted citation lesson reopens',async()=>{
 const r=await run();assert.equal(r.error,undefined);assert.deepEqual(r.jobs[1],r.before[1]);assert.deepEqual(r.writes.map(w=>w.id),['job-0','job-2']);
 assert.equal(r.jobs[0].payload.repairCompetencyId,'barber-b');assert.equal(r.jobs[0].payload.lessonRepairCounts['barber-b'],0);assert.deepEqual(r.jobs[0].payload.unresolvedCompetencyIds,['other-blocker']);
 assert.deepEqual(r.jobs[2].payload,r.before[2].payload);assert.equal(r.commands.some(c=>c.includes('cancel')),false);
});
test('insufficient capacity makes no queue changes',async()=>{const r=await run({fits:false});assert.match(r.error.message,/CAPACITY/);assert.equal(r.writes.length,0);});
test('unrelated work prevents an ambiguous restart',async()=>{const r=await run({unrelated:true});assert.match(r.error.message,/UNRELATED/);assert.equal(r.writes.length,0);});
