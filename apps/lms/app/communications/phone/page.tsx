import type {Metadata} from 'next';
import {requireCommunicationActor} from '@/lib/communications/actor';
import {ProgramHolderPhone} from '@/components/program-holder/ProgramHolderPhone';
export const dynamic='force-dynamic';
export const metadata:Metadata={title:'Elevate Phone',robots:{index:false}};
export default async function PersonalPhonePage(){
 await requireCommunicationActor();
 return <ProgramHolderPhone roleLabel="Team member" />;
}
