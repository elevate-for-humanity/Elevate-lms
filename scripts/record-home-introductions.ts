import { mkdir, writeFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { HOME_INTRODUCTIONS } from '../content/home-introductions';
const recordings: Record<string, { text: string; src: string }> = {};
await mkdir('public/audio/home-introductions', { recursive: true });
for (const [key, text] of Object.entries(HOME_INTRODUCTIONS)) {
  const src = `/audio/home-introductions/${key}.mp3`;
  const result = spawnSync(
    'curl',
    [
      '--silent',
      '--show-error',
      '--fail-with-body',
      '--max-time',
      '60',
      'https://www.elevateforhumanity.org/api/voice/natural',
      '-H',
      'Content-Type: application/json',
      '--data-binary',
      '@-',
    ],
    { input: JSON.stringify({ text }), maxBuffer: 10 * 1024 * 1024 },
  );
  if (result.status !== 0 || result.stdout.length < 1000 || result.stdout[0] === 123)
    throw new Error(`Recording failed: ${key}`);
  await writeFile(`public${src}`, result.stdout);
  recordings[key] = { text, src };
  await writeFile(
    'content/home-introduction-recordings.json',
    JSON.stringify(recordings, null, 2) + '\n',
  );
  console.log(`Recorded ${key}`);
}
