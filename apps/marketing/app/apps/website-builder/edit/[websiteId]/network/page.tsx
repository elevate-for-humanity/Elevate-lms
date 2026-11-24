import { createClient } from '@/lib/supabase/server';
import { requireAdminClient } from '@/lib/supabase/admin';
import { canManageHostedWebsite } from '@/lib/websites/can-manage-hosted-website';
import { redirect,notFound } from 'next/navigation';
import { CLEANING_SITE } from '@/lib/cleaning/server';
import { TenantCleaningManager } from '@/components/tenant/TenantCleaningManager';
export const dynamic='force-dynamic';export const metadata={robots:{index:false,follow:false}};
export default async function CleaningNetworkPage({params}:{params:Promise<{websiteId:string}>}){
 const {websiteId}=await params;if(websiteId!==CLEANING_SITE)notFound();
 const session=await createClient();const {data:{user}}=await session.auth.getUser();if(!user)redirect('/login');
 const db=await requireAdminClient();if(!(await canManageHostedWebsite(db,websiteId,user.id)))notFound();
 return <TenantCleaningManager/>;
}
