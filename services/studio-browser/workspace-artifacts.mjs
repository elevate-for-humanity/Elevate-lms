import fs from 'node:fs/promises';
import path from 'node:path';
export const ARTIFACT_TYPES = {pdf:'application/pdf',docx:'application/vnd.openxmlformats-officedocument.wordprocessingml.document',xlsx:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',pptx:'application/vnd.openxmlformats-officedocument.presentationml.presentation',png:'image/png',jpg:'image/jpeg',jpeg:'image/jpeg',csv:'text/csv',txt:'text/plain',md:'text/markdown',json:'application/json',html:'text/html',ipynb:'application/x-ipynb+json',zip:'application/zip'};
export function artifactDirectory(root, owner) {
  if (!/^[a-zA-Z0-9_-]{1,128}$/.test(owner || '')) throw Error('artifact_owner_required');
  return path.resolve(root, 'studio-exports', owner);
}
async function checkedDirectory(root, owner) {
  const directory = artifactDirectory(root, owner);
  try { if (await fs.realpath(directory) !== directory) throw Error('invalid_artifact_path'); }
  catch (error) { if(error.code === 'ENOENT') return null; throw error; }
  return directory;
}
function filename(name) {
  if (typeof name !== 'string' || !/^[a-zA-Z0-9][a-zA-Z0-9._ -]{0,199}$/.test(name) || !ARTIFACT_TYPES[name.split('.').pop().toLowerCase()]) throw Error('invalid_artifact_name');
  return name;
}
export async function listArtifacts(root, owner) {
  const directory = await checkedDirectory(root, owner);
  if (!directory) return [];
  const files = [];
  for (const entry of await fs.readdir(directory, {withFileTypes:true})) {
    if (!entry.isFile()) continue;
    try { filename(entry.name); } catch { continue; }
    const stat = await fs.lstat(path.join(directory,entry.name));
    if (!stat.isFile() || stat.size > 64*1024*1024) continue;
    files.push({name:entry.name,size:stat.size,modifiedAt:stat.mtime.toISOString()});
  }
  return files.sort((a,b)=>b.modifiedAt.localeCompare(a.modifiedAt)).slice(0,200);
}
export async function readArtifact(root, owner, name) {
  filename(name);
  const directory = await checkedDirectory(root,owner);
  if (!directory) throw Error('artifact_not_found');
  const file = path.join(directory,name), stat = await fs.lstat(file);
  if (!stat.isFile() || stat.size > 64*1024*1024 || await fs.realpath(file) !== file) throw Error('invalid_artifact_file');
  return {bytes:await fs.readFile(file),contentType:ARTIFACT_TYPES[name.split('.').pop().toLowerCase()],name};
}

export async function createArtifact(root, owner, input, run) {
  const {format,title,content} = input || {};
  if (!['docx','pdf','pptx','xlsx'].includes(format) || typeof title !== 'string' || !title.trim() || title.length>200 || typeof content !== 'string' || !content.trim() || Buffer.byteLength(content)>1024*1024) throw Error('invalid_artifact_content');
  const directory=artifactDirectory(root,owner);
  await fs.mkdir(directory,{recursive:true});
  if(await checkedDirectory(root,owner)!==directory)throw Error('invalid_artifact_path');
  const {randomUUID}=await import('node:crypto');
  const name=(title.replace(/[^a-zA-Z0-9 -]/g,'').trim().slice(0,70)||'Document')+'-'+randomUUID()+'.'+format;
  try { await run(path.join(directory,name),JSON.stringify({format,title:title.trim(),content})); }
  catch (error) { await fs.rm(path.join(directory,name),{force:true}); throw error; }
  const artifact=await readArtifact(root,owner,name);
  return {name,size:artifact.bytes.length,contentType:artifact.contentType};
}
