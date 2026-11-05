import {describe,it,expect,vi} from 'vitest';
import {readFileSync} from 'node:fs';
import {publishCourse} from '../../lib/lms/atomic-publish-service';

describe('atomic course publication',()=>{
 it('returns only matching canonical course + version receipts',async()=>{
  const rpc=vi.fn().mockResolvedValue({data:{course:{id:'course-one'},version:{id:'version-one',version_number:2}},error:null});
  const result=await publishCourse({rpc} as never,'course-one','actor-one','Release');
  expect(result.version.id).toBe('version-one');
  expect(rpc).toHaveBeenCalledWith('publish_course_with_version',{
   p_course_id:'course-one',p_actor_user_id:'actor-one',p_label:'Release'});
  expect(rpc).toHaveBeenCalledTimes(1);
 });
 it('does not represent partial or failed publication as success',async()=>{
  for(const result of [{data:null,error:{message:'version rejected'}},
    {data:{course:{id:'course-one'},version:null},error:null},
    {data:{course:{id:'other'},version:{id:'version'}},error:null}]){
   const rpc=vi.fn().mockResolvedValue(result);
   await expect(publishCourse({rpc} as never,'course-one',null)).rejects.toThrow();
  }
 });
 it('database migration commits publication/version membership and audit atomically',()=>{
  const sql=readFileSync('supabase/migrations/20261105162000_atomic_persisted_course_publication.sql','utf8');
  expect(sql).toMatch(/PERFORM 1 FROM public\.courses WHERE id=p_course_id FOR UPDATE/);
  expect(sql).toMatch(/FROM public\.publish_course\(p_course_id\)/);
  expect(sql).toMatch(/INSERT INTO public\.course_versions/);
  expect(sql).toMatch(/INSERT INTO public\.course_version_lessons/);
  expect(sql).toMatch(/PUBLISH_CANONICAL_VERSION_INCOMPLETE/);
  expect(sql).toMatch(/PERFORM public\.log_audit_event/);
  expect(sql).toMatch(/PUBLISH_ACTOR_MISMATCH/);
  expect(sql).toMatch(/REVOKE ALL ON FUNCTION public\.publish_course_with_version/);
  expect(sql).not.toMatch(/UPDATE public\.student_|DELETE FROM public\.course_lessons/);
 });
});
