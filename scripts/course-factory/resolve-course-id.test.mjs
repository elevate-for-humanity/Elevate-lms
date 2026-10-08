import test from 'node:test';import assert from 'node:assert/strict';
import {resolveCourseId} from './resolve-course-id.mjs';
const env={SUPABASE_URL:'https://project.supabase.co',SUPABASE_SERVICE_ROLE_KEY:'private'};
const id='2c723bfa-8c40-4acc-b961-98d917710ffc';
test('resolves current canonical database identity instead of a retired fixed UUID',async()=>{
 const request=async url=>{assert.equal(url.searchParams.get('slug'),'eq.barber-apprenticeship');return {ok:true,json:async()=>[{id}]};};
 assert.equal(await resolveCourseId('barber-apprenticeship',{request,env}),id);
});
test('missing or ambiguous course records never select an arbitrary course',async()=>{
 for(const rows of [[],[{id},{id}], [{id:'not-a-course'}]]) await assert.rejects(resolveCourseId('barber-apprenticeship',{env,request:async()=>({ok:true,json:async()=>rows})}),/missing_or_ambiguous/);
});
test('invalid slug fails before making a database request',async()=>{
 await assert.rejects(resolveCourseId('barber&select=*',{env,request:()=>{throw Error('request should not run');}}),/slug_invalid/);
});
