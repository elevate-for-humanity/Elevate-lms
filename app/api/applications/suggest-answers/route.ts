import { NextRequest, NextResponse } from 'next/server';
import { apiAuthGuard } from '@/lib/admin/guards';
import { generateSuggestions } from '@/lib/assistant/matchFieldToSource';
import { safeError } from '@/lib/api/safe-error';

export const dynamic = 'force-dynamic';

/**
 * POST /api/applications/suggest-answers
 * Body: { fields: Array<{ fieldName: string; fieldLabel: string }> }
 * Returns suggestions for each field from the org profile.
 */
export async function POST(request: NextRequest) {
  const auth = await apiAuthGuard(request);

  let body: { fields?: Array<{ fieldName: string; fieldLabel: string }> };
  try {
    body = await request.json();
  } catch {
    return safeError('Invalid JSON body', 400);
  }

  if (!body.fields || !Array.isArray(body.fields)) {
    return safeError('fields array required', 400);
  }

  const suggestions = generateSuggestions(body.fields);

  return NextResponse.json({ suggestions });
}
