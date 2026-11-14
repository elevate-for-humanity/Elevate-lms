import {loadRoleSecrets} from '../runtime-secrets.mjs';
const role=process.argv[2];
try{
  // Load credentials before importing the gateway's configuration. Unit files contain references only.
  Object.assign(process.env,await loadRoleSecrets(role));
  if(role==='gateway')await (await import('./ari-media.mjs')).serveGateway();
  else if(role==='turn')(await import('./turn-adapter.mjs')).serve();
}catch{
  // No SDK body, credential, caller input, or raw exception may reach journald.
  process.stderr.write('PARIS_RUNTIME_STARTUP_FAILED\n');process.exitCode=1;
}
