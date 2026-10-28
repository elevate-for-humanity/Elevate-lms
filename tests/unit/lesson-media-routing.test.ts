// @vitest-environment node
import { beforeEach, expect, it, vi } from 'vitest';
const m=vi.hoisted(()=>({config:vi.fn(),sign:vi.fn(),hydrate:vi.fn()}));
vi.mock('@/lib/secrets',()=>({hydrateProcessEnv:m.hydrate}));
vi.mock('@/lib/storage/elevate-media-storage',()=>({getElevateMediaStorageConfig:m.config,getSignedElevateMediaUrl:m.sign}));
import {managedLessonPlaybackUrl,signedLessonPlayback} from '@/lib/storage/lesson-playback';
beforeEach(()=>{vi.clearAllMocks();m.config.mockReturnValue({provider:'backblaze-b2',endpoint:'https://s3.us-west-004.backblazeb2.com',bucket:'elevate-course-media',publicUrl:''});m.sign.mockResolvedValue('https://signed.example/fresh');});
it('routes a saved B2 URL through authorization even before runtime secrets hydrate',()=>{
 m.config.mockReturnValue({publicUrl:'',bucket:'',endpoint:undefined});
 expect(managedLessonPlaybackUrl('https://elevate-course-media.s3.us-east-005.backblazeb2.com/course-videos/film.mp4?expired=1','course','lesson')).toBe('/api/courses/course/lessons/lesson/playback');
});
it('hydrates the current connection and renews old region references only for the same owned bucket',async()=>{
 expect(await signedLessonPlayback({},'https://elevate-course-media.s3.us-east-005.backblazeb2.com/course-videos/film.mp4?expired=1')).toBe('https://signed.example/fresh');
 expect(m.hydrate).toHaveBeenCalledOnce();expect(m.sign).toHaveBeenCalledWith('course-videos/film.mp4',3600);
 await expect(signedLessonPlayback({},'https://other-bucket.s3.us-east-005.backblazeb2.com/private.mp4')).rejects.toThrow('LESSON_MEDIA_STORAGE_REFERENCE_REQUIRED');
});
it('rejects encoded traversal while renewing old region references',async()=>{
 await expect(signedLessonPlayback({},'https://elevate-course-media.s3.us-east-005.backblazeb2.com/%2e%2e/private.mp4')).rejects.toThrow('LESSON_MEDIA_REFERENCE_INVALID');expect(m.sign).not.toHaveBeenCalled();
});
