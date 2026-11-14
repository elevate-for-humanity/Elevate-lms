import { open } from 'node:fs/promises';

// QA checkpoints contain temporary passwords. Restrict existing files before
// writing too: writeFile's mode option alone only protects newly created files.
export async function writePrivateQaState(filePath, state) {
  const file = await open(filePath, 'w', 0o600);
  try {
    await file.chmod(0o600);
    await file.writeFile(JSON.stringify(state, null, 2));
  } finally {
    await file.close();
  }
}
