import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {mkdtemp,writeFile,readFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
const execute=promisify(execFile);
const aliases={'image/jpg':'image/jpeg','image/pjpeg':'image/jpeg','image/x-png':'image/png','image/x-ms-bmp':'image/bmp','image/x-tiff':'image/tiff'};
const supported=new Set(['image/png','image/jpeg','image/webp','image/gif','image/bmp','image/tiff','image/avif','image/heic','image/heif']);
export async function convertPhotoToPng(bytes){
 const directory=await mkdtemp(join(tmpdir(),'teaching-photo-format-'));
 try {
  const input=join(directory,'source.photo'),output=join(directory,'normalized.png');
  await writeFile(input,bytes);
  await execute('ffmpeg',['-v','error','-y','-protocol_whitelist','file','-i',input,'-frames:v','1','-vf',"scale=w='min(4096,iw)':h='min(4096,ih)':force_original_aspect_ratio=decrease",output],{timeout:30000,maxBuffer:1000000});
  return await readFile(output);
 } catch { throw new Error('TEACHING_PHOTO_FORMAT_DECODE_FAILED'); }
 finally {await rm(directory,{recursive:true,force:true});}
}
/** Preserve browser-native photo formats; normalize other decoded raster
 * formats to a still PNG. Corrupt files and unavailable codecs fail explicitly. */
export async function normalizeTeachingPhoto(bytes,mimeType,{convert=convertPhotoToPng}={}){
 const incoming=String(mimeType??'').split(';')[0].trim().toLowerCase();
 const type=aliases[incoming]??incoming;
 if(!supported.has(type))throw new Error('TEACHING_PHOTO_FORMAT_UNSUPPORTED:'+type);
 if(!bytes?.length || bytes.length>64*1024*1024)throw new Error('TEACHING_PHOTO_SIZE_INVALID');
 if(['image/png','image/jpeg','image/webp'].includes(type))return {bytes,mimeType:type};
 return {bytes:await convert(bytes),mimeType:'image/png'};
}
