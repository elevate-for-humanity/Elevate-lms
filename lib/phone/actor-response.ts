import 'server-only';
import { NextResponse } from 'next/server';
import { requireCommunicationActor } from '@/lib/communications/actor';

/** Preserve authentication failures as 401/403 instead of an unhandled 500. */
export async function phoneActorResponse() {
  try {
    return { actor: await requireCommunicationActor(), response: undefined };
  } catch (error) {
    const code = error instanceof Error ? error.message : '';
    const status =
      code === 'COMMUNICATIONS_UNAUTHENTICATED'
        ? 401
        : code === 'COMMUNICATIONS_FORBIDDEN'
          ? 403
          : 503;
    return {
      actor: undefined,
      response: NextResponse.json(
        {
          error:
            status === 401
              ? 'Sign in to use your phone.'
              : status === 403
                ? 'Phone access is not permitted for this account.'
                : 'Phone authorization is temporarily unavailable.',
        },
        { status, headers: { 'Cache-Control': 'private, no-store' } },
      ),
    };
  }
}
