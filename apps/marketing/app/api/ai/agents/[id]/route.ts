import {NextRequest,NextResponse} from 'next/server';
import {PARIS_IDENTITY} from '@/lib/ai/paris-identity';

const ALIASES=new Set(['paris','pars','ellie','lizzy','zora','zura','router']);
export async function GET(_request:NextRequest,{params}:{params:Promise<{id:string}>}) {
  const {id}=await params;
  if(!ALIASES.has(id.toLowerCase().replace(/^agent-/,'')))
    return NextResponse.json({error:'Agent not found'},{status:404});
  return NextResponse.json({agent:{id:'agent-paris',type:'PARIS',...PARIS_IDENTITY,status:'unverified'},
    compatibilityAlias:id,health:{status:'unverified',message:'Availability requires durable execution evidence.'}});
}

// Changing an in-memory registry flag cannot start, stop, or repair the AI.
export async function POST() {
  return NextResponse.json({error:'Synthetic agent status updates are no longer supported. Use the authenticated PARIS workflow controls.'},
    {status:405,headers:{Allow:'GET'}});
}
