// Compare spoken and authored cue tokens without treating harmless inflections
// (e.g. "hour ranges" vs "hour range") as an unrelated picture. Keep exact
// contiguous/unique-anchor checks below: a generic fuzzy match is unsafe.
// ASR emits numerals and percent signs for the same spoken quantities.
// Normalize spelling only; never tolerate a different value or missing negation.
const numberWords = {zero:'0',one:'1',two:'2',three:'3',four:'4',five:'5',six:'6',seven:'7',eight:'8',nine:'9',ten:'10',eleven:'11',twelve:'12',thirteen:'13',fourteen:'14',fifteen:'15',sixteen:'16',seventeen:'17',eighteen:'18',nineteen:'19',twenty:'20',thirty:'30',forty:'40',fifty:'50',sixty:'60',seventy:'70',eighty:'80',ninety:'90'};
const words = value => (String(value ?? '').toLowerCase().replaceAll('%',' percent ').match(/[a-z0-9]+/g) ?? [])
 .map(word => numberWords[word] ?? word)
 .map(word => word.length > 4 && /(?:ranges|hours|weeks|frames|times)$/.test(word)
   ? word.replace(/s$/, '') : word);
export function pictureSceneTiming(durationSeconds, fps = 30) {
 if (!Number.isFinite(durationSeconds) || durationSeconds <= 0 || !Number.isFinite(fps) || fps <= 0)
  throw Error('TEACHING_PICTURE_DURATION_REQUIRED');
 const durationFrames = Math.ceil(durationSeconds * fps);
 return {durationFrames, durationSeconds: durationFrames / fps};
}
export function quoteStartSeconds(quote, cues) {
 const transcript=cues.flatMap(c=>words(c.text).map(word=>({word,start:c.startSeconds})));
 const target=words(quote);
 // ASR can split a single spoken compound ("auto -claving") into two
 // tokens. Accept only an exact alphabetic concatenation, never fuzzy words,
 // changed numbers or a missing negation. Keep unique-location checks below.
 const matches=pattern=>transcript.flatMap((_,i)=>{
  const visit=(targetIndex,spokenIndex)=>{
   if(targetIndex===pattern.length)return true;
   const wanted=pattern[targetIndex],actual=transcript[spokenIndex]?.word;
   if(actual===undefined)return false;
   if(actual===wanted&&visit(targetIndex+1,spokenIndex+1))return true;
   const next=transcript[spokenIndex+1]?.word;
   return /^[a-z]{5,}$/.test(wanted)&&/^[a-z]+$/.test(actual)&&/^[a-z]+$/.test(next??'')&&
    actual+next===wanted&&visit(targetIndex+1,spokenIndex+2);
  };
  return visit(0,i)?[i]:[];
 });
 if (!target.length || !transcript.length) throw Error('PICTURE_CUE_NOT_ALIGNED_TO_SPEECH');
 const exact=matches(target);
 if(exact.length===1)return transcript[exact[0]].start;
 // Generated picture quotes can differ slightly from spoken narration. Resolve
 // a unique, long contiguous passage instead of restarting the completed film.
 // Ambiguous or unsupported matches must still fail rather than mis-time images.
 if(target.length>=5) {
  for(let size=target.length-1;size>=5;size--) {
   const positions=new Set();
   for(let offset=0;offset<=target.length-size;offset++)
    for(const i of matches(target.slice(offset,offset+size)))positions.add(i-offset);
   if(positions.size===1) {
    const start=[...positions][0];
    if(start>=0&&start<transcript.length)return transcript[start].start;
   }
   if(positions.size>1)break;
  }
 }
 // Recognition may omit a short connective word or insert a filler.
 // A unique, ordered anchor within a small span is sufficient for cue timing;
 // ambiguous matches still fail rather than drifting to an unrelated picture.
 if(target.length>=4) {
  const anchors=[];
  const needle=target.slice(0,Math.min(4,target.length));
  for(let i=0;i<transcript.length;i++) {
   if(transcript[i].word!==needle[0])continue;
   let matched=1,j=i+1;
   while(j<Math.min(transcript.length,i+needle.length+2)&&matched<needle.length) {
    if(transcript[j].word===needle[matched])matched++;
    j++;
   }
   if(matched===needle.length)anchors.push(i);
  }
  if(anchors.length===1)return transcript[anchors[0]].start;
 }
 // A generated quotation may paraphrase its opening, while retaining a unique
 // distinctive passage later in the actual narration. Search every four-word
 // window, and accept only a single location supported by two overlapping
 // windows. This avoids binding an image to a common isolated phrase.
 if (target.length >= 6) {
  const hits = new Map();
  for (let offset = 0; offset <= target.length - 4; offset++) {
   const window = target.slice(offset, offset + 4);
   for (const i of matches(window)) {
    const anchor = i - offset;
    const entry = hits.get(anchor) ?? { offsets: new Set(), first: i };
    entry.offsets.add(offset);
    entry.first = Math.min(entry.first, i);
    hits.set(anchor, entry);
   }
  }
  const candidates = [...hits.values()].filter(({offsets}) =>
   [...offsets].some(offset => offsets.has(offset+1) || offsets.has(offset+2)));
  if (candidates.length === 1) return transcript[candidates[0].first].start;
 }
 throw Error('PICTURE_CUE_NOT_ALIGNED_TO_SPEECH');
}
export function pictureTimeline(photos,cues,durationSeconds,recapStartSeconds) {
 if(!Array.isArray(photos)||photos.length<2||new Set(photos.map(p=>p.sha256)).size<2)
  throw Error('MULTIPLE_DISTINCT_TEACHING_PHOTOS_REQUIRED');
 if(!(recapStartSeconds>0&&recapStartSeconds<durationSeconds))throw Error('FRESH_NARRATED_RECAP_TIMING_REQUIRED');
 // The recap illustration belongs to the recorded recap part's boundary,
 // including its brief leading breath. Word alignment starts later.
 const recapIndex=photos.findIndex(p=>p.isRecap===true);
 const selectedRecap=recapIndex>=0?recapIndex:photos.length-1;
 if(photos.filter(p=>p.isRecap===true).length>1)throw Error('ONE_RECAP_PICTURE_REQUIRED');
 const starts=photos.map((p,i)=>{
  // The recap uses the recorded audio-part boundary, not a transcript phrase.
  // Speech recognition may omit or paraphrase recap words; that must not block
  // a verified recap interval or force another full render.
  if(i===selectedRecap)return recapStartSeconds;
  const spoken=quoteStartSeconds(p.narrationQuote,cues);
  if(spoken>=recapStartSeconds)throw Error('TEACHING_PICTURE_IN_RECAP_REQUIRED_REPAIR');
  return spoken;
 });
 const result=photos.map((photo,i)=>{
  const same=starts.filter(s=>s===starts[i]).length;
  const ordinal=starts.slice(0,i).filter(s=>s===starts[i]).length;
  const next=starts.find(s=>s>starts[i])??recapStartSeconds;
  return {...photo,startSeconds:starts[i]+(next-starts[i])*ordinal/same};
 }).sort((a,b)=>a.startSeconds-b.startSeconds);
 result[0].startSeconds=0;
 return result.map((p,i)=>({...p,endSeconds:result[i+1]?.startSeconds??durationSeconds}));
}
export function activePictureCue(cues,seconds){
 const cue=cues.find(c=>seconds>=c.startSeconds&&seconds<c.endSeconds);
 if(!cue)throw Error('TEACHING_PICTURE_TIMELINE_GAP');
 return cue;
}
