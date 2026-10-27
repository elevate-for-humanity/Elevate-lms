import 'server-only';
import { signedLessonPlayback } from './lesson-playback';
import { logger } from '@/lib/logger';
/** Renew only server-owned media references read from the authenticated library. */
export async function courseLibraryPlayback<T extends {storage_path?:string|null;video_url?:string|null}>(db: Parameters<typeof signedLessonPlayback>[0], video:T) {
  try {
    let playbackUrl:string;
    if(video.video_url) playbackUrl=await signedLessonPlayback(db,video.video_url);
    else {
      if(!video.storage_path)throw Error('COURSE_MEDIA_REFERENCE_REQUIRED');
      const signed=await db.storage.from('course_videos').createSignedUrl(video.storage_path,3600);
      if(signed.error||!signed.data?.signedUrl)throw signed.error ?? Error('COURSE_MEDIA_SIGNING_FAILED');
      playbackUrl=signed.data.signedUrl;
    }
    return {...video,playbackUrl,playbackError:null};
  } catch(error) {
    logger.error('Stored course library playback could not be renewed',error);
    return {...video,playbackUrl:null,playbackError:'Saved media access could not be renewed. Check storage access and refresh this library.'};
  }
}
