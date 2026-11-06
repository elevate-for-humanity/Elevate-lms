import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireRole } from '@/lib/auth/require-role';
import { requireAdminClient } from '@/lib/supabase/admin';
export const dynamic='force-dynamic';
export const metadata={title:'Review agreement | Elevate Admin',robots:{index:false,follow:false}};
export default async function MouDocument({params}:{params:Promise<{id:string}>}) {
  await requireRole(['admin']);const {id}=await params;
  if(!/^[0-9a-f-]{36}$/i.test(id))notFound();
  const db=await requireAdminClient();const {data:mou,error}=await db.from('partner_mous').select('id,status,signed_at,mou_version,terms,document_url,partners:partner_id(name)').eq('id',id).maybeSingle();
  if(error)throw new Error('Agreement record could not be loaded.');if(!mou)notFound();
  const partner=Array.isArray(mou.partners)?mou.partners[0]:mou.partners;
  const documentUrl=typeof mou.document_url==='string'&&/^https:\/\//i.test(mou.document_url)?mou.document_url:null;
  return <main className="mx-auto max-w-4xl px-4 py-8"><Link href="/mou" className="font-bold text-blue-800 underline">All agreements</Link><h1 className="mt-5 text-3xl font-black">{mou.terms?.title||partner?.name||'Partner agreement'}</h1><p className="mt-3">{partner?.name} · {mou.status} · {mou.mou_version}</p>{mou.terms?.draft&&<p className="mt-4 rounded-xl bg-amber-50 p-4 font-bold">Draft for review. This document has not been sent or executed.</p>}{typeof mou.terms?.content==='string'&&mou.terms.content.trim()?<article className="mt-6 whitespace-pre-wrap rounded-xl border bg-white p-6 leading-8">{mou.terms.content}</article>:<p className="mt-6 rounded-xl border border-amber-300 bg-amber-50 p-5">Agreement text is not attached to this legacy record. Review its original document or attach the complete terms before it is used for signature.</p>}{documentUrl&&<a href={documentUrl} target="_blank" rel="noopener noreferrer" className="mt-5 inline-flex min-h-11 items-center font-bold text-blue-800 underline">Open original agreement document</a>}{mou.status==='pending'&&!mou.signed_at&&<Link href={`/mou/${id}/edit`} className="mt-5 block font-bold text-blue-800 underline">Edit draft terms</Link>}</main>;
}
