// pre-auth-registry: exempt - phoneActorResponse verifies the communications actor; destinations are confined to the actor's assigned workspace.
import {NextResponse} from 'next/server';
import {phoneActorResponse} from '@/lib/phone/actor-response';
export const dynamic='force-dynamic';
export async function POST(request:Request){
 const {actor:ctx,response}=await phoneActorResponse();
 if(response)return response;
 if(ctx.previewing)return NextResponse.json({error:'Phone previews cannot place calls.'},{status:403});
 const workspaceId=ctx.extension?.workspace_id;
 if(!workspaceId)return NextResponse.json({error:'No phone workspace is assigned.'},{status:403});
 const body=await request.json().catch(()=>({}));
 const number=String(body.extension||'').trim();
 if(!/^(0|[0-9]{3})$/.test(number))return NextResponse.json({error:'Enter extension 0 or a three-digit extension.'},{status:400});
 const {data:extension,error}=await ctx.db.from('communication_extensions')
  .select('id,extension,webrtc_provider,ring_mode,presence_status').eq('workspace_id',workspaceId).eq('extension',number).eq('enabled',true).maybeSingle();
 if(error)return NextResponse.json({error:'The extension directory is temporarily unavailable.'},{status:503});
 if(!extension)return NextResponse.json({error:'That extension is not enabled in your phone workspace.'},{status:404});
 if(extension.webrtc_provider!=='telnyx')return NextResponse.json({error:'That extension uses a different phone service. Its carrier connection must be verified before calling.'},{status:409});
 if(['offline','do_not_disturb'].includes(extension.ring_mode)||extension.presence_status==='busy')
  return NextResponse.json({error:'That extension is not available for a live call.'},{status:409});
 const {data:devices,error:deviceError}=await ctx.db.from('phone_webrtc_devices').select('sip_username')
  .eq('extension_id',extension.id).eq('provider','telnyx').eq('status','active').eq('connection_state','connected')
  .gte('last_seen_at',new Date(Date.now()-120000).toISOString()).order('last_seen_at',{ascending:false}).limit(1);
 if(deviceError)return NextResponse.json({error:'Phone reachability could not be verified.'},{status:503});
 const username=devices?.[0]?.sip_username;
 if(typeof username!=='string'||!/^[A-Za-z0-9._-]{1,128}$/.test(username))return NextResponse.json({error:'That person must open and connect their phone before receiving a call.'},{status:409});
 return NextResponse.json({destination:'sip:'+username+'@sip.telnyx.com',extension:number},{headers:{'Cache-Control':'no-store'}});
}
