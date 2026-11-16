import { randomUUID } from 'node:crypto';
import { open, rename, unlink } from 'node:fs/promises';

// QA checkpoints contain temporary passwords. Never expose partially written
// JSON during recovery: write a private same-directory temporary file and
// atomically rename it over the previous complete checkpoint.
export async function writePrivateQaState(filePath, state) {
  const tmpPath = `${filePath}.${randomUUID()}.tmp`;
  let file;
  try {
    file = await open(tmpPath, 'wx', 0o600);
    await file.chmod(0o600);
    await file.writeFile(JSON.stringify(state, null, 2));
    await file.sync();
    await file.close();
    file = null;
    await rename(tmpPath, filePath);
  } finally {
    if (file) await file.close();
    await unlink(tmpPath).catch(error => {
      if (error.code !== 'ENOENT') throw error;
    });
  }
}
