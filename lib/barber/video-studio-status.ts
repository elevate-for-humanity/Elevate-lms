import fs from 'fs';
import path from 'path';

const OUT_DIR = path.join(process.cwd(), 'public/videos/barber-lessons');
const STATUS_FILE = path.join(OUT_DIR, 'studio-status.json');

export interface BarberVideoStudioStatus {
  ready: string[];
  rendering: string | null;
  updatedAt: string;
}

export function readBarberVideoStudioStatus(): BarberVideoStudioStatus {
  const ready: string[] = [];
  if (fs.existsSync(OUT_DIR)) {
    for (const f of fs.readdirSync(OUT_DIR)) {
      if (f.endsWith('.mp4')) ready.push(f.replace(/\.mp4$/, ''));
    }
    ready.sort();
  }

  let rendering: string | null = null;
  if (fs.existsSync(STATUS_FILE)) {
    try {
      const parsed = JSON.parse(fs.readFileSync(STATUS_FILE, 'utf8')) as {
        rendering?: string | null;
      };
      rendering = parsed.rendering ?? null;
    } catch {
      rendering = null;
    }
  }

  return { ready, rendering, updatedAt: new Date().toISOString() };
}
