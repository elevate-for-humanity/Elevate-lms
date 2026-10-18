'use client';
import {useEffect,useRef,useState} from 'react';
type Segment={id:string;src:string;startSeconds:number;durationSeconds:number};
export default function ProgressiveLessonVideo({buildId,lessonId,title}:{buildId:string;lessonId:string;title?:string}){
 const [segments,setSegments]=useState<Segment[]>([]),[index,setIndex]=useState(0),[waiting,setWaiting]=useState(false),[error,setError]=useState('');
 const player=useRef<HTMLVideoElement>(null),resume=useRef(false);
 useEffect(()=>{
  let cancelled=false;setSegments([]);setIndex(0);setWaiting(false);setError('');resume.current=false;
  async function load(){try{
   const response=await fetch('/api/admin/ultimate-course-builder/segments?buildId='+encodeURIComponent(buildId)+'&lessonBuildId='+encodeURIComponent(lessonId),{cache:'no-store'});
   const result=await response.json();if(!response.ok)throw Error(result.error||'Preview unavailable');
   if(!cancelled){setError('');setSegments(previous=>{const incoming:Segment[]=result.segments??[];if(previous[0]&&incoming[0]&&previous[0].id!==incoming[0].id){setIndex(0);setWaiting(false);}return incoming.map((next:Segment)=>previous.find(old=>old.id===next.id)??next);});}
  }catch(cause){if(!cancelled)setError(cause instanceof Error?cause.message:'Preview unavailable');}}
  void load();const timer=setInterval(()=>void load(),10000);return()=>{cancelled=true;clearInterval(timer);};
 },[buildId,lessonId]);
 const current=segments[index];
 useEffect(()=>{if(waiting&&index+1<segments.length){setIndex(index+1);setWaiting(false);}},[segments,index,waiting]);
 useEffect(()=>{if(resume.current&&current)void player.current?.play().catch(()=>setError('Tap play to continue the in-progress video.'));},[current?.id]);
 return <section aria-label="Video being built" className="space-y-3">
  <p className="font-bold">Video being built · Draft preview</p>
  <p>Completed portions play in order as they are saved. This video has not passed final quality review.</p>
  {current?<><video ref={player} controls playsInline preload="auto" className="w-full rounded-lg bg-black" src={current.src} aria-label={`${title??'Lesson'} in-progress video`}
   onPlay={()=>{resume.current=true;setError('');}}
   onEnded={()=>{resume.current=true;if(index+1<segments.length)setIndex(index+1);else setWaiting(true);}}
   onError={()=>setError('This portion could not play. Refresh the preview to renew access; the render is preserved.')} />
   <p role="status">{waiting?'Waiting for the next completed portion…':`Playing portion ${index+1} of ${segments.length}`} · {Math.round(segments.reduce((total,segment)=>total+segment.durationSeconds,0))} seconds available</p>
   <button type="button" className="rounded-lg border px-3 py-2" onClick={()=>{setIndex(0);setWaiting(false);resume.current=true;void player.current?.play();}}>Replay from beginning</button>
  </>:<p role="status">Waiting for the first completed video portion. Saved instruction remains available below.</p>}
  {error&&<p role="alert">{error}</p>}
 </section>;
}
