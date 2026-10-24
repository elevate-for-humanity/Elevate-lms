import {AsyncLocalStorage} from 'node:async_hooks';
const scope = new AsyncLocalStorage();
export function reportCourseProgress(phase, completed = 0, total = null) {
  return scope.getStore()?.report(phase, completed, total);
}
export function courseProgressSignal() { return scope.getStore()?.signal; }
export function createCourseProgressWatch({idleMs=600000,now=Date.now,onProgress=async()=>{},onStall=async()=>{},schedule=setInterval,cancel=clearInterval}={}) {
  const controller=new AbortController();
  let last=now(),lastKey='',snapshot={phase:'preparing',completed:0,total:null,at:new Date(last).toISOString()},disposed=false,checking=false;
  let reject;
  const stalled=new Promise((_,r)=>{reject=r;});stalled.catch(()=>{});
  let writes=Promise.resolve(),lastWrite=0;
  const report=(phase,completed=0,total=null)=>{
    if(controller.signal.aborted)throw controller.signal.reason;
    const key=phase+':'+completed;
    if(key===lastKey)return;
    lastKey=key;last=now();snapshot={phase,completed,total,at:new Date(last).toISOString()};
    if(last-lastWrite>=10000||completed===total){lastWrite=last;const saved={...snapshot};writes=writes.catch(()=>{}).then(()=>{if(!disposed&&!controller.signal.aborted)return onProgress(saved);});writes.catch(()=>{});}
  };
  const check=async()=>{
    if(disposed||checking||now()-last<idleMs)return;
    checking=true;
    const error=new Error('ULTIMATE_PROGRESS_STALLED:'+snapshot.phase);
    // Cancellation must not depend on a reachable database. The fenced state
    // transition remains best effort; an expired lease is recovered separately.
    controller.abort(error);reject(error);
    try {await onStall({...snapshot,idleMs:now()-last});}
    catch(e){error.cause=e;}
  };
  const timer=schedule(()=>{void check();},5000);
  return {report,check,signal:controller.signal,run:work=>scope.run({report,signal:controller.signal},work),race:work=>Promise.race([work,stalled]),dispose(){disposed=true;cancel(timer);if(!controller.signal.aborted)controller.abort(new Error('ULTIMATE_PROGRESS_CONTEXT_CLOSED'));},snapshot:()=>({...snapshot})};
}
