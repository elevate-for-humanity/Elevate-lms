import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// The prior provider webhook cannot authorize exams after its SDK removal.
// Fail closed until exam-fee payment confirmation is implemented and verified
// through the active billing provider; never mark an exam paid from this URL.
export async function POST() {
  return NextResponse.json(
    { error: 'Exam payment webhook is unavailable; payment requires staff review.' },
    { status: 503 },
  );
}
