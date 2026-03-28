/**
 * Client-side payload assertions for submit handlers.
 *
 * Use after confirming response.ok to verify the API returned a real
 * persisted record — not just an HTTP 200 with no backing data.
 *
 * Rule: No DB record = no success state. These helpers enforce that rule
 * at the call site so engineers cannot accidentally skip the check.
 */

/**
 * Assert that a response payload confirms a real persisted record.
 * Throws if success is false or the required identifier is missing.
 *
 * @example
 * const data = await res.json();
 * if (!res.ok) throw new Error(data.error || 'Request failed');
 * assertSuccessWithId(data, 'Enrollment');
 * setIsSubmitted(true);
 */
export function assertSuccessWithId<T extends { success?: boolean; id?: string | number }>(
  payload: T,
  label = 'Request'
): T {
  if (!payload?.success) {
    throw new Error(`${label} failed`);
  }

  if (!payload?.id) {
    throw new Error(`${label} succeeded without a required record ID — DB write may not have completed`);
  }

  return payload;
}

/**
 * Assert success with a named identifier field (e.g. applicationId, enrollmentId).
 * Use when the API returns a field name other than `id`.
 *
 * @example
 * assertSuccessWithField(data, 'applicationId', 'Partner application');
 */
export function assertSuccessWithField<T extends Record<string, unknown>>(
  payload: T,
  field: keyof T,
  label = 'Request'
): T {
  if (!payload?.success) {
    throw new Error(`${label} failed`);
  }

  if (!payload?.[field]) {
    throw new Error(`${label} succeeded without required field '${String(field)}' — DB write may not have completed`);
  }

  return payload;
}
