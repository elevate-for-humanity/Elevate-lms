
export const runtime = 'nodejs';
export const maxDuration = 60;

import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { requireApiAuth, APIAuthError } from '@/lib/auth';
import { logger } from '@/lib/logger';
import { toError, toErrorMessage } from '@/lib/safe';
import { parseBody, getErrorMessage } from '@/lib/api-helpers';
import {
  startOnboarding,
  completeOnboarding,
  skipOnboarding,
  resetOnboarding,
  getOnboardingProgress,
  getRecommendedOnboarding,
} from '@/lib/onboarding';

interface User {
  id: string;
  role?: string;
}

export async function GET(request: NextRequest) {
  try {
    const user = await requireApiAuth() as User;
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const flowId = searchParams.get('flowId');

    if (action === 'recommended') {
      const userRole = user.role || 'student';
      const recommended = await getRecommendedOnboarding(
        user.id,
        userRole as 'student' | 'instructor' | 'admin'
      );
      return NextResponse.json({ recommended });
    }

    if (action === 'progress' && flowId) {
      const progress = await getOnboardingProgress(user.id, flowId);
      return NextResponse.json({ progress });
    }

    return NextResponse.json(
      { error: 'Invalid action or missing parameters' },
      { status: 400 }
    );
  } catch (error) {
    if (error instanceof APIAuthError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    logger.error('Onboarding GET error:', error);
    return NextResponse.json(
      { error: getErrorMessage(error) },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireApiAuth() as User;
    const body = await parseBody<{ action?: string; flowId?: string }>(request);
    const { action, flowId } = body;

    if (!flowId) {
      return NextResponse.json(
        { error: 'flowId is required' },
        { status: 400 }
      );
    }

    switch (action) {
      case 'start':
        await startOnboarding(user.id, flowId);
        return NextResponse.json({
          success: true,
          message: 'Onboarding started',
        });

      case 'complete':
        await completeOnboarding(user.id, flowId);
        return NextResponse.json({
          success: true,
          message: 'Onboarding completed',
        });

      case 'skip':
        await skipOnboarding(user.id, flowId);
        return NextResponse.json({
          success: true,
          message: 'Onboarding skipped',
        });

      case 'reset':
        await resetOnboarding(user.id, flowId);
        return NextResponse.json({
          success: true,
          message: 'Onboarding reset',
        });

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    if (error instanceof APIAuthError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    logger.error('Onboarding POST error:', error);
    return NextResponse.json(
      { error: getErrorMessage(error) },
      { status: 500 }
    );
  }
}
