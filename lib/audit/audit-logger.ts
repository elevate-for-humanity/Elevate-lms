/**
 * Audit Logger Utility
 * 
 * Provides standardized audit logging for all platform operations.
 * Writes to the platform_audit_events table.
 */

import { createClient } from '@supabase/supabase-js';

// Audit event types
export type AuditActorType = 'user' | 'agent' | 'system';
export type AuditStatus = 'started' | 'succeeded' | 'failed' | 'denied';

// Audit event input
export interface AuditEventInput {
  actorUserId?: string;
  actorType: AuditActorType;
  actorName?: string;
  organizationId?: string;
  action: string;
  resourceType: string;
  resourceId?: string;
  status: AuditStatus;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
}

// Create audit logger with service role
function getAuditClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

/**
 * Log an audit event to the platform_audit_events table
 */
export async function logAuditEvent(input: AuditEventInput): Promise<void> {
  try {
    const supabase = getAuditClient();
    
    const { error } = await supabase.from('platform_audit_events').insert({
      actor_user_id: input.actorUserId,
      actor_type: input.actorType,
      actor_name: input.actorName,
      organization_id: input.organizationId,
      action: input.action,
      resource_type: input.resourceType,
      resource_id: input.resourceId,
      status: input.status,
      metadata: input.metadata || {},
      ip_address: input.ipAddress,
      user_agent: input.userAgent,
    });
    
    if (error) {
      console.error('[AUDIT_LOG_ERROR]', error);
    }
  } catch (e) {
    console.error('[AUDIT_LOG_EXCEPTION]', e);
  }
}

/**
 * Pre-defined audit action constants
 */
export const AUDIT_ACTIONS = {
  // AI Chat
  AI_CHAT_SUBMIT: 'ai.chat.submit',
  AI_CHAT_RESPONSE: 'ai.chat.response',
  AI_COURSE_GENERATE: 'ai.course.generate',
  AI_CONTENT_GENERATE: 'ai.content.generate',
  
  // Courses
  COURSE_CREATE: 'course.create',
  COURSE_UPDATE: 'course.update',
  COURSE_PUBLISH: 'course.publish',
  COURSE_DELETE: 'course.delete',
  LESSON_CREATE: 'lesson.create',
  LESSON_UPDATE: 'lesson.update',
  QUIZ_CREATE: 'quiz.create',
  QUIZ_PUBLISH: 'quiz.publish',
  
  // Media
  MEDIA_UPLOAD: 'media.upload',
  MEDIA_DELETE: 'media.delete',
  MEDIA_UPDATE: 'media.update',
  
  // Deployments
  DEPLOYMENT_REQUEST: 'deployment.request',
  DEPLOYMENT_APPROVE: 'deployment.approve',
  DEPLOYMENT_REJECT: 'deployment.reject',
  DEPLOYMENT_START: 'deployment.start',
  DEPLOYMENT_COMPLETE: 'deployment.complete',
  DEPLOYMENT_FAILED: 'deployment.failed',
  
  // Containers
  CONTAINER_CREATE: 'container.create',
  CONTAINER_START: 'container.start',
  CONTAINER_STOP: 'container.stop',
  CONTAINER_DELETE: 'container.delete',
  
  // Settings
  SETTINGS_UPDATE: 'settings.update',
  SECRETS_UPDATE: 'secrets.update',
  
  // Auth
  AUTH_LOGIN: 'auth.login',
  AUTH_LOGOUT: 'auth.logout',
  AUTH_FAILED: 'auth.failed',
} as const;

/**
 * Quick log helper for API routes
 */
export async function auditLog(params: {
  action: string;
  resourceType: string;
  resourceId?: string;
  status: AuditStatus;
  userId?: string;
  metadata?: Record<string, unknown>;
  request?: Request;
}) {
  const ipAddress = params.request?.headers.get('x-forwarded-for') || undefined;
  const userAgent = params.request?.headers.get('user-agent') || undefined;
  
  await logAuditEvent({
    actorUserId: params.userId,
    actorType: params.userId ? 'user' : 'system',
    action: params.action,
    resourceType: params.resourceType,
    resourceId: params.resourceId,
    status: params.status,
    metadata: params.metadata,
    ipAddress,
    userAgent,
  });
}
