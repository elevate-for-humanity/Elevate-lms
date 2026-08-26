import { afterEach, describe, expect, it, vi } from 'vitest';

const { execFileSync } = vi.hoisted(() => ({ execFileSync: vi.fn() }));
vi.mock('child_process', async (importOriginal) => ({
  ...(await importOriginal<typeof import('child_process')>()),
  execFileSync,
}));

import {
  resetVideoEncoderSelectionForTests,
  resolveBundledFont,
  selectVideoEncoder,
  videoEncoderArgs,
} from '@/lib/video/ffmpeg-runtime';

afterEach(() => {
  delete process.env.VIDEO_ENCODER;
  execFileSync.mockReset();
  resetVideoEncoderSelectionForTests();
});

describe('FFmpeg runtime selection', () => {
  it('selects NVENC only when a real encoder probe succeeds', () => {
    execFileSync.mockReturnValue('');
    expect(selectVideoEncoder()).toMatchObject({
      encoder: 'h264_nvenc',
      hardwareAccelerated: true,
    });
    expect(videoEncoderArgs(21)).toContain('p4');
  });

  it('falls back to libx264 when NVENC is unavailable', () => {
    execFileSync.mockReturnValue(' V....D libx264 H.264 encoder');
    expect(selectVideoEncoder()).toMatchObject({
      encoder: 'libx264',
      hardwareAccelerated: false,
    });
    expect(videoEncoderArgs(27)).toEqual([
      '-c:v',
      'libx264',
      '-preset',
      'fast',
      '-crf',
      '27',
    ]);
  });

  it('honors the explicit CPU override without probing FFmpeg', () => {
    process.env.VIDEO_ENCODER = 'cpu';
    expect(selectVideoEncoder().encoder).toBe('libx264');
    expect(execFileSync).not.toHaveBeenCalled();
  });

  it('resolves repository-bundled fonts without host-specific paths', () => {
    expect(resolveBundledFont('Bold')).toMatch(/public\/fonts\/Inter-Bold\.otf$/);
    expect(resolveBundledFont('Regular')).toMatch(/public\/fonts\/Inter-Regular\.otf$/);
    expect(resolveBundledFont('SemiBold')).toMatch(/public\/fonts\/Inter-SemiBold\.otf$/);
  });
});
