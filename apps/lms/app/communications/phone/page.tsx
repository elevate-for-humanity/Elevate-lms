import type {Metadata} from 'next';
import {redirect} from 'next/navigation';
import {requireCommunicationActor} from '@/lib/communications/actor';
import {ProgramHolderPhone} from '@/components/program-holder/ProgramHolderPhone';
export const dynamic='force-dynamic';
export const metadata:Metadata={title:'Elevate Phone',robots:{index:false},manifest:'/communications/phone/manifest.webmanifest'};
export default async function PersonalPhonePage(){
 let actor: Awaited<ReturnType<typeof requireCommunicationActor>>;
 try {actor=await requireCommunicationActor({assignedPhone:true});} catch(error) {
  if(error instanceof Error && error.message==='COMMUNICATIONS_UNAUTHENTICATED') redirect('/login?redirect=%2Fcommunications%2Fphone');
  if(error instanceof Error && error.message==='COMMUNICATIONS_FORBIDDEN') redirect('/unauthorized');
  throw error;
 }
 const holder=actor.roles.some(role=>['program_holder','site_coordinator','provider_admin'].includes(role));
 const host=actor.roles.some(role=>['host_shop','host_shop_admin','partner'].includes(role));
 return <ProgramHolderPhone roleLabel={holder?'Program Holder':host?'Host Shop':'Team member'}
  calendarHref={holder?'/program-holder/meetings':host?'/host-shop/dashboard/schedule':'/lms/calendar'}
  emailHref={holder?'/program-holder/email':host?'/host-shop/email':'/communications/email'} />;
}
