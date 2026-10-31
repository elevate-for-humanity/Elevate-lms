'use client';

import { useEffect, useRef, useState, type FormEvent } from 'react';
import { createBrowserSpeechRecognition, type BrowserSpeechRecognition } from '@/lib/browser/speech-recognition';
import { tenantSiteHref } from '@/lib/tenant/site-links';
import { useTenantRequestHeaders } from './TenantPreviewContext';

export function TenantParis({business,accent,basePath=''}:{business:string;accent:string;basePath?:string}) {
  const previewHeaders = useTenantRequestHeaders();
  const [open,setOpen]=useState(false);
  const [input,setInput]=useState('');
  const [busy,setBusy]=useState(false);
  const [listening,setListening]=useState(false);
  const [voiceAvailable,setVoiceAvailable]=useState(false);
  const [error,setError]=useState('');
  const [messages,setMessages]=useState<Array<{role:string;text:string}>>([]);
  const recognition=useRef<BrowserSpeechRecognition|null>(null);
  useEffect(()=>{
    const voice=createBrowserSpeechRecognition();
    setVoiceAvailable(Boolean(voice));
    if (!voice) return;
    voice.lang='en-US';voice.continuous=false;voice.interimResults=false;
    voice.onresult=event=>{const result=event.results[0]?.[0]?.transcript;if(result)setInput(previous=>(previous+' '+result).trim().slice(0,1500));setListening(false);};
    voice.onerror=()=>{setListening(false);setError('Microphone unavailable. You can type your question below.');};
    voice.onend=()=>setListening(false);
    recognition.current=voice;
    return ()=>{voice.onresult=null;voice.onerror=null;voice.onend=null;voice.stop();recognition.current=null;};
  },[]);
  function microphone(){
    if(listening){recognition.current?.stop();setListening(false);return;}
    try{setError('');recognition.current?.start();setListening(true);}catch{setError('Microphone unavailable. Please type your question.');}
  }
  async function send(event:FormEvent){
    event.preventDefault();const question=input.trim();if(!question||busy)return;
    setBusy(true);setError('');setInput('');setMessages(previous=>[...previous,{role:'You',text:question}]);
    try{
      const response=await fetch('/api/tenant-sites/paris',{method:'POST',headers:{'Content-Type':'application/json',...previewHeaders},body:JSON.stringify({message:question}),signal:AbortSignal.timeout(55000)});
      const data=await response.json();
      if(!response.ok||typeof data.message!=='string')throw new Error('unavailable');
      setMessages(previous=>[...previous,{role:'PARIS',text:data.message}]);
    }catch{setError('PARIS is temporarily unavailable. Please use the Contact page to reach '+business+'.');}
    finally{setBusy(false);}
  }
  return <aside className="fixed bottom-5 right-4 z-40 max-w-[calc(100vw-2rem)] font-sans">
    {open&&<section id="tenant-paris-panel" aria-label={'PARIS for '+business} className="mb-3 w-80 max-w-full rounded-2xl border border-black/10 bg-white p-5 text-slate-950 shadow-2xl">
      <div className="flex items-center justify-between gap-3"><h2 className="text-lg font-bold">PARIS · {business}</h2><button type="button" aria-label="Close PARIS" onClick={()=>{recognition.current?.stop();setListening(false);setOpen(false);}}>✕</button></div>
      <p className="mt-3 text-sm">Ask about this business, its published services, or how to get in touch.</p>
      <div role="log" aria-live="polite" className="mt-3 max-h-52 space-y-3 overflow-y-auto text-sm">{messages.map((message,i)=><p key={i}><strong>{message.role}: </strong>{message.text}</p>)}</div>
      {error&&<p role="status" className="mt-3 text-sm text-red-800">{error}</p>}
      <form onSubmit={send} className="mt-4 space-y-3"><label className="block text-sm font-bold">Your question<input value={input} onChange={event=>setInput(event.target.value)} maxLength={1500} className="mt-1 w-full rounded-lg border border-slate-400 p-2 font-normal"/></label>
        <div className="flex gap-2"><button disabled={busy||!input.trim()} className="rounded-lg px-4 py-2 text-sm font-bold text-white disabled:opacity-50" style={{backgroundColor:accent}}>{busy?'Connecting…':'Send'}</button><button type="button" disabled={!voiceAvailable||busy} aria-pressed={listening} aria-label={listening?'Stop microphone':'Use microphone'} onClick={microphone} className="rounded-lg border px-3 py-2 text-sm disabled:opacity-50">{listening?'Stop mic':'Microphone'}</button></div>
      </form>
      {!voiceAvailable&&<p className="mt-2 text-xs">Voice input is unavailable in this browser. Keyboard input is available.</p>}
      <a href={tenantSiteHref('/contact',basePath)} className="mt-3 inline-block text-sm font-bold underline">Contact {business}</a>
    </section>}
    <button type="button" aria-expanded={open} aria-controls="tenant-paris-panel" onClick={()=>setOpen(value=>!value)} className="rounded-full px-5 py-3 font-bold text-white shadow-xl" style={{backgroundColor:accent}}>Need help? Ask PARIS</button>
  </aside>;
}
