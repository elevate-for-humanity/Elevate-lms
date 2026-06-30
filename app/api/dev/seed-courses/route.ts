import { NextResponse } from 'next/server';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export async function POST() {
  return NextResponse.json({ error: 'Course seeding is CLI-only. Use scripts/seed-course-from-blueprint.ts with service credentials.' }, { status: 410 });
}
