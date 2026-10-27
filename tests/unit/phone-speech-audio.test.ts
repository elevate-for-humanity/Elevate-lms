import { execFileSync } from 'node:child_process';
import { describe, it, expect } from 'vitest';
import { phoneSpeechChunks } from '@/lib/phone/speech-audio';
let ffmpegAvailable = true;
try {
  execFileSync('ffmpeg', ['-version'], { stdio: 'ignore' });
} catch {
  ffmpegAvailable = false;
}
describe.skipIf(!ffmpegAvailable)('real recording conversion for transcription', () => {
  it.each(['wav', 'mp3'])('decodes %s into mono PCM speech chunks', async (format) => {
    const bytes = execFileSync('ffmpeg', [
      '-hide_banner',
      '-loglevel',
      'error',
      '-f',
      'lavfi',
      '-i',
      'sine=frequency=440:duration=0.25',
      '-f',
      format,
      'pipe:1',
    ]);
    const chunks = await phoneSpeechChunks(bytes);
    expect(chunks).toHaveLength(1);
    expect(chunks[0].length).toBeGreaterThanOrEqual(8000);
    expect(chunks[0].length % 2).toBe(0);
  });
  it('keeps every decoded sample when a voicemail spans more than one speech request', async () => {
    const bytes = execFileSync(
      'ffmpeg',
      [
        '-hide_banner',
        '-loglevel',
        'error',
        '-f',
        'lavfi',
        '-i',
        'sine=frequency=440:duration=56',
        '-ac',
        '1',
        '-ar',
        '16000',
        '-f',
        'wav',
        'pipe:1',
      ],
      { maxBuffer: 3_000_000 },
    );
    const chunks = await phoneSpeechChunks(bytes);
    expect(chunks).toHaveLength(2);
    expect(chunks.reduce((sum, chunk) => sum + chunk.length, 0)).toBe(56 * 16000 * 2);
  });
});
it('rejects non-audio input instead of letting a decoder inspect unrelated files', async () => {
  await expect(phoneSpeechChunks(Buffer.from('#EXTM3U\nfile:///etc/passwd'))).rejects.toThrow(
    'Unsupported recording format',
  );
});
