/**
 * A signed B2/S3 URL is only a delivery credential. Recover the canonical key
 * for an existing Course Builder caption/transcript when its signature expires.
 * Never accept arbitrary hosts, buckets, media types or object paths.
 */
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
 if(!/^generated-lessons\/lesson-[A-Za-z0-9-]{8,180}-(?:[0-9]{10,14}|[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})\.(?:vtt|txt)$/.test(path))return null;
 return path;
}
