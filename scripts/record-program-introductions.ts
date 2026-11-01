import { mkdir, writeFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { STATIC_PROGRAM_MAP, normalizePublicProgram } from '../data/programs/index';
import { buildProgramIntroduction } from '../lib/programs/program-introduction';

// Sequential requests and no automatic retries: don't amplify a speech-service outage.
const recordings: Record<string, { text: string; src: string }> = {};
await mkdir('public/audio/program-introductions', { recursive: true });
for (const raw of STATIC_PROGRAM_MAP.values()) {
  const program = normalizePublicProgram(raw);
  const text = buildProgramIntroduction(program);
  const src = `/audio/program-introductions/${program.slug}.mp3`;
  const response = spawnSync(
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
  if (response.status !== 0 || response.stdout.length < 1000 || response.stdout[0] === 123)
    throw new Error(`Recording failed for ${program.slug}: ${response.status}`);
  await writeFile(`public${src}`, response.stdout);
  recordings[program.slug] = { text, src };
  await writeFile(
    'content/program-introduction-recordings.json',
    JSON.stringify(recordings, null, 2) + '\n',
  );
  console.log(`Recorded ${program.slug}`);
}
