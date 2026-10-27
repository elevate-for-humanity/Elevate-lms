import { execFile } from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';
import { promisify } from 'node:util';

const execute = promisify(execFile);
const MAX_IMPORT_BYTES = 1024 * 1024 * 1024;

export function hasActiveMediaTransfer(downloads, now = Date.now()) {
  return [...downloads.values()].some(item =>
    ['downloading','normalizing','uploading'].includes(item.status) &&
    now - Date.parse(item.createdAt) < 60 * 60000);
}

async function probe(filePath) {
  const { stdout } = await execute('ffprobe', ['-v','error','-select_streams','v:0',
    '-show_entries','format=duration,size:stream=codec_name,width,height','-of','json',filePath],
    { timeout: 60000, maxBuffer: 1000000 });
  const result = JSON.parse(stdout);
  const stream = result.streams?.[0];
  const duration = Number(result.format?.duration);
  if (!stream || !Number.isFinite(duration) || duration <= 0 || !stream.width || !stream.height)
    throw new Error('DOWNLOADED_VIDEO_INVALID');
  return { codec: stream.codec_name, width: stream.width, height: stream.height,
    durationSeconds: duration, size: Number(result.format.size) };
}

/** Prepare the actual licensed download for the existing 1 GB importer.
 * A ProRes master is not an import-ready learner asset. Conversion does not
 * invent a license, repeat footage, crop the picture, or alter the duration. */
export async function prepareCourseVideoDownload(item) {
  if (!/\.(mov|mp4|m4v|webm)$/i.test(item.fileName)) return item;
  const source = await probe(item.filePath);
  item.sourceVideo = { ...source, fileName: item.fileName };
  let prepared = source;
  if (!['h264','vp8','vp9','av1'].includes(source.codec) || source.size > MAX_IMPORT_BYTES) {
    const output = path.join(path.dirname(item.filePath), `${item.id}-course-ready.mp4`);
    try {
      await execute('ffmpeg', ['-nostdin','-hide_banner','-loglevel','error','-y','-i',item.filePath,
        '-map','0:v:0','-map','0:a?', '-vf',
        'scale=1920:1080:force_original_aspect_ratio=decrease:force_divisible_by=2',
        '-c:v','libx264','-preset','fast','-crf','20','-c:a','aac','-movflags','+faststart',output],
        { timeout: 30 * 60000, maxBuffer: 1000000 });
      prepared = await probe(output);
      if (prepared.codec !== 'h264' || prepared.size <= 0 || prepared.size > MAX_IMPORT_BYTES ||
          Math.abs(prepared.durationSeconds-source.durationSeconds) > 0.1 ||
          Math.abs(prepared.width/prepared.height-source.width/source.height) > 0.01)
        throw new Error('DOWNLOADED_VIDEO_CONVERSION_VERIFICATION_FAILED');
      // Remove the temporary original only after independently probing the derivative.
      await fs.rm(item.filePath);
      item.filePath = output;
      item.fileName = `${path.parse(item.fileName).name}-course-ready.mp4`;
      item.contentType = 'video/mp4';
    } catch (error) {
      await fs.rm(output, { force: true });
      throw error;
    }
  }
  item.durationSeconds = prepared.durationSeconds;
  item.resolution = `${prepared.width}x${prepared.height}`;
  item.codec = prepared.codec;
  return item;
}
