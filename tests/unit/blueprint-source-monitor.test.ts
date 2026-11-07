import {expect,it,vi,afterEach} from 'vitest';
import {createHash} from 'node:crypto';
const h=vi.hoisted(()=>({source:{source_reference:'https://www.epa.gov/section608/official-document',blueprint_status:'approved'},previous:null as null|{id:string;last_version:string},saved:true,writes:[] as unknown[]}));
vi.mock('server-only',()=>({}));
vi.mock('@/lib/supabase/admin',()=>({requireAdminClient:async()=>({from:(table:string)=>{
 let writing=false;const q={select:()=>q,eq:()=>q,update:(row:unknown)=>{writing=true;h.writes.push(row);return q;},insert:(row:unknown)=>{writing=true;h.writes.push(row);return q;},maybeSingle:async()=>({data:table==='credential_blueprints'?h.source:writing?(h.saved?{id:'monitor'}:null):h.previous,error:null})};return q;
}})}));
import {observeBlueprintSource} from '@/lib/course-builder/credential-engine/source-monitor';
const credential={slug:'epa608',name:'EPA',provider:'EPA'} as Parameters<typeof observeBlueprintSource>[0];
const hash=(body:string)=>'sha256:'+createHash('sha256').update(body).digest('hex');
afterEach(()=>{h.source.blueprint_status='approved';h.source.source_reference='https://www.epa.gov/section608/official-document';h.previous=null;h.saved=true;vi.unstubAllGlobals();});
it('records a first observation as a baseline without certifying curriculum currency',async()=>{
 vi.stubGlobal('fetch',vi.fn().mockResolvedValue(new Response('official bytes')));
 expect(await observeBlueprintSource(credential)).toMatchObject({status:'baseline_recorded',initialObservation:true,verificationScope:'official-source-bytes',lastVersion:hash('official bytes')});
});
it('distinguishes unchanged source bytes and changed source bytes using persisted hashes',async()=>{
 h.previous={id:'monitor',last_version:hash('official bytes')};
 vi.stubGlobal('fetch',vi.fn().mockResolvedValueOnce(new Response('official bytes')).mockResolvedValueOnce(new Response('changed bytes')));
 expect(await observeBlueprintSource(credential)).toMatchObject({status:'source_unchanged'});
 expect(await observeBlueprintSource(credential)).toMatchObject({status:'source_changed',changes:[{severity:'high',source:h.source.source_reference}]});
});
it('requires an approved official source rather than fetching an internal seed or arbitrary URL',async()=>{
 const fetcher=vi.fn();vi.stubGlobal('fetch',fetcher);
 h.source.blueprint_status='draft';await expect(observeBlueprintSource(credential)).rejects.toThrow('BLUEPRINT_APPROVED_SOURCE_REQUIRED');
 h.source.blueprint_status='approved';h.source.source_reference='https://untrusted.example/document';await expect(observeBlueprintSource(credential)).rejects.toThrow('BLUEPRINT_OFFICIAL_SOURCE_REQUIRED');
 expect(fetcher).not.toHaveBeenCalled();
});
it('does not report successful monitoring when its durable observation was not saved',async()=>{
 h.saved=false;vi.stubGlobal('fetch',vi.fn().mockResolvedValue(new Response('official bytes')));
 await expect(observeBlueprintSource(credential)).rejects.toThrow('BLUEPRINT_OBSERVATION_RECEIPT_MISSING');
});
