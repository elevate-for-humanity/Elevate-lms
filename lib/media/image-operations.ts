import 'server-only';
import sharp from 'sharp';
import { aiEditImage, aiDescribeImage } from '@/lib/ai/ai-service';
import { getElevateMediaStorageConfig } from '@/lib/storage/elevate-media-storage';
import type { ImageEditRequest } from '@/lib/paris/media-studio/types';

const MAX_BYTES = 20 * 1024 * 1024;
const pngUrl = (bytes: Buffer) => `data:image/png;base64,${bytes.toString('base64')}`;

/** Only known media origins; credentials and redirects never reach arbitrary hosts. */
export async function readImageBytes(source: string): Promise<Buffer> {
  const inline = source.match(/^data:image\/(png|jpeg|webp);base64,([A-Za-z0-9+/=]+)$/);
  if (inline) {
    if (inline[2].length > MAX_BYTES * 4 / 3 + 4) throw new Error('IMAGE_SOURCE_TOO_LARGE');
    return Buffer.from(inline[2], 'base64');
  }
  const url = new URL(source);
  const hosts = new Set(['images.pexels.com', 'cdn.pixabay.com', 'www.elevateforhumanity.org']);
  // Reuse the uploader's canonical media URL and its established S3/R2 names.
  // Keep the newer explicit origin settings compatible with existing callers.
  for (const configured of [getElevateMediaStorageConfig().publicUrl, process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SITE_URL, process.env.MEDIA_PUBLIC_BASE_URL, process.env.B2_PUBLIC_BASE_URL]) {
    if (configured) hosts.add(new URL(configured).hostname);
  }
  if (url.protocol !== 'https:' || url.username || url.password || url.port || !hosts.has(url.hostname)) throw new Error('IMAGE_SOURCE_NOT_ALLOWED');
  const response = await fetch(url, {redirect: 'error', signal: AbortSignal.timeout(30_000)});
  if (!response.ok) throw new Error(`IMAGE_DOWNLOAD_FAILED:${response.status}`);
  if (Number(response.headers.get('content-length')) > MAX_BYTES) throw new Error('IMAGE_SOURCE_TOO_LARGE');
  const chunks: Uint8Array[] = [];
  let size = 0;
  if (!response.body) throw new Error('IMAGE_SOURCE_EMPTY');
  const reader = response.body.getReader();
  try {
    for (;;) {
      const {done, value} = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > MAX_BYTES) throw new Error('IMAGE_SOURCE_TOO_LARGE');
      chunks.push(value);
    }
  } finally { await reader.cancel().catch(() => undefined); }
  return Buffer.concat(chunks);
}

export async function optimizeImageBytes(source: string, options: {width?:number;height?:number;quality?:number;format?:'webp'|'jpeg'|'png'} = {}): Promise<string> {
  if (!Object.keys(options).length) return source;
  for (const size of [options.width, options.height]) if (size !== undefined && (!Number.isInteger(size) || size < 1 || size > 8192)) throw new Error('IMAGE_DIMENSION_INVALID');
  if (options.quality !== undefined && (!Number.isInteger(options.quality) || options.quality < 1 || options.quality > 100)) throw new Error('IMAGE_QUALITY_INVALID');
  const format = options.format || 'webp';
  const output = await sharp(await readImageBytes(source), {limitInputPixels: 40_000_000})
    .rotate().resize({width:options.width,height:options.height,fit:'inside',withoutEnlargement:true})
    .toFormat(format, {quality: options.quality ?? 80}).toBuffer();
  return `data:image/${format};base64,${output.toString('base64')}`;
}

export async function editImageBytes(source: string, request: ImageEditRequest): Promise<string> {
  const bytes = await readImageBytes(source);
  const image = sharp(bytes, {limitInputPixels: 40_000_000}).rotate();
  if (request.action === 'crop') {
    const area = request.cropArea;
    if (!area || !Object.values(area).every(Number.isInteger) || area.x < 0 || area.y < 0 || area.width < 1 || area.height < 1) throw new Error('IMAGE_CROP_REQUIRED');
    return pngUrl(await image.extract({left:area.x,top:area.y,width:area.width,height:area.height}).png().toBuffer());
  }
  if (request.action === 'upscale') {
    const metadata = await image.metadata();
    const scale = request.scale ?? 2;
    if (![2,4].includes(scale) || !metadata.width || !metadata.height || metadata.width * metadata.height * scale * scale > 40_000_000) throw new Error('IMAGE_SCALE_INVALID');
    return pngUrl(await image.resize({width:metadata.width*scale,height:metadata.height*scale,fit:'fill'}).png().toBuffer());
  }
  if (request.action === 'filter') {
    const filter = request.parameters?.filter;
    if (filter === 'grayscale') image.grayscale();
    else if (filter === 'sharpen') image.sharpen();
    else if (filter === 'blur') image.blur();
    else throw new Error('IMAGE_FILTER_INVALID');
    return pngUrl(await image.png().toBuffer());
  }
  const prompts: Record<string,string> = {
    remove_background: 'Remove the entire background. Preserve the foreground subject accurately. Output a transparent PNG.',
    replace_background: `Replace only the background with: ${request.backgroundPrompt || ''}. Preserve the subject.`,
    change_color: `Change ${request.sourceColor || 'the specified object color'} to ${request.targetColor || ''}. Preserve everything else.`,
    add_text: `Add this exact text: ${request.text || ''}. Preserve the image.`,
    add_watermark: `Add this watermark: ${request.text || ''}. Preserve the image.`,
    add_overlay: `Apply this overlay while preserving the image: ${String(request.parameters?.prompt || '')}`,
    style_transfer: `Restyle the image as: ${String(request.parameters?.prompt || '')}. Preserve its subject and composition.`,
  };
  const prompt = prompts[request.action];
  if (!prompt) throw new Error('IMAGE_EDIT_ACTION_INVALID');
  if ((request.action === 'replace_background' && !request.backgroundPrompt) ||
      (request.action === 'change_color' && !request.targetColor) ||
      (['add_text','add_watermark'].includes(request.action) && !request.text) ||
      (['add_overlay','style_transfer'].includes(request.action) && !request.parameters?.prompt)) throw new Error('IMAGE_EDIT_PARAMETERS_REQUIRED');
  const normalized = await image.png().toBuffer();
  const results = await aiEditImage({bytes:normalized,mime:'image/png',prompt,transparent:request.action==='remove_background'});
  const result = results[0];
  if (result?.b64Json) {
    const output = Buffer.from(result.b64Json,'base64');
    const decoded = sharp(output, {limitInputPixels:40_000_000});
    const metadata = await decoded.metadata();
    if (!metadata.width || !metadata.height || output.equals(normalized)) throw new Error('IMAGE_EDIT_UNCHANGED_OUTPUT');
    if (request.action === 'remove_background') {
      const stats = await decoded.stats();
      if (!metadata.hasAlpha || (stats.channels[3]?.min ?? 255) === 255) throw new Error('IMAGE_EDIT_BACKGROUND_NOT_TRANSPARENT');
    }
    return pngUrl(output);
  }
  throw new Error('IMAGE_EDIT_EMPTY_RESPONSE');
}

export async function describeImageBytes(source: string): Promise<string> {
  const bytes = await sharp(await readImageBytes(source), {limitInputPixels: 40_000_000}).rotate().resize({width:1024,height:1024,fit:'inside',withoutEnlargement:true}).png().toBuffer();
  return aiDescribeImage(pngUrl(bytes));
}
