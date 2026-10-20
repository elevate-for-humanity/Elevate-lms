import {beforeEach,expect,it,vi} from 'vitest';
const state=vi.hoisted(()=>({sign:vi.fn()}));
vi.mock('@/lib/storage/lesson-playback',()=>({signedLessonPlayback:state.sign}));
import {courseLibraryPlayback} from '@/lib/storage/course-library-playback';
beforeEach(()=>vi.resetAllMocks());
it('renews saved B2 and managed media through the established playback signer',async()=>{
 state.sign.mockResolvedValue('https://media.example/renewed');const db={storage:{from:vi.fn()}};
 const result=await courseLibraryPlayback(db,{video_url:'https://media.example/saved.mp4',storage_path:'original'});
 expect(state.sign).toHaveBeenCalledWith(db,'https://media.example/saved.mp4');expect(result.playbackUrl).toBe('https://media.example/renewed');
 expect(db.storage.from).not.toHaveBeenCalled();
});
it('preserves the existing storage-path upload contract when no media URL is recorded',async()=>{
 const createSignedUrl=vi.fn().mockResolvedValue({data:{signedUrl:'https://upload.example/signed'},error:null});
 const result=await courseLibraryPlayback({storage:{from:()=>({createSignedUrl})}},{storage_path:'upload.mp4'});
 expect(createSignedUrl).toHaveBeenCalledWith('upload.mp4',3600);expect(result.playbackUrl).toBe('https://upload.example/signed');
});
it('shows a per-asset error without inventing playable media or hiding other library assets',async()=>{
 state.sign.mockRejectedValue(new Error('Storage access denied'));
 expect(await courseLibraryPlayback({}, {video_url:'https://media.example/saved.mp4'})).toMatchObject({playbackUrl:null,playbackError:expect.stringContaining('could not be renewed')});
});
