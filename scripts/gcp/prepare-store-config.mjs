import {pathToFileURL} from 'node:url';
import {google,loadGoogleConfig,validateConfig,configSecret,PROJECT} from './runtime-config.mjs';
import {completeStoreConfig,runtimeForGoogle} from './stage-web.mjs';
const fail=code=>{throw Error(code);};
// Preparation freezes the approved bootstrap subset under Store's own secret.
// It never removes inheritance or activates a merchant/runtime/database cutover.
export function prepareStoreConfig(store,marketing){
 validateConfig(store,'store');validateConfig(marketing,'marketing');
 const candidate=store.storeConfigurationIndependent===true?structuredClone(store):completeStoreConfig(store,marketing);
 runtimeForGoogle(candidate,{volumes:candidate.volumes});
 const e=candidate.runtimeEnvironment;
 if(e.SUPABASE_URL&&e.SUPABASE_URL!==e.NEXT_PUBLIC_SUPABASE_URL)fail('STORE_DATABASE_ALIAS_CONFLICT');
 if(!e.NEXTAUTH_SECRET)fail('STORE_AUTH_SECRET_MISSING');
 for(const p of ['QB','PAYPAL'])if(!e[p+'_CLIENT_ID']||!e[p+'_CLIENT_SECRET'])fail('STORE_'+p+'_IDENTITY_INCOMPLETE');
 if(e.QB_ENVIRONMENT!=='production')fail('STORE_QB_PRODUCTION_ENVIRONMENT_UNVERIFIED');
 if(!e.QB_WEBHOOK_VERIFIER_TOKEN&&!e.QUICKBOOKS_WEBHOOK_VERIFIER_TOKEN)fail('STORE_QB_WEBHOOK_VERIFIER_MISSING');
 if(e.QB_WEBHOOK_VERIFIER_TOKEN&&e.QUICKBOOKS_WEBHOOK_VERIFIER_TOKEN&&e.QB_WEBHOOK_VERIFIER_TOKEN!==e.QUICKBOOKS_WEBHOOK_VERIFIER_TOKEN)fail('STORE_QB_WEBHOOK_VERIFIER_CONFLICT');
 const normalize=v=>['live','production'].includes(v)?'production':v==='sandbox'?'sandbox':fail('STORE_PAYPAL_ENVIRONMENT_INVALID');
 if(!e.PAYPAL_ENVIRONMENT)fail('STORE_PAYPAL_ENVIRONMENT_MISSING');
 const mode=normalize(e.PAYPAL_ENVIRONMENT);
 if(e.PAYPAL_MODE&&normalize(e.PAYPAL_MODE)!==mode)fail('STORE_PAYPAL_ENVIRONMENT_CONFLICT');
 const base=mode==='production'?'https://api-m.paypal.com':'https://api-m.sandbox.paypal.com';
 if(e.PAYPAL_API_BASE&&e.PAYPAL_API_BASE!==base)fail('STORE_PAYPAL_API_BASE_CONFLICT');
 if(!e.PAYPAL_BILLING_WEBHOOK_ID)fail('STORE_PAYPAL_WEBHOOK_CONFIGURATION_INCOMPLETE');
 let callback;try{callback=new URL(e.QB_REDIRECT_URI);}catch{fail('STORE_QB_CALLBACK_MISSING');}
 // Keep an existing registered callback intact until its provider cutover passes.
 const callbackAccepted=callback.origin==='https://store.elevateforhumanity.org'&&callback.pathname==='/api/auth/quickbooks/callback'&&!callback.search&&!callback.hash&&!callback.username&&!callback.password;
 return {candidate,summary:{database:'existing-elevate',configuredPayPalEnvironment:mode,storeCallbackConfigured:callbackAccepted,configurationIndependent:store.storeConfigurationIndependent===true,merchantAccepted:false,sandboxTransactionVerified:false,applicationDeployed:false,trafficChanged:false}};
}
export async function prepareStoreConfiguration({run=google,apply=false}={}){
 const original=loadGoogleConfig('store',run);
 const marketing=original.storeConfigurationIndependent===true?{...original,component:'marketing'}:loadGoogleConfig('marketing',run);
 const {candidate,summary}=prepareStoreConfig(original,marketing);
 if(original.storeConfigurationIndependent===true){
  if(JSON.stringify(candidate)!==JSON.stringify(original))fail('STORE_INDEPENDENT_CONFIG_CANNOT_INHERIT');
  return {...summary,mode:'already-independent',configurationChanged:false};
 }
 const changed=JSON.stringify(candidate)!==JSON.stringify(original);
 if(!apply||!changed)return {...summary,mode:apply?'already-prepared':'validate-only',configurationChanged:false};
 if(JSON.stringify(loadGoogleConfig('store',run))!==JSON.stringify(original)||JSON.stringify(loadGoogleConfig('marketing',run))!==JSON.stringify(marketing))fail('STORE_CONFIG_CHANGED_DURING_PREPARATION');
 const receipt=JSON.parse(run(['secrets','versions','add',configSecret('store'),'--project='+PROJECT,'--data-file=-','--format=json'],JSON.stringify(candidate)));
 if(!/^projects\/(?:elegant-racer-299721|484736877039)\/secrets\/elevate-store-runtime-config\/versions\/\d+$/.test(receipt.name||''))fail('STORE_CONFIG_VERSION_UNVERIFIED');
 const readback=JSON.parse(run(['secrets','versions','access',receipt.name.split('/').pop(),'--secret='+configSecret('store'),'--project='+PROJECT]));
 if(JSON.stringify(readback)!==JSON.stringify(candidate)||JSON.stringify(loadGoogleConfig('store',run))!==JSON.stringify(candidate))fail('STORE_CONFIG_READBACK_FAILED');
 return {...summary,mode:'prepared',configurationChanged:true,configurationVersion:receipt.name,previousVersionsPreserved:true};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 try{console.log(JSON.stringify(await prepareStoreConfiguration({apply:process.env.STORE_CONFIG_PREPARE==='true'})));}
 catch(error){console.error(JSON.stringify({error:/^STORE_[A-Z_]+$/.test(error.message)?error.message:'STORE_CONFIG_PREPARATION_FAILED',applicationDeployed:false,trafficChanged:false}));process.exitCode=1;}
}
