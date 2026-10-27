'use client';
import {useActionState,useState} from 'react';
import {createMeetingResult} from '../actions';
export function NewMeetingForm(){
 const [local,setLocal]=useState('');const [state,action,pending]=useActionState(createMeetingResult,{ok:false,message:''});
 const field='min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 py-2';
 return <form action={action} className="w-full space-y-3 rounded-2xl border bg-white p-4">
 <h2 className="font-black">Create or schedule a video meeting</h2>
 <label className="block text-sm font-bold">Meeting title<input name="title" required minLength={3} maxLength={120} className={field}/></label>
 <label className="block text-sm font-bold">Meeting type<select name="roomType" className={field}><option value="meeting">Meeting</option><option value="team_huddle">Team huddle</option><option value="classroom">Classroom</option><option value="support">Support</option></select></label>
 <label className="block text-sm font-bold">Date and time (optional, your device time zone)<input type="datetime-local" value={local} onChange={event=>setLocal(event.target.value)} className={field}/></label>
 <input type="hidden" name="scheduledAt" value={local&&Number.isFinite(new Date(local).getTime())?new Date(local).toISOString():''}/>
 <p className="text-xs text-slate-600">Leave the time empty to create an instant room. Calendar invitations reserve one hour.</p>
 <button disabled={pending} className="min-h-12 rounded-xl bg-indigo-700 px-4 font-black text-white disabled:opacity-50">{pending?'Creating meeting…':local?'Schedule meeting':'Create meeting'}</button>
 {state.message&&<p role={state.ok?'status':'alert'} className={state.ok?'text-emerald-800':'text-red-800'}>{state.message}</p>}</form>;
}
