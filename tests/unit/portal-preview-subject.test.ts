import {beforeEach,describe,expect,it,vi} from 'vitest';
const state=vi.hoisted(()=>({cookies:new Map<string,string>(),signed:null as any}));
vi.mock('next/headers',()=>({cookies:async()=>({get:(name:string)=>state.cookies.has(name)?{value:state.cookies.get(name)}:undefined})}));
vi.mock('@/lib/admin/portal-preview-handoff',()=>({verifyPortalPreviewHandoff:()=>state.signed}));
import {resolvePortalPreviewSubject} from '@/lib/admin/portal-preview';
const rows:any={admin:{id:'admin',role:'admin'},learner:{id:'learner',role:'apprentice'},other:{id:'other',role:'student'}};
const db:any={from:()=>({select:()=>({eq:(_:string,id:string)=>({maybeSingle:async()=>({data:rows[id]??null})})})})};
beforeEach(()=>{state.cookies.clear();state.signed=null;});
describe('portal preview identity boundary',()=>{
 it('rejects unsigned actor and target cookies without an authenticated administrator',async()=>{state.cookies.set('elevate_portal_preview_actor','admin');state.cookies.set('elevate_portal_preview_user','learner');expect(await resolvePortalPreviewSubject(db,null)).toEqual({userId:'',previewing:false});});
 it('cannot switch a learner using unsigned actor cookies',async()=>{state.cookies.set('elevate_portal_preview_actor','admin');state.cookies.set('elevate_portal_preview_user','other');expect(await resolvePortalPreviewSubject(db,'learner')).toEqual({userId:'learner',previewing:false});});
 it('accepts a verified signed cross-service handoff',async()=>{state.signed={actorId:'admin',targetId:'learner'};expect(await resolvePortalPreviewSubject(db,null)).toEqual({userId:'learner',previewing:true});});
 it('preserves independently authenticated administrator selection',async()=>{state.cookies.set('elevate_portal_preview_user','learner');expect(await resolvePortalPreviewSubject(db,'admin')).toEqual({userId:'learner',previewing:true});});
 it('rejects a signed handoff whose actor no longer has administrator rights',async()=>{state.signed={actorId:'other',targetId:'learner'};expect(await resolvePortalPreviewSubject(db,null)).toEqual({userId:'',previewing:false});});
});
