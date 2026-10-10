import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

const names=['/elevate-pbx-wss-proxy','/pbx_asterisk_1'];
export function snapshot(output) {
  const records=[];
  for(const line of output.split(/\r?\n/)) {
    if(!names.some(name=>line.startsWith(name+' '))) continue;
    const fields=line.trim().split(/\s+/);
    if(fields.length!==4 || !/^[a-f0-9]{64}$/.test(fields[1]) || fields[2]!=='true' ||
       !/^\d{4}-\d\d-\d\dT[\d:.]+Z$/.test(fields[3]) || !Number.isFinite(Date.parse(fields[3]))) {
      throw new Error('container_identity_or_running_state_unverified');
    }
    records.push({name:fields[0],id:fields[1],running:true,startedAt:fields[3]});
  }
  records.sort((a,b)=>a.name.localeCompare(b.name));
  if(JSON.stringify(records.map(record=>record.name))!==JSON.stringify(names)) {
    throw new Error('expected_container_set_unverified');
  }
  return records;
}
if(process.argv[1] && import.meta.url===pathToFileURL(process.argv[1]).href) {
  try { console.log(JSON.stringify(snapshot(readFileSync(0,'utf8')))); }
  catch { console.error('PBX container snapshot unavailable');process.exitCode=1; }
}
