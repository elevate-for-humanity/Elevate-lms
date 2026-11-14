import { NextResponse } from 'next/server';
import { PARIS_IDENTITY } from '@/lib/ai/paris-identity';

export async function GET() {
  return NextResponse.json({agents:[{id:'agent-paris',type:'PARIS',name:'PARIS',
    capabilities:PARIS_IDENTITY.capabilities,combinedFrom:PARIS_IDENTITY.combinedFrom,
    status:'unverified'}],summary:{total:1,health:'Requires live execution evidence'}});
}
