const MARKER='DIRECT_AUTHORING_DIAGNOSTIC_V1';
export function authoringProbeDecision(runs,now=Date.now()) {
 if(!Array.isArray(runs)||!Number.isFinite(now))throw Error('AUTHORING_PROBE_STATE_REQUIRED');
 const terminal=run=>Boolean(run.status?.completionTime)||run.status?.conditions?.some(c=>c.type==='Completed'&&['True','False'].includes(c.status));
 if(runs.some(run=>!terminal(run)))return 'active-execution-preserved';
 const recent=runs.some(run=>{
  const end=Date.parse(run.status?.completionTime??'');
  const args=run.spec?.template?.spec?.containers?.[0]?.args??[];
  return args.some(arg=>String(arg).includes(MARKER))&&Number.isFinite(end)&&end<=now&&now-end<10*60*1000;
 });
 return recent?'recent-probe-preserved':'probe';
}
