'use client';
import {useActionState} from 'react';
import {destinationActionResult} from './actions';
export function DestinationControls({id,enabled,isDefault}:{id:string;enabled:boolean;isDefault:boolean}){
 const [state,action,pending]=useActionState(destinationActionResult,{ok:false,message:''});
 return <form action={action} className="space-y-2"><input type="hidden" name="destinationId" value={id}/><input type="hidden" name="enabled" value={String(!enabled)}/>
 <div className="flex flex-wrap gap-2">{isDefault?<span className="rounded-lg bg-emerald-100 px-3 py-2 font-bold">Default</span>:<button name="command" value="default" disabled={pending} className="min-h-11 rounded-lg border px-3 font-bold disabled:opacity-50">Make default</button>}
 <button name="command" value="toggle" disabled={pending} className="min-h-11 rounded-lg border px-3 font-bold disabled:opacity-50">{enabled?'Pause':'Enable'}</button>
 <button name="command" value="test" disabled={pending||!enabled} className="min-h-11 rounded-lg border border-indigo-300 px-3 font-bold text-indigo-700 disabled:opacity-50">Test call</button></div>
 {pending&&<p role="status">Applying phone action…</p>}{state.message&&<p role={state.ok?'status':'alert'} className={state.ok?'text-sm text-emerald-800':'text-sm text-red-800'}>{state.message}</p>}</form>;
}
