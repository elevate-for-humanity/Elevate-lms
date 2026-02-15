import { NextResponse } from 'next/server';

export const runtime = 'edge';
export const maxDuration = 60;
import { parseBody } from '@/lib/api-helpers';
import { applyRateLimit } from '@/lib/api/withRateLimit';

// Simulated database - in production, this would query your actual database
const enrollmentData = {
  total: 2847,
  thisMonth: 156,
  today: 12,
  activeStudents: 1234,
  lastUpdated: new Date().toISOString(),
};

export async function GET(request: Request) {
  try {
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;

    // In production, query your database here
    // const data = await db.query('SELECT COUNT(*) FROM enrollments...');

    return NextResponse.json({
      success: true,
      data: enrollmentData,
    });
  } catch (error) { 
    return NextResponse.json(
      { success: false, error: 'Failed to fetch enrollment data' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;

    const body = await parseBody<Record<string, any>>(request);

    // Increment counters
    enrollmentData.total += 1;
    enrollmentData.thisMonth += 1;
    enrollmentData.today += 1;
    enrollmentData.lastUpdated = new Date().toISOString();

    // In production, save to database
    // await db.query('INSERT INTO enrollments...');

    return NextResponse.json({
      success: true,
      data: enrollmentData,
    });
  } catch (error) { 
    return NextResponse.json(
      { success: false, error: 'Failed to update enrollment data' },
      { status: 500 }
    );
  }
}
