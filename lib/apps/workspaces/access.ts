import 'server-only';
import { NextResponse } from 'next/server';
import { apiRequireRoles } from '@/lib/admin/guards';
import { ALL_AUTHENTICATED_ROLES } from '@/lib/rbac/role-matrix';
import { requireAdminClient } from '@/lib/supabase/admin';
import {
  syncIndividualAppSubscription,
  hasIndividualAppAccess,
} from '@/lib/apps/sync-subscription';

export async function requireIndividualWorkspace(request: Request, appSlug: 'sam-gov' | 'grants') {
  const auth = await apiRequireRoles(request, ALL_AUTHENTICATED_ROLES);
  if (auth.error) return auth.error;
  let db;
  try {
    db = await requireAdminClient();
  } catch {
    return NextResponse.json(
      { error: 'Subscription verification is unavailable. Retry shortly.' },
      { status: 503 },
    );
  }
  const subscription = await syncIndividualAppSubscription(auth.id, appSlug);
  if (subscription?.status === 'billing_verification_unavailable') {
    return NextResponse.json(
      { error: 'Subscription verification is unavailable. Retry shortly.' },
      { status: 503 },
    );
  }
  if (!hasIndividualAppAccess(subscription)) {
    return NextResponse.json(
      { error: 'An active subscription or trial is required.' },
      { status: 403 },
    );
  }
  return { userId: auth.id, subscription, db };
}

export function workspaceFailure(error: unknown) {
  const message =
    error instanceof Error
      ? error.message
      : error && typeof error === 'object' && 'message' in error
        ? String(error.message)
        : String(error);
  if (/entity not found/i.test(message))
    return NextResponse.json({ error: 'Entity not found.' }, { status: 404 });
  if (/limit reached|limit exceeded/i.test(message))
    return NextResponse.json({ error: message }, { status: 409 });
  return NextResponse.json(
    { error: 'The workspace could not save this action. Please retry.' },
    { status: 503 },
  );
}
