type Cue = {start:number;end:number;text:string};
type Film = {durationSeconds?:unknown;captionCues?:unknown;measuredTranscript?:unknown};
const stamp=(seconds:number)=>new Date(Math.round(seconds*1000)).toISOString().slice(11,23);
/** Reuse the same validated saved cues for the native player's transcript. */
export function measuredLessonCues(film:Film|null|undefined):Cue[]{
 const cues=film?.captionCues,duration=Number(film?.durationSeconds);
 if(!Array.isArray(cues)||!cues.length||!Number.isFinite(duration)||duration<=0||duration>=86400)return [];
 let end=0;
 for(const value of cues){
  const cue=value as Cue;
  if(!cue||typeof cue.text!=='string'||!cue.text.trim()||/[<>\r\n]/.test(cue.text)||!Number.isFinite(cue.start)||!Number.isFinite(cue.end)||cue.start<end||cue.end<=cue.start||cue.end>duration)return [];
  end=cue.end;
 }
 return cues as Cue[];
}
/** Serve saved measured material only; authorization belongs to the lesson route. */
export function measuredLessonAsset(asset:string,film:Film|null|undefined):{body:string;contentType:string}|null{
 if(asset==='transcript'){
  const body=film?.measuredTranscript;
  return typeof body==='string'&&body.trim()?{body,contentType:'text/plain; charset=utf-8'}:null;
 }
 if(asset!=='captions')return null;
 const cues=measuredLessonCues(film);
 if(!cues.length)return null;
 return {body:'WEBVTT\n\n'+(cues as Cue[]).map((c,i)=>String(i+1)+'\n'+stamp(c.start)+' --> '+stamp(c.end)+'\n'+c.text+'\n').join('\n'),contentType:'text/vtt; charset=utf-8'};
}
