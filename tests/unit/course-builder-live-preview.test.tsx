import React from 'react';
import {render,screen,fireEvent,waitFor,cleanup} from '@testing-library/react';
import {afterEach,it,expect,vi} from 'vitest';
import {UltimateBuildPanel} from '@/components/admin/course-builder/UnifiedCourseBuilder';
import UltimateStageInspector from '@/components/admin/course-builder/UltimateStageInspector';
vi.mock('@/components/admin/course-builder/CredentialRegistryPanel',()=>({default:()=>null}));
afterEach(()=>{cleanup();vi.unstubAllGlobals();});
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
 vi.stubGlobal('fetch',vi.fn(async()=>({ok:true,json:async()=>({build:{profile:{competencies:[{id:'one',title:'Welcome'}]},ultimate_lesson_builds:[{id:'saved',competency_id:'one',status:'running',preview:{videoUrl:'https://media.example/lesson.mp4',mediaApproved:false,segments:[{title:'Teach',text:'Lesson instruction'}]}}]}})})));
 const {container}=render(<UltimateStageInspector buildId="build"/>);
 await screen.findByText('Welcome');
 expect(container.querySelector('video')?.getAttribute('src')).toBe('https://media.example/lesson.mp4');
 expect(screen.getByText(/Draft preview/)).toBeInTheDocument();
 expect(screen.getByText('Lesson instruction')).toBeInTheDocument();
});

it('follows the active lesson rather than staying on the first saved lesson',async()=>{
 vi.stubGlobal('fetch',vi.fn(async()=>({ok:true,json:async()=>({build:{profile:{competencies:[{id:'one',title:'Earlier lesson'},{id:'two',title:'Current lesson'}]},ultimate_lesson_builds:[{id:'saved-one',competency_id:'one',status:'built',preview:{}},{id:'saved-two',competency_id:'two',status:'running',preview:{segments:[{title:'Current instruction',text:'Teaching the second lesson'}]}}]}})})));
 render(<UltimateStageInspector buildId="build"/>);
 expect(await screen.findByText('Teaching the second lesson')).toBeInTheDocument();
 expect(screen.getByRole('combobox',{name:'Lesson previews'})).toHaveValue('two');
 expect(screen.getByRole('checkbox',{name:'Follow the lesson being built'})).toBeChecked();
});
