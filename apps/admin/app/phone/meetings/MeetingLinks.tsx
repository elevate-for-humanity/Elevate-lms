'use client';
import {useEffect,useState} from 'react';
import {meetingCalendar} from '@/lib/communications/meeting-calendar.mjs';
export function MeetingLinks({roomId,title,scheduledAt,externalUrl}:{roomId:string;title:string;scheduledAt?:string|null;externalUrl?:string|null}){
 const [url,setUrl]=useState('');const [message,setMessage]=useState('');
 useEffect(()=>setUrl(externalUrl || new URL('/phone/meetings/'+roomId,window.location.origin).href),[roomId,externalUrl]);
 if(!url)return null;
 const calendar=meetingCalendar({title,url,start:scheduledAt});
 const button='inline-flex min-h-11 items-center rounded-lg border bg-white px-3 text-sm font-bold';
 return <div className="w-full space-y-2"><div className="flex flex-wrap gap-2">
 <button type="button" className={button} onClick={async()=>{try{await navigator.clipboard.writeText(url);setMessage('Meeting link copied.');}catch{setMessage('Copy the meeting link below.');}}}>Copy meeting link</button>
 <a className={button} href={'mailto:?'+new URLSearchParams({subject:title,body:'You are invited to '+title+'.'+(scheduledAt?'\nStart: '+new Date(scheduledAt).toLocaleString():'')+'\nJoin: '+url+'\nJoin using the meeting link.'}).toString()}>Email invitation</a>
 <button type="button" className={button} onClick={async()=>{try{if(navigator.share)await navigator.share({title,text:'Join our Elevate meeting',url});else{await navigator.clipboard.writeText(url);setMessage('Meeting link copied. Paste it into your message.');}}catch{setMessage('You can use Copy meeting link to send it.');}}}>Share link</button>
 <a className={button} href={calendar.google} target="_blank" rel="noopener noreferrer">Add to Google Calendar</a>
 <a className={button} href={'data:text/calendar;charset=utf-8,'+encodeURIComponent(calendar.ics)} download={'elevate-meeting-'+roomId+'.ics'}>Calendar invitation</a>
 </div><p className="break-all text-xs text-slate-600">{url}</p>{message&&<p role="status" className="text-sm text-blue-800">{message}</p>}</div>;
}
