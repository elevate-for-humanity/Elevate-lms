// Compare actual restored bytes before a nonempty Studio workspace can move.
// Only aggregate digests/counts leave the runtimes; file names and contents do not.
export async function workspaceContentProof(root) {
  const fs = await import('node:fs/promises');
  const {constants} = await import('node:fs');
  const path = await import('node:path');
  const {createHash} = await import('node:crypto');
  const excluded = new Set(['node_modules', '.next', '.cache', '.turbo', '.pnpm-store', '__pycache__']);
  const hash = value => createHash('sha256').update(value).digest('hex');
  const scan = async () => {
    const entries = []; let bytes = 0;
    if ((await fs.lstat(root)).isSymbolicLink()) throw Error('STUDIO_WORKSPACE_SYMLINK_REFUSED');
    const walk = async directory => {
      for (const name of (await fs.readdir(path.join(root, directory))).sort()) {
        if (excluded.has(name)) continue;
        if (directory === '.git/objects/pack' && /^tmp_(?:pack|idx)_/.test(name)) continue;
        const relative = directory ? directory + '/' + name : name;
        const stat = await fs.lstat(path.join(root, relative));
        if (!stat.isFile() && !stat.isDirectory()) throw Error('STUDIO_WORKSPACE_SPECIAL_FILE_REFUSED');
        const type = stat.isFile() ? 'file' : 'directory';
        entries.push({name: relative, type, mode: stat.mode & 0o777, size: type === 'file' ? stat.size : 0,
          mtime: stat.mtimeMs, ctime: stat.ctimeMs});
        if (type === 'file') bytes += stat.size;
        if (entries.length > 50000 || bytes > 1024 * 1024 * 1024) throw Error('STUDIO_WORKSPACE_LIMIT_EXCEEDED');
        if (type === 'directory') await walk(relative);
      }
    };
    await walk(''); return {entries, bytes};
  };
  const before = await scan(), tree = createHash('sha256');
  for (const entry of before.entries) {
    tree.update(JSON.stringify([entry.name, entry.type, entry.mode, entry.size]) + '\n');
    if (entry.type === 'file') {
      const handle = await fs.open(path.join(root, entry.name), constants.O_RDONLY | constants.O_NOFOLLOW);
      try {
        const stat = await handle.stat();
        if (!stat.isFile() || stat.size !== entry.size || stat.mtimeMs !== entry.mtime || stat.ctimeMs !== entry.ctime)
          throw Error('STUDIO_WORKSPACE_CHANGED_DURING_PROOF');
        const file = createHash('sha256');
        for await (const chunk of handle.createReadStream({autoClose: false})) file.update(chunk);
        tree.update(file.digest('hex') + '\n');
      } finally { await handle.close(); }
    }
  }
  if (hash(JSON.stringify(before)) !== hash(JSON.stringify(await scan()))) throw Error('STUDIO_WORKSPACE_CHANGED_DURING_PROOF');
  return {files: before.entries.filter(e => e.type === 'file').length,
    directories: before.entries.filter(e => e.type === 'directory').length,
    bytes: before.bytes, digest: tree.digest('hex'), excludedDependencyCaches: true};
}

export const WORKSPACE_PRESERVATION_PROBE = `
(async()=>{
 const {WorkspaceCheckpoint}=await import('/app/workspace-checkpoint.mjs');
 const {GcsWorkspaceObjects}=await import('/app/gcs-workspace-objects.mjs');
 const prefix=process.env.STUDIO_WORKSPACE_OBJECT_PREFIX||'workspaces/admin-repository-v1';
 const objects=new GcsWorkspaceObjects({prefix});
 const store=new WorkspaceCheckpoint({root:process.cwd(),objects,secret:process.env.STUDIO_BROWSER_SECRET});
 const before=await objects.readManifest();
 if(!before)throw Error('checkpoint_missing');
 const manifest=store.decodeManifest(before.data);
 const proof=await (${workspaceContentProof.toString()})(process.cwd());
 const after=await objects.readManifest();
 if(!after||after.generation!==before.generation||!after.data.equals(before.data))throw Error('checkpoint_changed');
 console.log(JSON.stringify({...proof,generation:String(before.generation),archiveDigest:manifest.digest,authenticatedManifest:true,canonicalWorkspace:prefix==='workspaces/admin-repository-v1'}));
})().catch(()=>{console.error('STUDIO_WORKSPACE_PRESERVATION_PROBE_FAILED');process.exitCode=1;});`;

export async function verifyStudioWorkspacePreservation({sourceUrl, candidateUrl, secret, expectedFiles, request = fetch}) {
  for (const value of [sourceUrl, candidateUrl]) {
    const url = new URL(value);
    if (url.protocol !== 'https:' || !url.hostname.endsWith('.run.app') || url.username || url.password || url.search || url.hash)
      throw Error('STUDIO_WORKSPACE_ENDPOINT_UNVERIFIED');
  }
  if (sourceUrl === candidateUrl || !Number.isSafeInteger(expectedFiles) || expectedFiles < 1 || typeof secret !== 'string' || secret.length < 16)
    throw Error('STUDIO_WORKSPACE_PRESERVATION_IDENTITY_REQUIRED');
  const call = async (base, path, body) => {
    const response = await request(new URL(path, base), {method: 'POST', redirect: 'error',
      headers: {'content-type': 'application/json', 'x-studio-browser-secret': secret},
      body: JSON.stringify(body), signal: AbortSignal.timeout(150000)});
    if (!response.ok) throw Error('STUDIO_WORKSPACE_PRESERVATION_REQUEST_FAILED');
    return response.json();
  };
  // Checkpointing is the existing encrypted persistence path, never file deletion
  // or command replay. A conflicting writer fails its generation precondition.
  const saved = await call(sourceUrl, '/workspace/checkpoint', {});
  if (saved.persistent !== true || !/^[1-9]\d*$/.test(String(saved.generation)))
    throw Error('STUDIO_WORKSPACE_CHECKPOINT_UNVERIFIED');
  const probe = async base => {
    const result = await call(base, '/workspace/exec', {command: 'node', args: ['-e', WORKSPACE_PRESERVATION_PROBE], timeoutMs: 120000});
    if (result.exitCode !== 0 || typeof result.stdout !== 'string' || result.stdout.length > 2048)
      throw Error('STUDIO_WORKSPACE_PRESERVATION_PROBE_FAILED');
    const proof = JSON.parse(result.stdout);
    if (proof.files !== expectedFiles || !Number.isSafeInteger(proof.directories) || proof.directories < 0 ||
        !Number.isSafeInteger(proof.bytes) || proof.bytes < 0 || !/^[a-f0-9]{64}$/.test(proof.digest || '') ||
        !/^[a-f0-9]{64}$/.test(proof.archiveDigest || '') || proof.generation !== String(saved.generation) ||
        proof.authenticatedManifest !== true || proof.excludedDependencyCaches !== true || proof.canonicalWorkspace !== true)
      throw Error('STUDIO_WORKSPACE_PRESERVATION_UNVERIFIED');
    return proof;
  };
  const before = await probe(sourceUrl);
  const restored = await probe(candidateUrl);
  const after = await probe(sourceUrl);
  if (JSON.stringify(before) !== JSON.stringify(restored) || JSON.stringify(before) !== JSON.stringify(after))
    throw Error('STUDIO_WORKSPACE_PRESERVATION_MISMATCH');
  return {passed: true, ...restored, sourceUnchanged: true, restoredBytesVerified: true, filesDeleted: false};
}
