import {createHash} from 'node:crypto';

// Internal orchestration uses stable keys such as "plan-...:s1".
// The Studio route's explicit UUID-shaped API contract remains unchanged.
// Scope derived keys to actor+tool+original key to preserve idempotency and
// prevent cross-actor collisions; never include mutable retry count or time.
export function engineeringRequestKey(actorId, idempotencyKey) {
  if (typeof actorId !== 'string' || !actorId.trim() ||
      typeof idempotencyKey !== 'string' || !idempotencyKey.trim())
    throw Error('STUDIO_ENGINEERING_IDEMPOTENCY_IDENTITY_REQUIRED');
  if (/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(idempotencyKey))
    return idempotencyKey.toLowerCase();
  const hex=createHash('sha256').update(JSON.stringify([
    'studio.engineering.execute.v1',actorId,idempotencyKey
  ])).digest('hex');
  // Deterministic version/variant-shaped UUID; not asserted to be RFC v5.
  return hex.slice(0,8)+'-'+hex.slice(8,12)+'-5'+hex.slice(13,16)+
    '-8'+hex.slice(17,20)+'-'+hex.slice(20,32);
}
