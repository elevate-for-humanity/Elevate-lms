'use client';
import {useEffect,useState} from 'react';
import {useNaturalVoice} from '@/components/voice/useNaturalVoice';
import {legacy83ReviewSlides as slides, legacy83ReviewHref} from '@/lib/tenant/legacy83-review-slides';
export default function Presentation(){
 const [step,setStep]=useState(0);
 const [playing,setPlaying]=useState(false);
 const [message,setMessage]=useState('Ready to present.');
 const {play,stop:stopVoice}=useNaturalVoice();
 useEffect(()=>{
  if(!playing)return;
  let active=true;
  void play(slides[step].title+'. '+slides[step].narration,{style:'assistant',voice:'coral',onEnded:()=>{
   if(!active)return;
   if(step<slides.length-1)setStep(s=>s+1);
   else {setPlaying(false);setMessage('Presentation complete.');}
  },onError:()=>{if(active){setPlaying(false);setMessage('Natural narration unavailable. Use manual controls.');}}});
  return ()=>{active=false;stopVoice();};
 },[step,playing,play,stopVoice]);
 const stop=()=>{stopVoice();setPlaying(false);setMessage('Stopped. You have control.');};
 const move=(n:number)=>{stop();setStep(Math.max(0,Math.min(slides.length-1,n)));};
 return <main className="space-y-5 p-8">
 <h1 className="text-3xl font-bold">Legacy 83 — PARIS guided presentation</h1>
 <p>Operator-controlled narration and checkpoints. Share the presentation tab in Google Meet.</p>
 <div className="flex flex-wrap gap-3">
 <button type="button" onClick={()=>{setStep(0);setPlaying(true);setMessage('Presenting.')}} className="rounded bg-green-700 px-4 py-3 text-white">Start presentation</button>
 <button type="button" onClick={stop} className="rounded bg-red-700 px-4 py-3 text-white">Stop / take over</button>
 <button type="button" onClick={()=>move(step-1)} className="rounded border px-4 py-3">Previous</button>
 <button type="button" onClick={()=>move(step+1)} className="rounded border px-4 py-3">Next</button>
 </div>
 <p role="status">{message}</p>
 <section className="rounded-xl border p-8"><p>Slide {step+1} of {slides.length}</p><h2 className="my-4 text-3xl">{slides[step].title}</h2><p className="text-xl">{slides[step].narration}</p></section>
 <a className="block underline" href={legacy83ReviewHref(slides[step].slug)} target="_blank" rel="noopener noreferrer">Review this website page</a>
 <p>Feedback: Keep as is · Change · Questions. Include the page or slide number.</p>
 <p className="text-sm">The website preview requires authorization. You must share your tab manually; this tool does not claim control over the Meet interface or the private website.</p>
 </main>;
}
