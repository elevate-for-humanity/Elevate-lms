import { NextResponse } from 'next/server';
import { hydrateProcessEnv } from '@/lib/secrets';
import { requireAdminClient } from '@/lib/supabase/admin';
import { telnyxClient } from '@/lib/phone/telnyx';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  await hydrateProcessEnv();
  const db = await requireAdminClient();
  try {
    const required = ['TELNYX_API_KEY','TELNYX_PUBLIC_KEY','TELNYX_PHONE_NUMBER'] as const;
    const missing = required.filter((key) => !process.env[key]?.trim());
    if (missing.length) {
      return NextResponse.json({ service:'telnyx', ready:false, configured:false, missing }, { status:503, headers:{'Cache-Control':'no-store'} });
    }
    const { data: system } = await db.from('phone_systems').select('id,webrtc_connection_id,webrtc_connection_status').is('tenant_id',null).limit(1).maybeSingle();
    const { data: number } = system?.id
      ? await db.from('phone_numbers').select('e164,status,is_primary,source').eq('phone_system_id',system.id).eq('source','provider').eq('is_primary',true).maybeSingle()
      : { data:null };
    const client = await telnyxClient();
    let carrierNumberActive = false;
    for await (const item of client.phoneNumbers.list({ filter: { phone_number: process.env.TELNYX_PHONE_NUMBER! }, 'page[size]': 20 })) {
      if (item.phone_number === process.env.TELNYX_PHONE_NUMBER) { carrierNumberActive = true; break; }
    }
    const ready = Boolean(system?.webrtc_connection_id && system?.webrtc_connection_status==='configured' && number?.status==='active' && carrierNumberActive);
    return NextResponse.json({ service:'telnyx', ready, configured:true, carrierNumberActive, primaryNumberActive:number?.status==='active', webrtcConfigured:system?.webrtc_connection_status==='configured' }, { status:ready?200:503, headers:{'Cache-Control':'no-store'} });
  } catch {
    return NextResponse.json({ service:'telnyx', ready:false, configured:true, carrierNumberActive:false }, { status:503, headers:{'Cache-Control':'no-store'} });
  }
}
