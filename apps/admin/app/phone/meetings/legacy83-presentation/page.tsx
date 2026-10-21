'use client';
import {useEffect,useState} from 'react';
import {useNaturalVoice} from '@/components/voice/useNaturalVoice';
const pages=['Homepage','About','Services','Programs','Client Experience','Resources','Contact','Booking','Review and Next Steps'];
const scripts=['Review the approved homepage and navigation.','Confirm the organization story.','Inspect actual service descriptions.','Review program cards.','Test the visitor journey.','Review resources.','Verify contact details.','Review available booking controls.','Capture client feedback.'];
export default function Presentation(){
 const [step,setStep]=useState(0);
 const [playing,setPlaying]=useState(false);
 const [message,setMessage]=useState('Ready to present.');
 const voice=useNaturalVoice();
 useEffect(()=>{
  if(!playing)return;
  let active=true;
  void voice.play(pages[step]+'. '+scripts[step],{style:'assistant',voice:'coral',onEnded:()=>{
   if(!active)return;
   if(step<pages.length-1)setStep(s=>s+1);
   else {setPlaying(false);setMessage('Presentation complete.');}
  },onError:()=>{if(active){setPlaying(false);setMessage('Natural narration unavailable. Use manual controls.');}}});
  return ()=>{active=false;voice.stop();};
 },[step,playing]);
 const stop=()=>{voice.stop();setPlaying(false);setMessage('Stopped. You have control.');};
 const move=(n:number)=>{stop();setStep(Math.max(0,Math.min(pages.length-1,n)));};
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
 <section className="rounded-xl border p-8"><p>Checkpoint {step+1} of {pages.length}</p><h2 className="my-4 text-3xl">{pages[step]}</h2><p className="text-xl">{scripts[step]}</p></section>
 <a className="block underline" href="https://meet.google.com/bpi-yoym-rru" target="_blank" rel="noopener noreferrer">Join the Google Meet</a>
 <a className="block underline" href="https://www.elevateforhumanity.org/apps/website-builder/edit/7ebfae31-6d45-43fc-b45c-8110b703d382/preview" target="_blank" rel="noopener noreferrer">Open private Legacy 83 preview</a>
 <p className="text-sm">The website preview requires authorization. You must share your tab manually; this tool does not claim control over the Meet interface or the private website.</p>
 </main>;
}