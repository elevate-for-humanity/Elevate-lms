import { beforeEach, expect, test, vi } from 'vitest';
import { createHash } from 'node:crypto';
import sharp from 'sharp';
import { prepareTeachingPhotos } from '../../lib/ultimate-course-builder/adapters/teaching-photos';
import { generateTeachingPhoto } from '../../lib/ultimate-course-builder/adapters/google-teaching-photo.mjs';

vi.mock('../../lib/ultimate-course-builder/adapters/google-teaching-photo.mjs', () => ({
  generateTeachingPhoto: vi.fn(),
}));

const input = {
  courseId: 'a6b0b712-1cf0-475a-ba79-ee2023dea8ec',
  courseTitle: 'Cosmetology', lessonId: 'lesson-photo-regression',
  lessonPresentation: 'approved-premium-v1',
  artifacts: { storyboard: { storyboard: { scenes: [{
    id: 'concept', stage: 'concept_explanation', title: 'Salon tools',
    visualRequirement: 'Clean salon workstation', recapText: 'Keep clean tools separate.',
    teachingVisual: { steps: [{ label: 'Tools', value: 'Clean tools', narrationQuote: 'Separate clean tools.' }] },
  }] } } },
};

function storage(placed: any[] = []) {
  const files = new Map<string, Buffer>();
  const bucket = {
    download: vi.fn(async (path: string) => ({ data: files.has(path) ? new Blob([files.get(path)!]) : null })),
    upload: vi.fn(async (path: string, bytes: Buffer) => { files.set(path, Buffer.from(bytes)); return { error: null }; }),
    createSignedUrl: vi.fn(async (path: string) => ({ data: { signedUrl: 'https://media.example/' + path } })),
  };
  const db: any = {
    storage: { from: vi.fn(() => bucket) },
    from: (table: string) => {
      if (!['media_assets', 'course_videos'].includes(table)) throw Error('Unexpected table: ' + table);
      const query: any = { select: () => query, eq: () => query,
        then: (resolve: any) => Promise.resolve({ data: table === 'media_assets' ? placed : [], error: null }).then(resolve) };
      return query;
    },
  };
  return { db, files, bucket };
}

beforeEach(async () => {
  vi.mocked(generateTeachingPhoto).mockReset();
  const images = await Promise.all(['red', 'green', 'blue'].map(background => sharp({ create: { width: 32, height: 18, channels: 3, background } }).png().toBuffer()));
  images.forEach(bytes => vi.mocked(generateTeachingPhoto).mockResolvedValueOnce({ bytes, mimeType: 'image/png', provider: 'google' }));
});

test('new lessons use reusable instructional visuals without requiring a teacher photograph', async () => {
  const { db, files } = storage();
  const original = structuredClone(input);
  const result = await prepareTeachingPhotos(input, db);
  expect(generateTeachingPhoto).not.toHaveBeenCalled();
  expect(result.teachingPhotos.concept).toHaveLength(3);
  expect(new Set(result.teachingPhotos.concept.map((p: any) => p.sha256)).size).toBe(3);
  expect(input).toEqual(original);
  expect([...files.keys()].filter(path => path.startsWith('approved-teaching-photos/'))).toHaveLength(3);
  expect([...files.keys()].filter(path => path.startsWith('approved-teaching-photo-index/'))).toHaveLength(3);
  const resumed = await prepareTeachingPhotos(input, db);
  expect(generateTeachingPhoto).not.toHaveBeenCalled();
  expect(resumed.teachingPhotos).toEqual(result.teachingPhotos);
});

test('reviewed cue-matched placed images remain usable without generating replacements', async () => {
  const quotes = ['Separate clean tools.', 'Separate clean tools.', 'Keep clean tools separate.'];
  const placed = quotes.map((narrationQuote, cueIndex) => {
    const bytes = Buffer.from('reviewed-image-' + cueIndex);
    return { id: String(cueIndex), storage_path: 'approved-teaching-photos/reviewed-' + cueIndex + '.png',
      metadata: { source: 'openai-generated-illustration', reviewedIllustration: true, sceneId: 'concept', cueIndex,
        narrationQuote, sha256: createHash('sha256').update(bytes).digest('hex') } };
  });
  const { db, files } = storage(placed);
  placed.forEach((p, i) => files.set(p.storage_path, Buffer.from('reviewed-image-' + i)));
  const result = await prepareTeachingPhotos(input, db);
  expect(generateTeachingPhoto).not.toHaveBeenCalled();
  expect(result.teachingPhotos.concept.map((p: any) => p.storagePath)).toEqual(placed.map(p => p.storage_path));
});

test('unverified legacy card cache entries cannot satisfy new visual requests', async () => {
  const { db, files } = storage();
  // These are the actual v1 keys produced by this fixture before the repair.
  const legacyKeys = [
    '30bf408f56be445de169215e7c6181f8ad739d869dc5a30c9159db152a7b799a',
    'bff3cecaaec964471beb4ed4020b8ecea0272dc43fa694fbeccfb58dd733858d',
    '98a08ad0994013b1a2f0691929351a25221a31cc70abf61bcd5793585dedef23',
  ].map(hash => 'approved-teaching-photos/' + hash + '.png');
  legacyKeys.forEach(path => files.set(path, Buffer.from('legacy text card')));
  const result = await prepareTeachingPhotos(input, db);
  expect(generateTeachingPhoto).not.toHaveBeenCalled();
  expect(result.teachingPhotos.concept.every((p: any) => !legacyKeys.includes(p.storagePath))).toBe(true);
  expect(legacyKeys.every(path => files.has(path))).toBe(true);
});

test('a blocked photograph provider is not required for a conceptual lesson visual', async () => {
  vi.mocked(generateTeachingPhoto).mockReset().mockRejectedValue(Object.assign(Error('GOOGLE_TEACHING_PHOTO_MISSING_OR_FILTERED'), { details: { blocked: true } }));
  const { db } = storage();
  const result=await prepareTeachingPhotos(input, db);
  expect(generateTeachingPhoto).not.toHaveBeenCalled();
  expect(result.teachingPhotos.concept.every((visual: any) =>
    visual.repair?.method === 'lesson-conceptual-card-v1')).toBe(true);
});

test('resume rejects changed stored image bytes without requesting replacement inference', async () => {
  const { db, files } = storage();
  const result = await prepareTeachingPhotos(input, db);
  files.set(result.teachingPhotos.concept[0].storagePath, Buffer.from('changed-after-indexing'));
  await expect(prepareTeachingPhotos(input, db)).rejects.toThrow('TEACHING_PHOTO_HASH_MISMATCH');
  expect(generateTeachingPhoto).not.toHaveBeenCalled();
});

test('instructional cue visuals stay distinct without photograph generation', async () => {
  const bytes = await sharp({ create: { width: 32, height: 18, channels: 3, background: 'red' } }).png().toBuffer();
  vi.mocked(generateTeachingPhoto).mockReset().mockResolvedValue({ bytes, mimeType: 'image/png', provider: 'google' });
  const { db } = storage();
  const result=await prepareTeachingPhotos(input, db);
  expect(new Set(result.teachingPhotos.concept.map((visual:any)=>visual.sha256)).size).toBe(3);
  expect(generateTeachingPhoto).not.toHaveBeenCalled();
});

test('provider output is not requested when the shared contract can render the lesson', async () => {
  vi.mocked(generateTeachingPhoto).mockReset().mockResolvedValue({ bytes: Buffer.alloc(0), mimeType: 'image/png', provider: 'google' } as never);
  const { db, files } = storage();
  await expect(prepareTeachingPhotos(input, db)).resolves.toBeTruthy();
  expect(generateTeachingPhoto).not.toHaveBeenCalled();
  expect(files.size).toBeGreaterThan(0);
});
