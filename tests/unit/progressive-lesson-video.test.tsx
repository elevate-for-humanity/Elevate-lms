import React from 'react';
import {cleanup,fireEvent,render,screen,waitFor} from '@testing-library/react';
import {afterEach,expect,it,vi} from 'vitest';
import ProgressiveLessonVideo from '@/components/admin/course-builder/ProgressiveLessonVideo';
afterEach(()=>{cleanup();vi.restoreAllMocks();vi.unstubAllGlobals();});
it('loads actual segment URLs and advances while retaining the in-progress label',async()=>{
 const play=vi.spyOn(HTMLMediaElement.prototype,'play').mockResolvedValue();
 vi.stubGlobal('fetch',vi.fn().mockResolvedValue({ok:true,json:async()=>({segments:[{id:'render:0',src:'https://example.test/first.mp4',startSeconds:0,durationSeconds:30},{id:'render:900',src:'https://example.test/second.mp4',startSeconds:30,durationSeconds:30}]})}));
 render(<ProgressiveLessonVideo buildId="build" lessonId="lesson" title="Current lesson" />);
 await waitFor(()=>expect(screen.getByLabelText('Current lesson in-progress video')).toHaveAttribute('src','https://example.test/first.mp4'));
 const video=screen.getByLabelText('Current lesson in-progress video');fireEvent.play(video);fireEvent.ended(video);
 await waitFor(()=>expect(video).toHaveAttribute('src','https://example.test/second.mp4'));
 expect(play).toHaveBeenCalled();fireEvent.ended(video);
 expect(screen.getByRole('status')).toHaveTextContent('Waiting for the next completed portion');
 expect(screen.getByText(/has not passed final quality review/)).toBeInTheDocument();
});
it('does not invent a playable video when no portion has been stored',async()=>{
 vi.stubGlobal('fetch',vi.fn().mockResolvedValue({ok:true,json:async()=>({segments:[]})}));
 render(<ProgressiveLessonVideo buildId="build" lessonId="lesson" />);
 await waitFor(()=>expect(fetch).toHaveBeenCalled());
 expect(screen.queryByLabelText('Lesson in-progress video')).toBeNull();
 expect(screen.getByRole('status')).toHaveTextContent('Waiting for the first completed video portion');
});
