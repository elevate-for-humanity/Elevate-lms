import {createHash} from 'node:crypto';
// Import JSON through the caller when bundling; this module contains only the
// deterministic key contract, never credentials or caller-selected URLs.
export function orientationRevision(guide){return createHash('sha256').update(JSON.stringify(guide)).digest('hex').slice(0,16);}
export function orientationKeyForGuide(audience,format,guide){
 if(!['mp4','vtt'].includes(format)||!['learner','hvac','apprentice','host-shop','program-holder','site-coordinator'].includes(audience)||!guide)return null;
 return `dashboard-orientations/${audience}/${orientationRevision(guide)}.${format}`;
}
