import {cleanup,render,screen,waitFor} from '@testing-library/react';
import {afterEach,expect,it,vi} from 'vitest';
vi.mock('@/apps/admin/app/videos/upload/VideoUploadClient',()=>({default:()=>null}));
import LicensedMediaLibrary from '@/components/admin/course-builder/LicensedMediaLibrary';
afterEach(()=>{cleanup();vi.unstubAllGlobals();});
it('browses a saved generated film through the same authenticated version-bound preview without queueing a render',async()=>{
 const fetcher=vi.fn().mockResolvedValueOnce({ok:true,json:async()=>({videos:[]})})
  .mockResolvedValueOnce({ok:true,json:async()=>({builds:[{id:'saved-build'}]})})
  .mockResolvedValueOnce({ok:true,json:async()=>({build:{profile:{competencies:[{id:'c',title:'Saved lesson'}]},ultimate_lesson_builds:[{id:'lesson',competency_id:'c',status:'built',preview:{videoUrl:'/api/admin/ultimate-course-builder/preview?artifactVersionId=exact',review:{version:4}}}]}}) });
 vi.stubGlobal('fetch',fetcher);const {container}=render(<LicensedMediaLibrary courseId="course" />);
 expect(await screen.findByText('Saved lesson')).toBeInTheDocument();
 expect(container.querySelector('video')?.getAttribute('src')).toContain('artifactVersionId=exact');
 expect(fetcher.mock.calls.every(([,options])=>!options?.method || options.method==='GET')).toBe(true);
});
