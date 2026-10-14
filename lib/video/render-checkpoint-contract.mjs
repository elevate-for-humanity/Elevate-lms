import {createHash} from 'node:crypto';

// Shared by lesson evidence and encoded segment storage. Bump only when the
// rendering contract changes; unrelated application releases keep checkpoints.
export const STORYBOARD_RENDER_PRODUCER = 'approved-pcm-timeline-contained-photo-tracking-v3';
export function storyboardRenderFingerprint(input, producer=STORYBOARD_RENDER_PRODUCER) {
  return createHash('sha256').update(JSON.stringify({...input,producer})).digest('hex').slice(0,24);
}
