import type {Metadata} from 'next';
import {redirect} from 'next/navigation';
import {requireCommunicationActor} from '@/lib/communications/actor';
import {ProgramHolderPhone} from '@/components/program-holder/ProgramHolderPhone';
export const dynamic='force-dynamic';
export const metadata:Metadata={title:'Elevate Phone',robots:{index:false},manifest:'/communications/phone/manifest.webmanifest'};
export default async function PersonalPhonePage(){
 try {await requireCommunicationActor();} catch(error) {
  if(error instanceof Error && error.message==='COMMUNICATIONS_UNAUTHENTICATED') redirect('/login?redirect=%2Fcommunications%2Fphone');
  if(error instanceof Error && error.message==='COMMUNICATIONS_FORBIDDEN') redirect('/unauthorized');
  throw error;
 }
 return <ProgramHolderPhone roleLabel="Team member" />;
}
