import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { LMS_HOST, ADMIN_HOST } from '@/lib/routing/portal-map';
import { normalizeRole } from '@/lib/rbac/role-matrix';
export const dynamic = 'force-dynamic';
export const metadata={title:'Your agreements',robots:{index:false,follow:true}};
/** A bookmarked generic MOU must not issue the wrong role's financial terms. */
export default async function AgreementWorkspaceEntry() {
 const db=await createClient();const {data:{user}}=await db.auth.getUser();
 const {data:profile}=user?await db.from('profiles').select('role').eq('id',user.id).maybeSingle():{data:null};
 const role=normalizeRole(profile?.role);
 const choices=[
  {roles:['program_holder','site_coordinator'],title:'Program Holder agreements',description:'Review your assigned organization, program scope, compensation terms, full documents and signatures.',href:`${LMS_HOST}/program-holder/sign-mou`},
  {roles:['host_shop','host_shop_admin','partner'],title:'Host Shop agreement',description:'Read the full agreement for your shop and occupation, sign from your own account, and reopen stored documents.',href:`${LMS_HOST}/host-shop/onboarding/mou`},
  {roles:['student','learner','apprentice','barber_apprentice','cosmetology_apprentice'],title:'Learner agreements and handbook',description:'Review the agreements required for your enrollment and your recorded acknowledgements.',href:`${LMS_HOST}/lms/agreements`},
 ];
 const matched=choices.filter(choice=>role&&choice.roles.includes(role));const shown=matched.length?matched:choices;
 return <main className="mx-auto max-w-5xl px-4 py-8 text-slate-950"><p className="text-sm font-bold uppercase tracking-widest text-blue-800">Forms and signatures</p><h1 className="mt-3 text-3xl font-black">Your agreement workspace</h1><p className="mt-4 max-w-3xl leading-7">Open the agreement assigned to your role. Your complete terms and recorded signatures stay with the correct dashboard. Viewing this page does not sign a document.</p><nav aria-label="Agreement workspaces" className="mt-6 grid gap-4 md:grid-cols-3">{shown.map(choice=><article key={choice.href} className="rounded-2xl border bg-white p-5"><h2 className="text-xl font-black">{choice.title}</h2><p className="mt-3 text-sm leading-6">{choice.description}</p><Link href={choice.href} className="mt-4 inline-flex min-h-11 items-center rounded-xl bg-blue-800 px-4 font-bold text-white">Open full documents</Link></article>)}</nav>{role&&['admin','super_admin','org_admin'].includes(role)&&<Link href={`${ADMIN_HOST}/mou`} className="mt-6 inline-flex min-h-11 items-center rounded-xl border px-4 font-bold text-blue-900">Manage agreement records in Admin</Link>}<Link href="/apply" className="mt-6 block font-bold text-blue-800 underline">Return to applications</Link></main>;
}
