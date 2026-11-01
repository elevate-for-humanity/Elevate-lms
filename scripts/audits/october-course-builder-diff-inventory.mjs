import {execFileSync} from 'node:child_process';
import {writeFileSync,mkdirSync} from 'node:fs';
const git=args=>execFileSync('git',args,{encoding:'utf8',maxBuffer:64*1024*1024});
const commits=git(['log','--since=2026-10-01T00:00:00-04:00','--until=2026-10-31T23:59:59-04:00','--format=%H']).trim().split('\n').filter(Boolean);
const match=/^(lib\/ultimate-course-builder\/|lib\/course-builder\/|lib\/course-factory\/|lib\/video\/|lib\/media\/|workers\/|scripts\/gcp\/|tests\/worker\/|\.github\/workflows\/.*course|Dockerfile\.ultimate-worker|supabase\/migrations\/)/;
const rows=[];
for(const sha of commits){
 const names=git(['diff-tree','--no-commit-id','--name-only','-r','-m',sha]).trim().split('\n').filter(name=>match.test(name));
 if(!names.length)continue;
 const changes=names.map(path=>{
  const patch=git(['show','--format=','--no-ext-diff','--unified=0',sha,'--',path]);
  const added=patch.split('\n').filter(line=>line.startsWith('+')&&!line.startsWith('+++')).length;
  const removed=patch.split('\n').filter(line=>line.startsWith('-')&&!line.startsWith('---')).length;
  return {path,added,removed};
 });
 rows.push({sha,changes});
}
mkdirSync('audit-output',{recursive:true});
writeFileSync('audit-output/october-course-builder-changes.json',JSON.stringify({period:'2026-10',commitsExamined:commits.length,relevantCommits:rows.length,changes:rows},null,2));
console.log(JSON.stringify({commitsExamined:commits.length,relevantCommits:rows.length,changedFiles:rows.reduce((n,r)=>n+r.changes.length,0)}));
