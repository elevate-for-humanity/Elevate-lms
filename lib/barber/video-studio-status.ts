import fs from 'fs';
import path from 'path';

export type BarberVideoStudioStatus = {
  updatedAt: string;
  currentSlug: string | null;
  currentTitle: string | null;
  phase: 'idle' | 'planning' | 'tts' | 'render' | 'assemble' | 'upload' | 'done' | 'error';
  message: string | null;
  completed: string[];
  failed: { slug: string; error: string }[];
  totalLessons: number;
};

export const BARBER_VIDEO_DIR = path.join(process.cwd(), 'public/videos/barber-lessons');
export const STUDIO_STATUS_FILE = path.join(BARBER_VIDEO_DIR, 'studio-status.json');

const DEFAULT_STATUS: BarberVideoStudioStatus = {
  updatedAt: new Date().toISOString(),
  currentSlug: null,
  currentTitle: null,
  phase: 'idle',
  message: null,
  completed: [],
  failed: [],
  totalLessons: 50,
};

export function readStudioStatus(): BarberVideoStudioStatus {
  try {
    if (!fs.existsSync(STUDIO_STATUS_FILE)) return { ...DEFAULT_STATUS };
    const raw = fs.readFileSync(STUDIO_STATUS_FILE, 'utf8');
    return { ...DEFAULT_STATUS, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULT_STATUS };
  }
}

export function writeStudioStatus(patch: Partial<BarberVideoStudioStatus>): void {
  fs.mkdirSync(BARBER_VIDEO_DIR, { recursive: true });
  const prev = readStudioStatus();
  const next: BarberVideoStudioStatus = {
    ...prev,
    ...patch,
    updatedAt: new Date().toISOString(),
  };
  fs.writeFileSync(STUDIO_STATUS_FILE, JSON.stringify(next, null, 2));
}

export function markStudioLessonDone(slug: string): void {
  const prev = readStudioStatus();
  const completed = prev.completed.includes(slug) ? prev.completed : [...prev.completed, slug];
  writeStudioStatus({
    completed,
    currentSlug: null,
    currentTitle: null,
    phase: 'done',
    message: `Finished ${slug}`,
  });
}

export function markStudioLessonFailed(slug: string, error: string): void {
  const prev = readStudioStatus();
  const failed = [...prev.failed.filter((f) => f.slug !== slug), { slug, error }];
  writeStudioStatus({
    failed,
    currentSlug: null,
    phase: 'error',
    message: error,
  });
}
