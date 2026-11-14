import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,readFileSync,cpSync,mkdirSync,symlinkSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,dirname,basename,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {execFileSync} from 'node:child_process';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'../..');
test('source-only worker image resolves registered instructional sources without inherited source or configuration',()=>{
 const directory=mkdtempSync(join(tmpdir(),'elevate-worker-source-'));
 try {
  const dockerfile=readFileSync(join(root,'Dockerfile.ultimate-worker'),'utf8');
  for(const line of dockerfile.split('\n').filter(line=>line.startsWith('COPY '))){
   const parts=line.slice(5).trim().split(/\s+/);
   const destination=parts.pop();
   for(const source of parts){
    const target=join(directory,destination,parts.length>1||destination.endsWith('/')?basename(source):'');
    mkdirSync(dirname(target),{recursive:true});
    cpSync(join(root,source),target,{recursive:true});
   }
  }
  symlinkSync(join(root,'node_modules'),join(directory,'node_modules'),'dir');
  cpSync(join(root,'packages/ultimate-course-worker/package.json'),join(directory,'package.json'));
  const output=execFileSync(process.execPath,['--import=tsx','--input-type=module','-e',
   "import {registeredInstructionalSources} from './lib/ultimate-course-builder/credential/registered-instructional-sources.ts'; console.log(JSON.stringify(['barber-apprenticeship','esthetician-apprenticeship','nail-technician-apprenticeship'].map(program=>({program,count:registeredInstructionalSources(program).length}))));"],
   {cwd:directory,encoding:'utf8',timeout:30000,env:{...process.env,TSX_TSCONFIG_PATH:join(directory,'tsconfig.json')}});
  const programs=JSON.parse(output.trim());
  assert.equal(programs.length,3);
  assert.ok(programs.every(program=>program.count>0),'Every registered program must retain its instructional sources');
 } finally {rmSync(directory,{recursive:true,force:true});}
});
