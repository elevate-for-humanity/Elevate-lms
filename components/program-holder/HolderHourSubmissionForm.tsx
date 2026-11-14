'use client';
import {useState,type FormEvent} from 'react';
import {useRouter} from 'next/navigation';
export function HolderHourSubmissionForm({enrollments}:{enrollments:{id:string;full_name?:string|null}[]}) {
  const router=useRouter(),[saving,setSaving]=useState(false),[message,setMessage]=useState('');
  async function submit(event:FormEvent<HTMLFormElement>){
    event.preventDefault();const form=event.currentTarget,fields=new FormData(form);setSaving(true);setMessage('');
    try {
      const response=await fetch('/api/program-holder/hours-submissions',{method:'POST',headers:{'content-type':'application/json'},
        body:JSON.stringify({enrollmentId:fields.get('student'),date:fields.get('date'),hours:Number(fields.get('hours')),work:fields.get('work')})});
      const data=await response.json();
      if(!response.ok)throw new Error(data.error||'Unable to submit hours.');
      form.reset();setMessage('Hours submitted; awaiting Admin verification.');router.refresh();
    }catch(error){setMessage(error instanceof Error?error.message:'Unable to submit hours.');}
    finally{setSaving(false);}
  }
  return <section className="rounded-2xl border border-slate-200 bg-white p-5">
    <h2 className="text-xl font-black">Submit student training hours</h2>
    <p className="mt-1 text-sm text-slate-600">Select the enrolled student by name. Entries are pending until reviewed by Admin; hours are never automatically approved.</p>
    <form onSubmit={submit} className="mt-4 grid gap-4">
      <label className="grid gap-1 font-bold">Student<select required name="student" defaultValue="" className="min-h-11 rounded-lg border p-2"><option value="">Choose enrolled student</option>{enrollments.map(student=><option key={student.id} value={student.id}>{student.full_name||'Student — name missing'}</option>)}</select></label>
      <label className="grid gap-1 font-bold">Training date<input required type="date" name="date" className="min-h-11 rounded-lg border p-2"/></label>
      <label className="grid gap-1 font-bold">Hours completed<input required name="hours" type="number" min="0.25" max="24" step="0.25" className="min-h-11 rounded-lg border p-2"/></label>
      <label className="grid gap-1 font-bold">Instruction and work completed<textarea required name="work" minLength={10} maxLength={2000} rows={4} className="rounded-lg border p-2"/></label>
      <button disabled={saving||!enrollments.length} className="min-h-11 rounded-lg bg-blue-700 px-5 py-2 font-black text-white disabled:opacity-50">{saving?'Submitting…':'Submit hours for approval'}</button>
      <p role="status">{message}</p>
    </form>
  </section>;
}
