import { beforeEach, describe, expect, it, vi } from 'vitest';
const mocks=vi.hoisted(()=>({user:{id:'candidate'},profile:{role:'student',tenant_id:'tenant-a',is_active:true,suspended:false},session:{id:'exam',student_id:'candidate',proctor_id:'proctor',tenant_id:'tenant-a'},signed:vi.fn()}));
vi.mock('@/lib/supabase/server',()=>({createClient:async()=>({auth:{getUser:async()=>({data:{user:mocks.user}})}})}));
vi.mock('@/lib/supabase/admin',()=>({requireAdminClient:async()=>({from:(table:string)=>({select:()=>({eq:()=>({maybeSingle:async()=>({data:table==='profiles'?mocks.profile:mocks.session})})})}),storage:{from:()=>({createSignedUrl:mocks.signed})}})}));
import { requireExamSessionAccess } from '@/lib/testing/session-access';
import { getExamEvidence } from '@/lib/testing/evidence-handler';
describe('private exam evidence authorization',()=>{
 beforeEach(()=>{mocks.user={id:'candidate'};mocks.profile={role:'student',tenant_id:'tenant-a',is_active:true,suspended:false};mocks.session={id:'exam',student_id:'candidate',proctor_id:'proctor',tenant_id:'tenant-a'};mocks.signed.mockReset();});
 it('allows the exact candidate, rejects another learner even in the same tenant',async()=>{
  expect((await requireExamSessionAccess('exam'))).toHaveProperty('session');
  mocks.user={id:'different'};
  expect((await requireExamSessionAccess('exam'))).toHaveProperty('status',403);
 });
 it('does not allow staff from another tenant or a suspended account',async()=>{
  mocks.user={id:'staff'};mocks.profile={role:'staff',tenant_id:'tenant-b',is_active:true,suspended:false};
  expect((await requireExamSessionAccess('exam'))).toHaveProperty('status',403);
  mocks.profile={role:'admin',tenant_id:'tenant-b',is_active:true,suspended:true};
  expect((await requireExamSessionAccess('exam'))).toHaveProperty('status',404);
 });
 it('rejects unrelated bucket paths before requesting a signed URL',async()=>{
  const id='11111111-1111-4111-8111-111111111111';
  Object.assign(mocks.session,{id,evidence_storage_key:'exam-evidence/other-exam/recording.webm'});
  expect(await getExamEvidence(new Request(`https://lms.elevateforhumanity.org/api/exams/evidence?sessionId=${id}`))).toHaveProperty('status',404);
  expect(mocks.signed).not.toHaveBeenCalled();
 });
});
