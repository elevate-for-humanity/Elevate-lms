import {createHash} from 'node:crypto';
// Import JSON through the caller when bundling; this module contains only the
// deterministic key contract, never credentials or caller-selected URLs.
export function orientationRevision(guide){return createHash('sha256').update('native-captions-v2:' + JSON.stringify(guide)).digest('hex').slice(0,16);}
export function orientationKeyForGuide(audience,format,guide){
 if(!['mp4','vtt'].includes(format)||!['learner','hvac','apprentice','host-shop','program-holder','site-coordinator'].includes(audience)||!guide)return null;
 return `dashboard-orientations/${audience}/${orientationRevision(guide)}.${format}`;
}

// Keep captions readable within the reserved bottom band, including long
// technical words. Word times come from the recorded narration alignment.
export function orientationCaptionGroups(words,maxWords=8,maxCharacters=68){
 const groups=[];let group=[];
 for(const word of words){
  const text=String(word.word??word.text??'');
  if(!text||!Number.isFinite(word.start)||!Number.isFinite(word.end)||word.end<=word.start)throw Error('ORIENTATION_CAPTION_INVALID');
  const candidate=[...group,word];
  if(group.length&&(candidate.length>maxWords||candidate.map(w=>w.word??w.text).join(' ').length>maxCharacters)){groups.push(group);group=[];}
  group.push(word);
 }
 if(group.length)groups.push(group);
 return groups;
}
