/**
 * A signed B2/S3 URL is only a delivery credential. Recover the canonical key
 * for an existing Course Builder caption/transcript when its signature expires.
 * Never accept arbitrary hosts, buckets, media types or object paths.
 */
const OWNED_ANCILLARY_KEY=/^(?:course-videos\/)?generated-lessons\/lesson-[A-Za-z0-9-]{8,180}-(?:[0-9]{10,14}|[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})\.(?:vtt|txt)$/;

/** @param {string} rawUrl @param {{endpoint?: string, bucket: string}} config */
export function ownedAncillaryCourseKey(rawUrl, {endpoint,bucket}) {
 if(typeof rawUrl!=='string'||typeof endpoint!=='string'||typeof bucket!=='string'||!bucket) return null;
 let url,storage;
 try{url=new URL(rawUrl);storage=new URL(endpoint);}catch{return null;}
 if(url.protocol!=='https:'||storage.protocol!=='https:'||url.username||url.password) return null;
 const sameHost=url.hostname===storage.hostname&&url.port===storage.port;
 const bucketHost=url.hostname===bucket+'.'+storage.hostname&&url.port===storage.port;
 if(!sameHost&&!bucketHost) return null;
 let path;
 try{path=decodeURIComponent(url.pathname).replace(/^\/+/, '');}catch{return null;}
 if(sameHost) {
  if(!path.startsWith(bucket+'/'))return null;
  path=path.slice(bucket.length+1);
 }
 // Generated caption and transcript keys are immutable, source-scoped assets.
 // Production includes both timestamp-suffixed and immutable UUID-suffixed lesson captions.
 // Neither variant permits arbitrary directories or non-text media assets.
 // The B2 bucket may store course assets beneath the fixed 'course-videos/'
 // namespace. Accept only that exact prefix or the original root namespace,
 // never arbitrary paths or public URLs from unrelated hosts/buckets.
 if(!OWNED_ANCILLARY_KEY.test(path))return null;
 return path;
}

/**
 * Supabase Storage variant: accept only this project's course-videos bucket
 * (public, signed or authenticated object URLs) and the same immutable
 * caption/transcript key shape.
 * @param {string} rawUrl @param {string|undefined} supabaseUrl
 * @returns {{bucket: string, key: string}|null}
 */
export function ownedSupabaseAncillaryCourseObject(rawUrl, supabaseUrl) {
 if(typeof rawUrl!=='string'||typeof supabaseUrl!=='string') return null;
 let url,project;
 try{url=new URL(rawUrl);project=new URL(supabaseUrl);}catch{return null;}
 if(url.protocol!=='https:'||project.protocol!=='https:'||url.username||url.password) return null;
 if(url.hostname!==project.hostname||url.port!==project.port) return null;
 let path;
 try{path=decodeURIComponent(url.pathname);}catch{return null;}
 const match=/^\/storage\/v1\/object\/(?:public|sign|authenticated)\/(course-videos|course_videos)\/(.+)$/.exec(path);
 if(!match||match[2].startsWith('course-videos/')||!OWNED_ANCILLARY_KEY.test(match[2])) return null;
 return {bucket:match[1],key:match[2]};
}
