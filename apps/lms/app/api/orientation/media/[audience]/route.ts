import { requireAdminClient } from '@/lib/supabase/admin';
import { resolvePortalPreviewSubject } from '@/lib/admin/portal-preview';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getSignedElevateMediaUrl } from '@/lib/storage/elevate-media-storage';
import { orientationKeyForGuide } from '@/lib/orientation/media-contract.mjs';
import orientations from '@/lib/orientation/dashboard-orientations.json';

export const runtime='nodejs';
export const dynamic='force-dynamic';
export async function GET(req:NextRequest,{params}:{params:Promise<{audience:string}>}) {
  const db=await createClient();
  const {data:{user}}=await db.auth.getUser();
  if(!user) {
    const admin=await requireAdminClient();
    const subject=await resolvePortalPreviewSubject(admin,null);
    if(!subject.previewing||!subject.userId)return NextResponse.json({error:'Sign in to view your orientation.'},{status:401});
  }
  const {audience}=await params;
  const format=req.nextUrl.searchParams.get('format')??'mp4';
  const key=orientationKeyForGuide(audience,format,orientations[audience as keyof typeof orientations]);
  if(!key)return NextResponse.json({error:'Orientation not found.'},{status:404});
  try {
    const signed=await getSignedElevateMediaUrl(key,3600);
    if(!signed)throw Error('ORIENTATION_STORAGE_UNAVAILABLE');
    if(format==='vtt') {
      const response=await fetch(signed,{cache:'no-store',signal:AbortSignal.timeout(15000)});
      if(!response.ok)throw Error('ORIENTATION_CAPTIONS_UNAVAILABLE');
      return new Response(await response.text(),{headers:{'Content-Type':'text/vtt; charset=utf-8','Cache-Control':'private, no-store'}});
    }
    return NextResponse.redirect(signed,{status:307,headers:{'Cache-Control':'private, no-store','Referrer-Policy':'no-referrer'}});
  }catch{return NextResponse.json({error:'Video is being prepared. Use the visual slides and transcript.'},{status:503});}
}
