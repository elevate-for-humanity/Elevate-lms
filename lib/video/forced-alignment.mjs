import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {mkdtemp,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';
const execute=promisify(execFile);
export async function alignRecordedNarration(audioPath,text) {
 const directory=await mkdtemp(join(tmpdir(),'course-forced-alignment-'));
 try {
  const script=join(directory,'script.txt');await writeFile(script,text);
  const python=process.env.COURSE_ALIGNMENT_PYTHON || '/opt/course-alignment/bin/python';
  const worker=fileURLToPath(new URL('./forced-alignment.py',import.meta.url));
  const {stdout}=await execute(python,[worker,audioPath,script],{timeout:120000,maxBuffer:8*1024*1024});
  return JSON.parse(stdout);
 } finally {await rm(directory,{recursive:true,force:true});}
}
