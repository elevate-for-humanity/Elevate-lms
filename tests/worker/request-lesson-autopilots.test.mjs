import test from 'node:test';
import assert from 'node:assert/strict';
import {requestLessonAutopilots} from '../../lib/ultimate-course-builder/worker/request-lesson-autopilots.mjs';
function fixture({status='failed',payload={},paused=false}={}) {
 const events=[];
 const db={from(table){const q={select(){return q},eq(){return q},order(){return q},limit(){return q},async single(){return {data:{id:'build',status:'blocked',profile:{ownerPaused:paused}}}},async maybeSingle(){return {data:{id:'job',status,payload}}}};return q},async rpc(){events.push('pool');return {data:{state:'awaiting_coordinator'}}}};
 return {events,run:()=>requestLessonAutopilots(db,{buildId:'build',actorId:'actor',enqueue:async(id,p)=>{events.push(['enqueue',id,p]);}})};
}
test('failed continuation is durably queued before requesting the team pool',async()=>{
 const f=fixture();await f.run();assert.deepEqual(f.events,[['enqueue','build',{requestedBy:'actor',parallelAutopilotStart:true}],'pool']);
});
test('active continuation is handed off without a duplicate queue job',async()=>{
 for(const status of ['queued','running']){const f=fixture({status});await f.run();assert.deepEqual(f.events,['pool']);}
});
test('paused courses and targeted previews cannot accidentally become full-course runs',async()=>{
 const p=fixture({paused:true});await assert.rejects(p.run(),/OWNER_PAUSED/);assert.deepEqual(p.events,[]);
 for(const key of ['ownerPreview','acceptance','competencyId','lessonBuildId']){const f=fixture({payload:{[key]:true}});await assert.rejects(f.run(),/FULL_COURSE_REQUIRED/);assert.deepEqual(f.events,[]);}
});
