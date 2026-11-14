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
it('keeps the learner watermark in the fullscreen container and suppresses download and remote-play controls',async()=>{
 const {container}=render(<InteractiveVideoPlayer videoUrl="/api/courses/c/lessons/l/playback" title="Protected lesson" learnerId="learner-id" readOnly/>);
 const video=container.querySelector('video')!;
 expect(video.getAttribute('controlslist')).toContain('nodownload');
 expect(video.hasAttribute('disablepictureinpicture')).toBe(true);
 expect(video.hasAttribute('disableremoteplayback')).toBe(true);
 expect(screen.getByLabelText('Licensed learner')).toHaveTextContent('learner-id');
 const requestFullscreen=vi.fn().mockResolvedValue(undefined);
 video.parentElement!.requestFullscreen=requestFullscreen;
 fireEvent.click(screen.getByRole('button',{name:/fullscreen/i}));
 expect(requestFullscreen).toHaveBeenCalledTimes(1);
});

it('lets authenticated admin review seek past checkpoints without recording learner evidence',()=>{
 const {container}=render(<InteractiveVideoPlayer videoUrl="/film.mp4" title="Admin inspection"
  readOnly adminReview checkpoints={[{type:'key-concept',timestamp:10,concept:'Review this step'}]}/>);
 const video=container.querySelector('video')!;
 Object.defineProperty(video,'duration',{configurable:true,value:100});
 Object.defineProperty(video,'currentTime',{configurable:true,writable:true,value:0});
 fireEvent.loadedMetadata(video);
 fireEvent.change(screen.getAllByRole('slider')[0],{target:{value:'50'}});
 expect(video.currentTime).toBe(50);
 expect(mocks.client).not.toHaveBeenCalled();
});
it('keeps checkpoint seeking restrictions outside admin inspection',()=>{
 const {container}=render(<InteractiveVideoPlayer videoUrl="/film.mp4" title="Ordinary preview"
  readOnly checkpoints={[{type:'key-concept',timestamp:10,concept:'Review this step'}]}/>);
 const video=container.querySelector('video')!;
 Object.defineProperty(video,'duration',{configurable:true,value:100});
 Object.defineProperty(video,'currentTime',{configurable:true,writable:true,value:0});
 fireEvent.loadedMetadata(video);
 fireEvent.change(screen.getAllByRole('slider')[0],{target:{value:'50'}});
 expect(video.currentTime).toBe(10);
});
