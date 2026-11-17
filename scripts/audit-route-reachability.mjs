#!/usr/bin/env node
/** Advisory route evidence. Never use absence of a static reference to authorize deletion. */
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const roots = [['root','app'],['marketing','apps/marketing/app'],['admin','apps/admin/app'],['lms','apps/lms/app'],['website-builder','apps/website-builder/app']]
  .filter(([,p]) => fs.existsSync(path.join(root,p)));
const ignored = new Set(['node_modules','.git','.next','.turbo','dist','build','coverage','artifacts','_archived','archive']);
function walk(dir,out=[]) {
  if(!fs.existsSync(dir)) return out;
  for(const ent of fs.readdirSync(dir,{withFileTypes:true})){
    if(ignored.has(ent.name)) continue;
    const p=path.join(dir,ent.name);
    if(ent.isDirectory()) walk(p,out);
    else if(ent.isFile() && /\.(ts|tsx|js|jsx|mjs|cjs|json)$/.test(ent.name)) out.push(p);
  }
  return out;
}
const relative = p => path.relative(root,p).split(path.sep).join('/');
function urlPath(base,file){
  const parts=path.relative(base,path.dirname(file)).split(path.sep)
    .filter(p => p && !/^\([^)]+\)$/.test(p) && !p.startsWith('@'));
  return '/'+parts.join('/');
}
const routes=roots.flatMap(([service,dir])=>{
  const base=path.join(root,dir);
  return walk(base).filter(f=>/^(page|route)\.(ts|tsx|js|jsx)$/.test(path.basename(f)))
    .map(f=>({service,kind:path.basename(f).startsWith('page.')?'page':'endpoint',url:urlPath(base,f),file:relative(f)}));
});
const texts=new Map();
for(const directory of ['app','apps','components','lib','packages','consolidation','scripts','tests','.github']){
  for(const file of walk(path.join(root,directory))){
    try {
      if(fs.statSync(file).size<=1024*1024) texts.set(relative(file),fs.readFileSync(file,'utf8'));
    } catch { /* unavailable references stay unverified */ }
  }
}
const byKey=new Map();
for(const r of routes){
  const key=[r.service,r.kind,r.url].join(':');
  byKey.set(key,[...(byKey.get(key)||[]),r.file]);
}
const duplicates=[...byKey].filter(([,files])=>files.length>1).map(([key,files])=>({key,files}));
const inventory=routes.map(r=>{
  const body=texts.get(r.file)||'';
  const redirectStub=r.kind==='page' && /\b(permanentRedirect|redirect)\s*\(/.test(body);
  const dynamic=/\[[^\]]+\]/.test(r.url);
  const inbound=[];
  if(!dynamic && r.url!=='/'){
    for(const [file,text] of texts){
      if(file!==r.file && text.includes(r.url)){
        inbound.push(file);
        if(inbound.length===20) break;
      }
    }
  }
  const category=redirectStub?'compatibility-redirect-needs-target-check':
    r.kind==='endpoint'?'endpoint-external-callers-unverified':
    dynamic?'dynamic-route-unverified':
    r.url==='/'?'entrypoint':
    inbound.length?'literal-reference-found':'no-literal-reference-NOT-proof-of-orphan';
  return {...r,category,staticReferenceSample:inbound};
});
const result={
  advisoryOnly:true,
  generatedAt:new Date().toISOString(),
  limitations:[
    'No static reference is NOT evidence a route is unused.',
    'Runtime clients, external backlinks, cron, webhooks, auth redirects and computed paths need independent checks.',
    'Same path in two deployed services is not a duplicate.',
    'Before any removal, prove canonical replacement, check production behavior and preserve auth/payment/student flows.'
  ],
  summary:{routeEntries:routes.length,pages:inventory.filter(r=>r.kind==='page').length,endpoints:inventory.filter(r=>r.kind==='endpoint').length,duplicates:duplicates.length,noLiteralReference:inventory.filter(r=>r.category==='no-literal-reference-NOT-proof-of-orphan').length},
  duplicates,inventory
};
const output=path.join(root,'artifacts/route-reachability-advisory.json');
fs.mkdirSync(path.dirname(output),{recursive:true});
fs.writeFileSync(output,JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify({output:relative(output),...result.summary,advisoryOnly:true},null,2));
if(duplicates.length) process.exitCode=1;
