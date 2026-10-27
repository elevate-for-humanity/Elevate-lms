import {createRequire} from 'node:module';
import {dirname,join} from 'node:path';
const require=createRequire(import.meta.url);

/** Some constrained hosts can bind loopback but cannot enumerate interfaces.
 * Keep this compatibility boundary inside Remotion; never replace node:os or
 * invent interfaces. Fall back only for that exact system-call failure. */
export function loopbackOnUnavailableInterfaces(original) {
  let fallback;
  return (...args)=>{
    if(fallback)return fallback;
    try{return original(...args);}catch(error){
      if(error?.code!=='ERR_SYSTEM_ERROR' || error?.info?.syscall!=='uv_interface_addresses')throw error;
      fallback={host:'127.0.0.1',hostsToTry:['127.0.0.1']};
      return fallback;
    }
  };
}
export function installRemotionHostCompatibility() {
  // Pinned Remotion 4 renderer uses this CJS boundary for both static assets
  // and the off-thread media proxy. Do not alter global network discovery.
  const entry=require.resolve('@remotion/renderer');
  const ports=require(join(dirname(entry),'port-config.js'));
  if(ports.__elevateLoopbackCompatibility)return;
  if(typeof ports.getPortConfig!=='function')throw new Error('REMOTION_HOST_COMPATIBILITY_BOUNDARY_CHANGED');
  ports.getPortConfig=loopbackOnUnavailableInterfaces(ports.getPortConfig);
  Object.defineProperty(ports,'__elevateLoopbackCompatibility',{value:true});
}
