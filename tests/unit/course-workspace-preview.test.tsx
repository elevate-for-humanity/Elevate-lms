import React,{useState} from 'react';
import {afterEach,beforeEach,expect,it,vi} from 'vitest';
import {cleanup,fireEvent,render,screen,waitFor,within} from '@testing-library/react';
import UltimateStageInspector from '@/components/admin/course-builder/UltimateStageInspector';
import {CourseWorkspaceContext} from '@/components/admin/course-builder/CourseWorkspaceContext';
vi.mock('@/components/admin/course-builder/ProgressiveLessonVideo',()=>({default:()=>null}));
vi.mock('@/components/admin/course-builder/LessonVideoReview',()=>({default:()=>null}));
vi.mock('@/components/admin/course-builder/AssessmentPreview',()=>({default:()=> <p>Assessment preview content</p>}));
const selection=vi.fn();
function Harness(){
 const [target,setTarget]=useState<HTMLDivElement|null>(null);
 return <CourseWorkspaceContext.Provider value={{previewTarget:target,onSelection:selection}}>
  <section aria-label="Work controls"><UltimateStageInspector buildId="build"/></section>
  <section aria-label="Right preview" ref={setTarget}/>
 </CourseWorkspaceContext.Provider>;
}
beforeEach(()=>{
 vi.spyOn(HTMLMediaElement.prototype,'play').mockResolvedValue(undefined);
 vi.spyOn(HTMLMediaElement.prototype,'pause').mockImplementation(()=>{});
 vi.stubGlobal('fetch',vi.fn(async()=>({ok:true,json:async()=>({build:{
  profile:{competencies:[{id:'one',title:'First lesson'},{id:'two',title:'Second lesson'}]},
  ultimate_lesson_builds:[1,2].map(n=>({id:'saved-'+n,competency_id:n===1?'one':'two',lesson_key:n===1?'one':'two',
   canonicalLessonId:'canonical-'+n,status:'built',hasCheckpoint:true,ultimate_lesson_steps:[],
   preview:{videoUrl:'https://example.com/'+n+'.mp4',mediaApproved:true,segments:[{title:'Teaching content',text:'Instruction '+n}],learnerPreviewUrl:'/api/admin/course-builder/preview?courseId=course&lessonId=canonical-'+n}}))
 }})})));
});
afterEach(()=>{cleanup();vi.restoreAllMocks();vi.unstubAllGlobals();selection.mockClear();});
it('renders media and instruction only in the right pane and keeps lesson selection on the left',async()=>{
 render(<Harness/>);const left=screen.getByRole('region',{name:'Work controls'}),right=screen.getByRole('region',{name:'Right preview'});
 await waitFor(()=>expect(right.querySelector('video')).not.toBeNull());
 expect(left.querySelector('video')).toBeNull();expect(within(left).getByLabelText('Selected lesson')).toBeVisible();
 fireEvent.change(within(left).getByLabelText('Selected lesson'),{target:{value:'two'}});
 await waitFor(()=>expect(right.querySelector('video')).toHaveAttribute('src','https://example.com/2.mp4'));
 expect(within(right).getByText('Instruction 2')).toBeVisible();expect(within(left).queryByText('Instruction 2')).toBeNull();
 expect(selection).toHaveBeenLastCalledWith(expect.objectContaining({canonicalLessonId:'canonical-2'}));
});
it('opens the real learner handoff in the same right preview pane',async()=>{
 render(<Harness/>);const right=screen.getByRole('region',{name:'Right preview'});
 await waitFor(()=>expect(right.querySelector('video')).not.toBeNull());
 fireEvent.click(within(right).getByRole('button',{name:'Learner view',exact:true}));
 expect(right.querySelector('iframe')).toHaveAttribute('src','/api/admin/course-builder/preview?courseId=course&lessonId=canonical-1');
 expect(screen.getByRole('region',{name:'Work controls'}).querySelector('iframe')).toBeNull();
});
