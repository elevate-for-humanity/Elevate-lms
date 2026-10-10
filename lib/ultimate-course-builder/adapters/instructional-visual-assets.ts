import { createHash } from 'node:crypto';
import sharp from 'sharp';
import { validateTeachingVisual, type TeachingVisual } from '../instructional/teaching-visual';

const escapeXml = (text: string) =>
  text.replace(
    /[<>&"']/g,
    (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&apos;' })[c]!,
  );

/** An actual owned image from the saved teaching plan. The animated compositor
 * still presents every teaching state; this image provides its scene context.
 * No stock license, observed action, or provider approval is invented. */
export async function materializeInstructionalVisualAssets(
  input: any,
  upload: (buffer: Buffer, path: string, contentType: string) => Promise<string>,
) {
  const media = input.artifacts?.visual_assignment?.media;
  const scenes = input.artifacts?.storyboard?.storyboard?.scenes;
  if (!media || !Array.isArray(scenes) || !Array.isArray(media.assignments)) return input;
  const assets = [...(media.readyAssets ?? [])];
  for (const assignment of media.assignments) {
    if (
      assignment.assignmentMethod !== 'instructional-render' ||
      assignment.generatedInstructionalVisual !== true
    )
      continue;
    const scene = scenes.find((s: any) => s.id === assignment.sceneId);
    if (!scene || assignment.assetId !== `instructional:${scene.id}`)
      throw new Error('ULTIMATE_INSTRUCTIONAL_VISUAL_MAPPING_REQUIRED');
    const plan = scene.teachingVisual as TeachingVisual;
    validateTeachingVisual(plan, String(scene.dialogue ?? scene.teachingPoint ?? ''));
    const step = plan.steps[0];
    const words = step.value.split(/\s+/);
    const lines: string[] = [];
    for (const word of words) {
      const last = lines.length - 1;
      if (last < 0 || `${lines[last]} ${word}`.length > 42) lines.push(word);
      else lines[last] += ` ${word}`;
    }
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="720"><rect width="1280" height="720" fill="#0f172a"/><rect x="64" y="100" width="1152" height="520" rx="24" fill="#1e3a5f"/><text x="100" y="180" fill="#93c5fd" font-family="sans-serif" font-size="30">${escapeXml(step.label)}</text>${lines.map((line, index) => `<text x="100" y="${270 + index * 62}" fill="#ffffff" font-family="sans-serif" font-size="40">${escapeXml(line)}</text>`).join('')}</svg>`;
    const image = await sharp(Buffer.from(svg)).png().toBuffer();
    const hash = createHash('sha256').update(image).digest('hex');
    const url = await upload(image, `instructional-visuals/${hash}.png`, 'image/png');
    const parsed = new URL(url);
    if (parsed.protocol !== 'https:')
      throw new Error('ULTIMATE_INSTRUCTIONAL_VISUAL_UPLOAD_URL_INVALID');
    assets.push({
      id: assignment.assetId,
      public_url: url,
      mime_type: 'image/png',
      provider: 'remotion',
      owned_instructional_visual: true,
      instructional_scene_id: scene.id,
      content_sha256: hash,
    });
  }
  return {
    ...input,
    artifacts: {
      ...input.artifacts,
      visual_assignment: {
        ...input.artifacts.visual_assignment,
        media: { ...media, readyAssets: assets },
      },
    },
  };
}
