// Provider-only readiness: never create charges, sessions, webhooks or secrets.
export async function verifyStripeProvider({component, env, request=fetch,
 expectedAccount='acct_1OKSVyH4a2yrVOt5'}) {
 if(!['marketing','admin','lms'].includes(component))throw Error('Managed Stripe component required');
 const key=env.STRIPE_SECRET_KEY?.trim();
 if(!key)return {component,ready:false,keyConfigured:false,error:'stripe_key_missing'};
 if(!/^(?:sk|rk)_live_/.test(key))return {component,ready:false,keyConfigured:true,liveKey:false,error:'stripe_live_key_required'};
 try {
  const response=await request('https://api.stripe.com/v1/account',{
   method:'GET',headers:{Authorization:'Bearer '+key},redirect:'error',signal:AbortSignal.timeout(15000),
  });
  if(!response.ok)return {component,ready:false,providerAuthenticated:false,httpStatus:response.status,error:'stripe_account_read_unavailable'};
  const account=await response.json();
  const accountMatched=Boolean(expectedAccount)&&account?.id===expectedAccount;
  const chargesEnabled=account?.charges_enabled===true;
  const payoutsEnabled=account?.payouts_enabled===true;
  return {component,ready:accountMatched&&chargesEnabled&&payoutsEnabled,providerAuthenticated:true,
   httpStatus:response.status,accountMatched,chargesEnabled,payoutsEnabled};
 } catch {
  return {component,ready:false,providerAuthenticated:false,error:'stripe_account_verification_unavailable'};
 }
}
