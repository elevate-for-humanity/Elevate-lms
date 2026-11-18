#!/usr/bin/env node
// One-shot, guarded QA credential provisioning for existing E2E workflow.
// Reads a chmod 600 JSON file; never logs passwords, keys, or tokens.
import {readFileSync, statSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
const repo='elevate-for-humanity/Elevate-lms';
const roles=['ADMIN','LEARNER','PROGRAM_HOLDER','HOST_SHOP','APPRENTICE','EMPLOYER','INSTRUCTOR','STAFF','CASE_MANAGER'];
const required=['E2E_SUPABASE_URL','E2E_SUPABASE_ANON_KEY','E2E_SUPABASE_SERVICE_ROLE_KEY',...roles.flatMap(r=>['E2E_'+r+'_EMAIL','E2E_'+r+'_PASSWORD'])];
const fail=code=>{console.error('QA_SETUP_BLOCKED:',code);process.exit(1)};
const [mode,path]=process.argv.slice(2);
if(!['--check','--apply'].includes(mode)||!path)fail('USAGE: --check|--apply /path/to/owner-only-qa-credentials.json');
let config;
try{
 const stat=statSync(path);
 if(!stat.isFile()||(stat.mode&0o077)!==0)fail('JSON_FILE_MUST_HAVE_CHMOD_600');
 config=JSON.parse(readFileSync(path,'utf8'));
}catch(error){fail(error.code==='ENOENT'?'FILE_NOT_FOUND':'INVALID_JSON_FILE')}
if(!config||typeof config!=='object'||Array.isArray(config))fail('INVALID_OBJECT');
const missing=required.filter(k=>typeof config[k]!=='string'||!config[k].trim());
if(missing.length)fail('MISSING: '+missing.join(','));
const unknown=Object.keys(config).filter(k=>!required.includes(k));
if(unknown.length)fail('UNEXPECTED_FIELDS: '+unknown.join(','));
let url;try{url=new URL(config.E2E_SUPABASE_URL)}catch{fail('INVALID_TEST_URL')}
const matched=/^([a-z]{20})\.supabase\.co$/.exec(url.hostname);
if(!matched||url.protocol!=='https:'||url.pathname!=='/'||url.search||url.hash||url.username||url.password)fail('ISOLATED_SUPABASE_URL_REQUIRED');
const prohibited=new Set(['cuxzzpsyufcewtmicszk','liwxpxhccbaxwylpnapo','vhulnzcfmlnsmoxixjco','ebnbeqdsuxygopetptlv','jlqrfwxuhpzmuivdxvvz','pztctqvzvsitcsvdolqr']);
if(prohibited.has(matched[1]))fail('PRODUCTION_OR_UNRELATED_PROJECT_FORBIDDEN');
const emails=roles.map(r=>config['E2E_'+r+'_EMAIL'].toLowerCase().trim());
if(new Set(emails).size!==roles.length||emails.some(e=>!/^\S+@\S+\.\S+$/.test(e)))fail('DISTINCT_DISPOSABLE_QA_IDENTITIES_REQUIRED');
if(roles.some(r=>config['E2E_'+r+'_PASSWORD'].length<12))fail('PASSWORD_MINIMUM_12_CHARACTERS');
for(const [key,expectedRole] of [['E2E_SUPABASE_ANON_KEY','anon'],['E2E_SUPABASE_SERVICE_ROLE_KEY','service_role']]){
 const value=config[key];
 if(value.startsWith('sb_'))continue;
 const parts=value.split('.');
 if(parts.length!==3)fail(key+'_NOT_VALID_JWT');
 let claims;try{claims=JSON.parse(Buffer.from(parts[1],'base64url').toString('utf8'))}catch{fail(key+'_INVALID_CLAIMS')}
 if(claims.role!==expectedRole)fail(key+'_ROLE_MISMATCH');
 if(typeof claims.iss==='string'&&claims.iss.includes('.supabase.co')&&!claims.iss.includes(matched[1]))fail(key+'_PROJECT_MISMATCH');
}
console.log('Validated private QA configuration for project '+matched[1]+'; distinct roles: '+roles.length);
if(mode==='--check'){console.log('No GitHub secrets changed. Project and account live access still require verification.');process.exit(0)}
const auth=spawnSync('gh',['auth','status'],{stdio:['ignore','pipe','pipe']});
if(auth.error||auth.status!==0)fail('GH_CLI_AUTHENTICATION_REQUIRED');
let count=0;
for(const key of required){
 const result=spawnSync('gh',['secret','set',key,'--repo',repo],{input:config[key],encoding:'utf8',stdio:['pipe','pipe','pipe'],timeout:30000});
 if(result.error||result.status!==0)fail('GITHUB_SECRET_WRITE_FAILED: '+key+' (previously configured: '+count+')');
 count++;
}
console.log('Configured '+count+' repository E2E secrets. Run the exact-head browser suite and validate real QA role logins.');
