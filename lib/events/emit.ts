/**
 * lib/events/emit.ts
 *
 * Canonical event emission entry point.
 * Re-exports from lib/platform/events — use this path in all new code.
 *
 * Usage:
 *   import { emitEvent } from '@/lib/events/emit';
 *
 *   // Enrollment
 *   await emitEvent('student.enrolled', 'enrollment', {
 *     subject_id: enrollmentId,
 *     actor_id: userId,
 *     actor_type: 'user',
 *     payload: { programId, courseId },
 *   });
 *
 *   // Payment
 *   await emitEvent('payment.completed', 'payment', {
 *     subject_id: paymentIntentId,
 *     actor_id: userId,
 *     payload: { amount, currency, programId },
 *   });
 *
 *   // Cron failure
 *   await emitEvent('cron.failed', 'system', {
 *     severity: 'error',
 *     actor_type: 'cron',
 *     subject_id: 'escalate-funding-sla',
 *     payload: { error: err.message },
 *   });
 *
 *   // Deployment
 *   await emitDeploymentEvent('succeeded', { service: 'elevate-lms-service', version: sha });
 *
 * All events are fire-and-forget — emitEvent never throws.
 * Events are stored in platform_events and broadcast via Supabase Realtime.
 */

export {
  emitEvent,
  emitDeploymentEvent,
  emitMigrationEvent,
  emitAiAction,
  getRecentEvents,
  type EventCategory,
  type EventSeverity,
  type EmitEventOptions,
} from '@/lib/platform/events';
