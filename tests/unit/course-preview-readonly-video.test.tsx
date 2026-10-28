import React from 'react';
import {beforeEach,afterEach,expect,it,vi} from 'vitest';
import {cleanup,fireEvent,render,screen} from '@testing-library/react';
const mocks=vi.hoisted(()=>({client:vi.fn()}));
vi.mock('@/lib/supabase/client',()=>({createClient:mocks.client}));
import InteractiveVideoPlayer from '@/components/lms/InteractiveVideoPlayer';
beforeEach(()=>{
 vi.clearAllMocks();vi.spyOn(HTMLMediaElement.prototype,'play').mockResolvedValue(undefined);
 vi.spyOn(HTMLMediaElement.prototype,'pause').mockImplementation(()=>{});
});
afterEach(()=>{cleanup();vi.restoreAllMocks();});
it('admin preview playback never loads or writes learner progress, notes, answers or completion',()=>{
 const onProgress=vi.fn(),onComplete=vi.fn();
 const {container}=render(<InteractiveVideoPlayer videoUrl="https://example.com/film.mp4" title="Draft lesson"
  courseId="course" lessonId="lesson" readOnly onProgress={onProgress} onComplete={onComplete}/>);
 const video=container.querySelector('video')!;
 Object.defineProperty(video,'duration',{configurable:true,value:100});
 Object.defineProperty(video,'currentTime',{configurable:true,writable:true,value:100});
 fireEvent.loadedMetadata(video);fireEvent.timeUpdate(video);fireEvent.ended(video);
 expect(mocks.client).not.toHaveBeenCalled();expect(onProgress).not.toHaveBeenCalled();expect(onComplete).not.toHaveBeenCalled();
 fireEvent.click(screen.getByRole('button',{name:/My Notes/}));
 expect(screen.getByPlaceholderText('Notes are disabled in preview')).toBeDisabled();
 expect(screen.getByRole('button',{name:'Add Note'})).toBeDisabled();
});
