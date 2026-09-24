import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { requireAdminClient } from '@/lib/supabase/admin';

export const runtime='nodejs';
export const dynamic='force-dynamic';
export const metadata={title:'Host Shop Subscription | Elevate',robots:{index:false,follow:false}};
const DASH='https://app.elevateforhumanity.org/host-shop/dashboard';

export default async function HostShopSubscriptionSuccess(){
 const supabase=await createClient(); const {data:{user}}=await supabase.auth.getUser();
 if(!user?.id) redirect('/login?redirect=/host-shop/subscription/success');
 const db=await requireAdminClient();
 const {data:partnership}=await db.from('host_shop_partnerships').select('status,billing_provider,provider_subscription_id').eq('user_id',user.id).maybeSingle();
 const active=partnership&&['active','approved'].includes(partnership.status||'');
 return <main className="min-h-[65vh] bg-slate-50 px-4 py-16"><div className={`mx-auto max-w-xl rounded-2xl border bg-white p-8 text-center shadow-sm ${active?'border-emerald-200':'border-amber-200'}`}><p className="text-sm font-black uppercase tracking-widest text-slate-600">{active?'Access active':'Activation pending'}</p><h1 className="mt-3 text-3xl font-black text-slate-950">{active?'Host Shop access is ready':'Payment confirmation is still processing'}</h1><p className="mt-4 leading-7 text-slate-600">{active?`Your Host Shop partnership is active through ${partnership.billing_provider||'Elevate billing'}.`:'Access activates automatically after the current billing provider confirms payment.'}</p><Link href={DASH} className="mt-8 inline-flex rounded-xl bg-slate-950 px-6 py-3 font-bold text-white">Open Host Shop Dashboard</Link></div></main>;
}
