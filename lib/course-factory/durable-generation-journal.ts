import 'server-only';

import { createHash, randomUUID } from 'node:crypto';
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import path from 'node:path';

import { logger } from '@/lib/logger';

const JOURNAL_VERSION = 1;

type JournalKind = 'lesson' | 'assessment';

type JournalEnvelope<T> = {
  version: number;
  kind: JournalKind;
  courseTitle: string;
  lessonSlug: string;
  savedAt: string;
  payload: T;
};

function journalRoot(): string | null {
  const configured = process.env.COURSE_FACTORY_CHECKPOINT_DIR?.trim();
  return configured ? path.resolve(configured) : null;
}

function checkpointPath(courseTitle: string, lessonSlug: string, kind: JournalKind): string | null {
  const root = journalRoot();
  if (!root) return null;
  const courseKey = createHash('sha256').update(courseTitle).digest('hex').slice(0, 20);
  const lessonKey = createHash('sha256').update(lessonSlug).digest('hex').slice(0, 20);
  return path.join(root, courseKey, `${lessonKey}.${kind}.json`);
}

export async function loadDurableGenerationCheckpoint<T>(input: {
  courseTitle: string;
  lessonSlug: string;
  kind: JournalKind;
}): Promise<T | null> {
  const filePath = checkpointPath(input.courseTitle, input.lessonSlug, input.kind);
  if (!filePath) return null;

  try {
    const parsed = JSON.parse(await readFile(filePath, 'utf8')) as JournalEnvelope<T>;
    if (
      parsed.version !== JOURNAL_VERSION ||
      parsed.kind !== input.kind ||
      parsed.courseTitle !== input.courseTitle ||
      parsed.lessonSlug !== input.lessonSlug ||
      !parsed.payload
    ) {
      return null;
    }
    return parsed.payload;
  } catch (error) {
    const code = error && typeof error === 'object' && 'code' in error ? error.code : null;
    if (code !== 'ENOENT') {
      logger.warn('[course-factory/journal] checkpoint read ignored', {
        lessonSlug: input.lessonSlug,
        kind: input.kind,
        error: error instanceof Error ? error.message : String(error),
      });
    }
    return null;
  }
}

export async function persistDurableGenerationCheckpoint<T>(input: {
  courseTitle: string;
  lessonSlug: string;
  kind: JournalKind;
  payload: T;
}): Promise<void> {
  const filePath = checkpointPath(input.courseTitle, input.lessonSlug, input.kind);
  if (!filePath) return;

  const envelope: JournalEnvelope<T> = {
    version: JOURNAL_VERSION,
    kind: input.kind,
    courseTitle: input.courseTitle,
    lessonSlug: input.lessonSlug,
    savedAt: new Date().toISOString(),
    payload: input.payload,
  };
  const temporaryPath = `${filePath}.${randomUUID()}.tmp`;

  try {
    await mkdir(path.dirname(filePath), { recursive: true });
    await writeFile(temporaryPath, `${JSON.stringify(envelope)}\n`, {
      encoding: 'utf8',
      mode: 0o600,
    });
    await rename(temporaryPath, filePath);
  } catch (error) {
    logger.warn('[course-factory/journal] checkpoint write ignored', {
      lessonSlug: input.lessonSlug,
      kind: input.kind,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}
