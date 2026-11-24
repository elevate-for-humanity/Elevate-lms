import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,readFileSync,writeFileSync,cpSync,mkdirSync,symlinkSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,dirname,basename,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {execFileSync} from 'node:child_process';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'../..');
function runtimeSourceCopies(dockerfile){
 const lines=dockerfile.split('\n');
 const finalStage=lines.findLastIndex(line=>/^FROM\s/.test(line));
 assert.ok(finalStage>=0,'Worker Dockerfile must declare its runtime stage');
 const copies=[];
 for(const line of lines.slice(finalStage+1).filter(line=>line.startsWith('COPY '))){
  const parts=line.slice(5).trim().split(/\s+/);
  if(parts[0].startsWith('--from=')){
   // This test reconstructs context-authored instructional sources, not the
   // independently smoke-tested SDK dependency stage. Do not treat its flag or
   // container path as a file in the repository.
   assert.equal(line,'COPY --from=laminar-deps /laminar-runtime /opt/elevate-laminar',
    'An unrecognized cross-stage source needs an explicit fixture contract');
   continue;
  }
  assert.ok(!parts.some(part=>part.startsWith('--')),'Unsupported context COPY option');
  const destination=parts.pop();
  assert.ok(parts.length&&destination,'Context COPY requires a source and destination');
  copies.push({sources:parts,destination});
 }
 return copies;
}

test('source reconstruction uses only final-stage context files and recognizes the isolated SDK copy',()=>{
 const dockerfile='FROM node:22 AS laminar-deps\nCOPY private-builder-config ./\nFROM approved-runtime\nCOPY --from=laminar-deps /laminar-runtime /opt/elevate-laminar\nCOPY lib/curriculum ./lib/curriculum\n';
 assert.deepEqual(runtimeSourceCopies(dockerfile),[{sources:['lib/curriculum'],destination:'./lib/curriculum'}]);
 assert.throws(()=>runtimeSourceCopies(dockerfile.replace('/laminar-runtime /opt/elevate-laminar','/other-source /app/lib/curriculum')),/unrecognized cross-stage/);
});

test('source-only worker image resolves registered and protected manufacturing sources without inherited source or configuration',()=>{
 const directory=mkdtempSync(join(tmpdir(),'elevate-worker-source-'));
 try {
  const dockerfile=readFileSync(join(root,'Dockerfile.ultimate-worker'),'utf8');
  for(const {sources,destination} of runtimeSourceCopies(dockerfile)){
   for(const source of sources){
    const target=join(directory,destination,sources.length>1||destination.endsWith('/')?basename(source):'');
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
  // Match the production image's server-only marker removal. Imports below use
  // only the final-stage context copies, so a missing new source cannot be
  // concealed by the pinned image's older application tree.
  assert.match(dockerfile,/RUN find lib -type f -name '\*\.ts' -exec sed -i/);
  const store=join(directory,'lib/lms/manufacturing-simulation-store.ts');
  writeFileSync(store,readFileSync(store,'utf8').replace(/^import 'server-only';$/gm,''));
  execFileSync(process.execPath,['--import=tsx','--input-type=module','-e',
   "import assert from 'node:assert/strict'; const authored=await import('./lib/ultimate-course-builder/instructional/authored-experience.ts'); const parser=await import('./lib/lms/manufacturing-simulation.ts'); const store=await import('./lib/lms/manufacturing-simulation-store.ts'); assert.equal(typeof authored.bindAuthoredLessonPreservation,'function'); assert.equal(typeof parser.parsePublicManufacturingSimulation,'function'); assert.equal(typeof store.loadManufacturingSimulationSpec,'function'); assert.equal(typeof store.loadManufacturingSimulationProgress,'function');"],
   {cwd:directory,encoding:'utf8',timeout:30000,env:{...process.env,TSX_TSCONFIG_PATH:join(directory,'tsconfig.json')}});
 } finally {rmSync(directory,{recursive:true,force:true});}
});
