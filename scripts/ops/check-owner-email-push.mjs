// User requested repair of incoming-mail alerts on her own registered devices.
import webpush from 'web-push';
import { createECDH } from 'node:crypto';
const base=process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/,'');
const key=process.env.SUPABASE_SERVICE_ROLE_KEY;
if(base!=='https://cuxzzpsyufcewtmicszk.supabase.co'||!key)throw Error('Expected production connection unavailable');
async function api(path,method='GET',body){
  const r=await fetch(base+'/rest/v1/'+path,{method,headers:{apikey:key,Authorization:`Bearer ${key}`,'Content-Type':'application/json',Prefer:'return=representation'},...(body?{body:JSON.stringify(body)}:{})});
  if(!r.ok)throw Error('Push configuration database request failed '+r.status);
  return r.status===204?null:await r.json();
}
const [publicKey,privateKey]=await Promise.all(['VAPID_PUBLIC_KEY','VAPID_PRIVATE_KEY'].map(p_key=>api('rpc/get_platform_secret','POST',{p_key})));
if(!publicKey||!privateKey)throw Error('Push keys unavailable');
const curve=createECDH('prime256v1');curve.setPrivateKey(Buffer.from(privateKey,'base64url'));
if(curve.getPublicKey().toString('base64url')!==publicKey)throw Error('Configured public/private push keys do not match');
const profiles=await api('profiles?email=in.(curvaturebodysculpting@gmail.com,elizabethpowell6262@gmail.com)&select=id');
const result={registered:0,accepted:0,expired:0,failed:[]};
for(const profile of profiles){
  const devices=await api(`push_subscriptions?user_id=eq.${profile.id}&active=eq.true&select=id,endpoint,p256dh,auth`);
  for(const device of devices){
    result.registered++;
    const endpoint=new URL(device.endpoint);
    if(endpoint.protocol!=='https:'||endpoint.port||endpoint.username||endpoint.password||!/^(fcm\.googleapis\.com|updates\.push\.services\.mozilla\.com|(?:[a-z0-9-]+\.)*push\.apple\.com|(?:[a-z0-9-]+\.)+notify\.windows\.com)$/.test(endpoint.hostname)) { result.failed.push({status:0});continue; }
    try{
      await webpush.sendNotification({endpoint:device.endpoint,keys:{p256dh:device.p256dh,auth:device.auth}},JSON.stringify({title:'Elevate email alerts',body:'Your incoming-mail notification connection was checked. Open Elevate to view your inbox.',url:'https://admin.elevateforhumanity.org/phone/email',tag:'owner-mail-connection-check-20261028'}),{TTL:300,timeout:5000,vapidDetails:{subject:'mailto:admin@elevateforhumanity.org',publicKey,privateKey}});
      result.accepted++;
    }catch(e){
      const status=Number(e.statusCode)||0;
      if(status===410){await api(`push_subscriptions?id=eq.${device.id}`,'PATCH',{active:false,updated_at:new Date().toISOString()});result.expired++;}
      else result.failed.push({status});
    }
  }
}
console.log(JSON.stringify(result));
