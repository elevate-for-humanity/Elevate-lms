import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
const execute = promisify(execFile);
const SAMPLE_RATE = 16000;
const CHUNK_BYTES = 55 * SAMPLE_RATE * 2;
const MAX_PCM_BYTES = 300 * SAMPLE_RATE * 2;
/** Decode trusted recording bytes locally; force an audio demuxer and disallow network protocols. */
export async function phoneSpeechChunks(bytes: Buffer): Promise<Buffer[]> {
  const format =
    bytes.toString('ascii', 0, 4) === 'RIFF' && bytes.toString('ascii', 8, 12) === 'WAVE'
      ? 'wav'
      : bytes.toString('ascii', 0, 4) === 'fLaC'
        ? 'flac'
        : bytes.toString('ascii', 0, 4) === 'OggS'
          ? 'ogg'
          : bytes.subarray(0, 4).equals(Buffer.from([0x1a, 0x45, 0xdf, 0xa3]))
            ? 'matroska'
            : bytes.toString('ascii', 0, 3) === 'ID3' ||
                (bytes[0] === 0xff && (bytes[1] & 0xe0) === 0xe0)
              ? 'mp3'
              : null;
  if (!format) throw Error('Unsupported recording format');
  const directory = await mkdtemp(join(tmpdir(), 'elevate-phone-speech-'));
  try {
    const input = join(directory, 'recording');
    await writeFile(input, bytes, { mode: 0o600 });
    const { stdout } = await execute(
      process.env.FFMPEG_BIN || 'ffmpeg',
      [
        '-hide_banner',
        '-loglevel',
        'error',
        '-nostdin',
        '-protocol_whitelist',
        'file,pipe',
        '-f',
        format,
        '-i',
        input,
        '-vn',
        '-threads',
        '1',
        '-ac',
        '1',
        '-ar',
        String(SAMPLE_RATE),
        '-acodec',
        'pcm_s16le',
        '-f',
        's16le',
        'pipe:1',
      ],
      { encoding: 'buffer', timeout: 8000, maxBuffer: MAX_PCM_BYTES },
    );
    if (!stdout.length) throw Error('Recording contains no audio');
    const chunks: Buffer[] = [];
    for (let offset = 0; offset < stdout.length; offset += CHUNK_BYTES)
      chunks.push(stdout.subarray(offset, offset + CHUNK_BYTES));
    return chunks;
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
}
