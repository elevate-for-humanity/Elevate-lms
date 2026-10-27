import { mkdtemp, readdir, readFile, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import { afterEach, describe, expect, it } from 'vitest';

import {
  loadDurableGenerationCheckpoint,
  persistDurableGenerationCheckpoint,
} from '@/lib/course-factory/durable-generation-journal';

let temporaryDirectory: string | null = null;

afterEach(async () => {
  delete process.env.COURSE_FACTORY_CHECKPOINT_DIR;
  if (temporaryDirectory) await rm(temporaryDirectory, { recursive: true, force: true });
  temporaryDirectory = null;
});

describe('durable Course Factory generation journal', () => {
  it('atomically persists and restores a checkpoint across process boundaries', async () => {
    temporaryDirectory = await mkdtemp(path.join(os.tmpdir(), 'course-factory-journal-'));
    process.env.COURSE_FACTORY_CHECKPOINT_DIR = temporaryDirectory;

    await persistDurableGenerationCheckpoint({
      courseTitle: 'Indiana Cosmetology License',
      lessonSlug: 'cosmo-final-exam',
      kind: 'assessment',
      payload: [{ question: 'Question?', options: ['A', 'B', 'C', 'D'], correct: 0 }],
    });

    const restored = await loadDurableGenerationCheckpoint<Array<Record<string, unknown>>>({
      courseTitle: 'Indiana Cosmetology License',
      lessonSlug: 'cosmo-final-exam',
      kind: 'assessment',
    });

    expect(restored).toHaveLength(1);
    expect(restored?.[0]?.question).toBe('Question?');
    const [courseDirectory] = await readdir(temporaryDirectory);
    expect(courseDirectory).toBeTruthy();
    const [checkpointFile] = await readdir(path.join(temporaryDirectory, courseDirectory!));
    const serialized = await readFile(
      path.join(temporaryDirectory, courseDirectory!, checkpointFile!),
      'utf8',
    );
    expect(serialized).toContain('"version":1');
  });

  it('rejects a checkpoint when its requested identity does not match', async () => {
    temporaryDirectory = await mkdtemp(path.join(os.tmpdir(), 'course-factory-journal-'));
    process.env.COURSE_FACTORY_CHECKPOINT_DIR = temporaryDirectory;

    await persistDurableGenerationCheckpoint({
      courseTitle: 'Course A',
      lessonSlug: 'lesson-one',
      kind: 'lesson',
      payload: { content: 'valid only for Course A' },
    });

    await expect(loadDurableGenerationCheckpoint({
      courseTitle: 'Course B',
      lessonSlug: 'lesson-one',
      kind: 'lesson',
    })).resolves.toBeNull();
  });
});
