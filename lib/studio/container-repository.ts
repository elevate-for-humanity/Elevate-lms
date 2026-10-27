import 'server-only';
import {getSecrets} from '@/lib/secrets';

type Node={name:string;path:string;type:'file'|'directory';children?:Node[]};
export function containerTree(paths:string[]):Node[]{
 const root:Node[]=[];const directories=new Map<string,Node>();
 for(const file of paths){
  if(!file||file.split('/').some(p=>p==='..'||p==='node_modules'||p==='.git'||p==='.next'||p.startsWith('.env')))continue;
  let children=root;const parts=file.split('/');
  for(let i=0;i<parts.length;i++){
   const path=parts.slice(0,i+1).join('/');
   if(i===parts.length-1){children.push({name:parts[i],path,type:'file'});continue;}
   let node=directories.get(path);
   if(!node){node={name:parts[i],path,type:'directory',children:[]};directories.set(path,node);children.push(node);}
   children=node.children!;
  }
 }
 const sort=(nodes:Node[])=>{nodes.sort((a,b)=>a.type!==b.type?(a.type==='directory'?-1:1):a.name.localeCompare(b.name));for(const node of nodes)if(node.children)sort(node.children);};sort(root);return root;
}
export async function readContainerRepository(path=''){
 const config=await getSecrets(['STUDIO_BROWSER_URL','STUDIO_BROWSER_SECRET']);
 const base=(config.STUDIO_BROWSER_URL??process.env.STUDIO_BROWSER_URL??'').replace(/\/$/,'');const secret=config.STUDIO_BROWSER_SECRET??process.env.STUDIO_BROWSER_SECRET;
 if(!base||!secret)throw Error('Studio container connection is not configured.');
 const call=async(endpoint:string,body?:Record<string,unknown>)=>{
  const response=await fetch(base+endpoint,{method:body?'POST':'GET',headers:{'content-type':'application/json','x-studio-browser-secret':secret},body:body?JSON.stringify(body):undefined,cache:'no-store',signal:AbortSignal.timeout(30000)});
  const result=await response.json();if(!response.ok)throw Error(`Studio container request failed (HTTP ${response.status}).`);return result;
 };
 const exec=async(args:string[])=>call('/workspace/exec',{command:'git',args,timeoutMs:20000});
 if(!path){
  let files=await exec(['ls-files','--cached','--others','--exclude-standard']);
  if(files.exitCode!==0){await call('/workspace/repository/sync',{repoUrl:'https://github.com/elevate-for-humanity/Elevate-lms.git',branch:'main'});files=await exec(['ls-files','--cached','--others','--exclude-standard']);}
  if(files.exitCode!==0)throw Error('Studio repository file list could not be read.');
  const branch=await exec(['rev-parse','--abbrev-ref','HEAD']);
  const tree=containerTree(String(files.stdout??'').split('\n'));
  if(!tree.length)throw Error('The Studio repository is empty. Connect the repository in Runtime + Terminal.');
  return {tree,repo:'elevate-for-humanity/Elevate-lms',branch:String(branch.stdout??'').trim(),source:'container'};
 }
 const file=await call('/workspace/file?path='+encodeURIComponent(path));
 if(Buffer.byteLength(file.content??'')>512*1024)throw Error('File exceeds the 512 KB editor limit.');
 // The runtime returns HTTP 500 when git cannot resolve a new, untracked file.
 // Its readable workspace buffer must still open; it has no committed blob SHA yet.
 const hash=await exec(['rev-parse','HEAD:'+path]).catch(()=>({exitCode:1,stdout:''}));
 return {...file,path,sha:hash.exitCode===0?String(hash.stdout??'').trim():'',repo:'elevate-for-humanity/Elevate-lms',branch:'main',source:'container'};
}
