import { execFileSync } from 'child_process';
import fs from 'fs';
import path from 'path';

export type VideoEncoder = 'h264_nvenc' | 'libx264';
export type VideoEncoderPreference = 'auto' | 'nvenc' | 'cpu';

export interface VideoEncoderSelection {
  encoder: VideoEncoder;
  hardwareAccelerated: boolean;
  reason: string;
}

let cachedSelection: VideoEncoderSelection | undefined;

function preference(): VideoEncoderPreference {
  const configured = process.env.VIDEO_ENCODER?.trim().toLowerCase();
  if (configured === 'nvenc' || configured === 'cpu') return configured;
  return 'auto';
}

export function ffmpegSupportsNvenc(): boolean {
  try {
    // A compiled-in encoder is not enough: this probe also verifies that the
    // container can load the NVIDIA driver and open an NVENC session.
    execFileSync(
      'ffmpeg',
      [
        '-hide_banner',
        '-loglevel',
        'error',
        '-f',
        'lavfi',
        '-i',
        'color=size=16x16:rate=1',
        '-frames:v',
        '1',
        '-c:v',
        'h264_nvenc',
        '-f',
        'null',
        '-',
      ],
      {
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'pipe'],
        timeout: 10_000,
      },
    );
    return true;
  } catch {
    return false;
  }
}

export function selectVideoEncoder(): VideoEncoderSelection {
  if (cachedSelection) return cachedSelection;

  const requested = preference();
  const nvencAvailable = requested !== 'cpu' && ffmpegSupportsNvenc();
  if (nvencAvailable) {
    cachedSelection = {
      encoder: 'h264_nvenc',
      hardwareAccelerated: true,
      reason:
        requested === 'nvenc' ? 'NVENC explicitly requested and available' : 'NVENC detected',
    };
  } else {
    cachedSelection = {
      encoder: 'libx264',
      hardwareAccelerated: false,
      reason:
        requested === 'cpu'
          ? 'CPU encoding explicitly requested'
          : requested === 'nvenc'
            ? 'NVENC requested but unavailable; using safe CPU fallback'
            : 'NVENC unavailable; using safe CPU fallback',
    };
  }
  return cachedSelection;
}

/** FFmpeg arguments with comparable quality settings for GPU and CPU encoders. */
export function videoEncoderArgs(crf = 22): string[] {
  const { encoder } = selectVideoEncoder();
  if (encoder === 'h264_nvenc') {
    return [
      '-c:v',
      encoder,
      '-preset',
      'p4',
      '-tune',
      'hq',
      '-rc',
      'vbr',
      '-cq',
      String(crf),
    ];
  }
  return ['-c:v', encoder, '-preset', 'fast', '-crf', String(crf)];
}

export function videoEncoderShellArgs(crf = 22): string {
  return videoEncoderArgs(crf).join(' ');
}

export function resolveBundledFont(variant: 'Bold' | 'Regular' | 'SemiBold'): string {
  const candidates = [
    process.env.VIDEO_FONT_DIR
      ? path.resolve(process.env.VIDEO_FONT_DIR, `Inter-${variant}.otf`)
      : '',
    path.resolve(process.cwd(), 'public', 'fonts', `Inter-${variant}.otf`),
  ].filter(Boolean);
  const resolved = candidates.find((candidate) => fs.existsSync(candidate));
  if (!resolved) {
    throw new Error(
      `Bundled font Inter-${variant}.otf was not found. Ensure public/fonts is included in the runtime image.`,
    );
  }
  return resolved;
}

export function videoRuntimeDiagnostics() {
  const selection = selectVideoEncoder();
  return {
    ...selection,
    requestedEncoder: preference(),
    fonts: {
      bold: resolveBundledFont('Bold'),
      regular: resolveBundledFont('Regular'),
      semiBold: resolveBundledFont('SemiBold'),
    },
  };
}

/** Tests only: encoder selection is intentionally cached for each worker process. */
export function resetVideoEncoderSelectionForTests(): void {
  cachedSelection = undefined;
}
