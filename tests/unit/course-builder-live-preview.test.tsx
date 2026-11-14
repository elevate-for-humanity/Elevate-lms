import React, {useState} from 'react';
import {CourseWorkspaceContext} from '@/components/admin/course-builder/CourseWorkspaceContext';
import {render,screen,fireEvent,waitFor,cleanup} from '@testing-library/react';
import {afterEach,it,expect,vi} from 'vitest';
import {UltimateBuildPanel} from '@/components/admin/course-builder/UnifiedCourseBuilder';
import UltimateStageInspector from '@/components/admin/course-builder/UltimateStageInspector';
vi.mock('@/components/studio/UnifiedEllieChat',()=>({default:()=>null}));
vi.mock('@/components/studio/DeployPanel',()=>({default:()=>null}));
vi.mock('@/components/admin/course-builder/CredentialRegistryPanel',()=>({default:()=>null}));
function PreviewHarness(){
 const [target,setTarget]=useState<HTMLDivElement|null>(null);
 return <CourseWorkspaceContext.Provider value={{previewTarget:target}}>
  <UltimateStageInspector buildId="build"/><div aria-label="Right preview" ref={setTarget}/>
 </CourseWorkspaceContext.Provider>;
}
afterEach(()=>{cleanup();vi.unstubAllGlobals();vi.restoreAllMocks();});
it('Refresh explains a 503 and then loads recovered status without creating a new build',async()=>{
 let failed=true;
 const fetcher=vi.fn(async()=>failed?{ok:false,status:503,json:async()=>{throw Error('HTML response');}}:{ok:true,status:200,json:async()=>({builds:[],acquisitions:[]})});
 vi.stubGlobal('fetch',fetcher);
 render(<UltimateBuildPanel course={{id:'course',title:'Course'}} programSlug="program"/>);
 expect(await screen.findByRole('alert')).toHaveTextContent('HTTP 503');
 failed=false;fireEvent.click(screen.getByRole('button',{name:'Refresh',exact:true}));
 await waitFor(()=>expect(screen.queryByRole('alert')).toBeNull());
 expect(fetcher.mock.calls).toHaveLength(2);
});
it('saved lesson video appears without clicking a checkpoint or diagnostic button',async()=>{
 vi.spyOn(HTMLMediaElement.prototype,'play').mockResolvedValue(undefined);
 vi.stubGlobal('fetch',vi.fn(async()=>({ok:true,json:async()=>({build:{profile:{competencies:[{id:'one',title:'Welcome'}]},ultimate_lesson_builds:[{id:'saved',competency_id:'one',status:'running',preview:{videoUrl:'https://media.example/lesson.mp4',mediaApproved:false,segments:[{title:'Teach',text:'Lesson instruction'}]}}]}})})));
 const {container}=render(<PreviewHarness/>);
 await screen.findByText('Welcome');
 expect(container.querySelector('video')?.getAttribute('src')).toBe('https://media.example/lesson.mp4');
 expect(screen.getByText(/Draft preview/)).toBeInTheDocument();
 expect(screen.getByText('Lesson instruction')).toBeInTheDocument();
});
it('plays the exact approved published lesson instead of a newer unapproved draft',async()=>{
 vi.spyOn(HTMLMediaElement.prototype,'play').mockResolvedValue(undefined);
 vi.stubGlobal('fetch',vi.fn(async()=>({ok:true,json:async()=>({build:{profile:{competencies:[{id:'one',title:'Welcome'}]},ultimate_lesson_builds:[{id:'saved',competency_id:'one',status:'built_with_findings',preview:{videoUrl:'https://media.example/new-draft.mp4',approvedVideoUrl:'/api/admin/ultimate-course-builder/preview?kind=approved',approvedVersion:25}}]}})})));
 const {container}=render(<PreviewHarness/>);
 await screen.findByText('Owner-approved published lesson');
 expect(container.querySelector('video')?.getAttribute('src')).toBe('/api/admin/ultimate-course-builder/preview?kind=approved');
 expect(screen.getByText(/Approved render version 25/)).toBeInTheDocument();
 expect(screen.queryByText(/Media QA passed/)).toBeNull();
});

it('starts saved playback immediately and offers one-click playback when the browser blocks autoplay',async()=>{
 const play=vi.spyOn(HTMLMediaElement.prototype,'play').mockRejectedValue(new Error('Autoplay blocked'));
 vi.stubGlobal('fetch',vi.fn(async()=>({ok:true,json:async()=>({build:{profile:{competencies:[{id:'one',title:'Welcome'}]},ultimate_lesson_builds:[{id:'saved',competency_id:'one',status:'built_with_findings',preview:{videoUrl:'https://media.example/lesson.mp4'}}]}})})));
 const {container}=render(<PreviewHarness/>);
 const button=await screen.findByRole('button',{name:'Play lesson',exact:true});
 expect(play).toHaveBeenCalled();
 const initialAttempts=play.mock.calls.length;
 play.mockResolvedValue(undefined);
 fireEvent.click(button);
 await waitFor(()=>expect(play.mock.calls.length).toBeGreaterThan(initialAttempts));
 fireEvent.playing(container.querySelector('video')!);
 await waitFor(()=>expect(screen.queryByRole('button',{name:'Play lesson',exact:true})).toBeNull());
});

it('identifies outlined lessons with no saved video as not built',async()=>{
 vi.stubGlobal('fetch',vi.fn(async()=>({ok:true,json:async()=>({build:{profile:{competencies:[{id:'two',title:'Second lesson'}]},ultimate_lesson_builds:[]}})})));
 render(<PreviewHarness/>);
 expect(await screen.findByRole('option',{name:'1. Second lesson — Not built — no video yet'})).toBeInTheDocument();
 expect(screen.getByText('This lesson has not been built. No saved video is available yet.')).toBeInTheDocument();
});

it('follows the active lesson rather than staying on the first saved lesson',async()=>{
 vi.stubGlobal('fetch',vi.fn(async()=>({ok:true,json:async()=>({build:{profile:{competencies:[{id:'one',title:'Earlier lesson'},{id:'two',title:'Current lesson'}]},ultimate_lesson_builds:[{id:'saved-one',competency_id:'one',status:'built',preview:{}},{id:'saved-two',competency_id:'two',status:'running',preview:{segments:[{title:'Current instruction',text:'Teaching the second lesson'}]}}]}})})));
 render(<PreviewHarness/>);
 expect(await screen.findByText('Teaching the second lesson')).toBeInTheDocument();
 expect(screen.getByRole('combobox',{name:'Selected lesson'})).toHaveValue('two');
 expect(screen.getByRole('checkbox',{name:'Follow the lesson being built'})).toBeChecked();
});
