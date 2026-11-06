import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireRole } from '@/lib/auth/require-role';
import { requireAdminClient } from '@/lib/supabase/admin';
import MouDraftEditor from './MouDraftEditor';
export const dynamic='force-dynamic';
export const metadata={title:'Edit agreement draft | Elevate Admin',robots:{index:false,follow:false}};
export default async function EditMou({params}:{params:Promise<{id:string}>}) {
 await requireRole(['admin']);const {id}=await params;if(!/^[0-9a-f-]{36}$/i.test(id))notFound();const db=await requireAdminClient();const {data:mou,error}=await db.from('partner_mous').select('id,status,signed_at,terms,updated_at').eq('id',id).maybeSingle();if(error)throw new Error('Agreement record could not load.');if(!mou)notFound();
 return <main className="mx-auto max-w-4xl px-4 py-8"><Link href={`/mou/${id}`} className="font-bold text-blue-800 underline">View agreement</Link><h1 className="mt-5 text-3xl font-black">Edit agreement draft</h1>{mou.status==='pending'&&!mou.signed_at?<MouDraftEditor id={id} title={mou.terms?.title||''} content={mou.terms?.content||''} updatedAt={mou.updated_at}/>:<p className="mt-5 rounded-xl border bg-amber-50 p-5">This agreement is already issued or executed. Preserve this original and create a new draft for revised terms.</p>}</main>;
}
