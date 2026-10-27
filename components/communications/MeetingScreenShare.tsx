'use client';
import {useEffect,useState} from 'react';
import {useLocalParticipant} from '@livekit/components-react';
export function MeetingScreenShare({allowed=true}:{allowed?:boolean}){
 const {localParticipant,isScreenShareEnabled}=useLocalParticipant();const [supported,setSupported]=useState(false);const [error,setError]=useState('');const [pending,setPending]=useState(false);
 useEffect(()=>setSupported(Boolean(navigator.mediaDevices?.getDisplayMedia)),[]);
 return <div className="space-y-2"><button type="button" disabled={!allowed||!supported||pending} aria-pressed={isScreenShareEnabled} className="min-h-11 rounded-lg bg-indigo-700 px-4 font-bold text-white disabled:opacity-50"
 onClick={async()=>{setPending(true);setError('');try{await localParticipant.setScreenShareEnabled(!isScreenShareEnabled);}catch{setError('Screen sharing did not start. Allow access and choose the screen or window to share.');}finally{setPending(false);}}}>{isScreenShareEnabled?'Stop sharing':'Share screen'}</button>
 {!supported&&<p className="text-sm text-slate-200">Screen sharing is unavailable in this browser. Join on a supported desktop browser to present your screen.</p>}{!allowed&&<p className="text-sm text-slate-200">Screen sharing is disabled for this room.</p>}{error&&<p role="alert" className="text-sm text-red-200">{error}</p>}</div>;
}
