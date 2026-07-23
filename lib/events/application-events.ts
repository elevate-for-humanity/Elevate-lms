/**
 * PARIS Application Domain Events
 * 
 * Type definitions for all application workflow events.
 * These events are published to the event bus for ZORA orchestration.
 */

export type ApplicationEvent =
  // Application lifecycle
  | { type: 'application.created'; applicationId: string }
  | { type: 'application.submitted'; applicationId: string }
  | {
      type: 'application.status.changed';
      applicationId: string;
      previousStatus: string;
      newStatus: string;
    }
  | { type: 'application.ready-to-enroll'; applicationId: string }
  | { type: 'application.enrolled'; applicationId: string; enrollmentId: string }

  // Document events
  | { type: 'document.uploaded'; applicationId: string; documentId: string }
  | {
      type: 'document.rejected';
      applicationId: string;
      documentId: string;
      reason: string;
    }
  | {
      type: 'document.status_changed';
      applicationId: string;
      documentId: string;
      previousStatus: string;
      newStatus: string;
    }

  // Funding events
  | { type: 'funding.updated'; applicationId: string; fundingCaseId: string }
  | {
      type: 'funding.approved';
      applicationId: string;
      fundingCaseId: string;
      approvedAmount: number;
    }
  | {
      type: 'funding.denied';
      applicationId: string;
      fundingCaseId: string;
      reason: string;
    }

  // Admissions events
  | {
      type: 'admissions.decision.recorded';
      applicationId: string;
      decision: string;
    }

  // Task events
  | { type: 'task.created'; applicationId: string; taskId: string }
  | { type: 'task.completed'; applicationId: string; taskId: string }
  | { type: 'task.overdue'; applicationId: string; taskId: string }

  // Note events
  | { type: 'note.added'; applicationId: string; noteId: string };

/**
 * Event metadata for logging and debugging
 */
export interface EventMetadata {
  timestamp: string;
  correlationId?: string;
  userId?: string;
  ipAddress?: string;
}

/**
 * Event envelope wrapping domain events with metadata
 */
export interface ApplicationEventEnvelope {
  event: ApplicationEvent;
  metadata: EventMetadata;
}

/**
 * Event type to human-readable description
 */
export function getEventDescription(event: ApplicationEvent): string {
  switch (event.type) {
    case 'application.created':
      return 'Application created';
    case 'application.submitted':
      return 'Application submitted for review';
    case 'application.status.changed':
      return `Status changed from ${event.previousStatus} to ${event.newStatus}`;
    case 'application.ready-to-enroll':
      return 'Application ready for enrollment';
    case 'application.enrolled':
      return 'Student enrolled in program';
    case 'document.uploaded':
      return 'Document uploaded';
    case 'document.rejected':
      return `Document rejected: ${event.reason}`;
    case 'document.status_changed':
      return `Document status changed from ${event.previousStatus} to ${event.newStatus}`;
    case 'funding.updated':
      return 'Funding case updated';
    case 'funding.approved':
      return `Funding approved: $${event.approvedAmount}`;
    case 'funding.denied':
      return `Funding denied: ${event.reason}`;
    case 'admissions.decision.recorded':
      return `Admissions decision: ${event.decision}`;
    case 'task.created':
      return 'New task created';
    case 'task.completed':
      return 'Task completed';
    case 'task.overdue':
      return 'Task is overdue';
    case 'note.added':
      return 'Note added to application';
    default:
      return 'Unknown event';
  }
}

/**
 * Check if an event type requires immediate action
 */
export function isUrgentEvent(event: ApplicationEvent): boolean {
  const urgentEventTypes = [
    'application.submitted',
    'document.rejected',
    'funding.denied',
    'task.overdue',
    'admissions.decision.recorded',
  ];
  
  return urgentEventTypes.includes(event.type);
}

/**
 * Get actor type that should be notified for an event
 */
export function getNotificationRecipient(event: ApplicationEvent): 'applicant' | 'recruiter' | 'admissions' | 'finance' | 'system' {
  switch (event.type) {
    case 'application.created':
    case 'application.submitted':
    case 'document.uploaded':
    case 'document.status_changed':
      return 'recruiter';
    
    case 'document.rejected':
    case 'funding.updated':
    case 'funding.approved':
    case 'funding.denied':
    case 'admissions.decision.recorded':
      return 'applicant';
    
    case 'application.status.changed':
    case 'application.ready-to-enroll':
    case 'application.enrolled':
      return 'applicant';
    
    case 'task.created':
    case 'task.completed':
    case 'task.overdue':
      return 'recruiter';
    
    case 'note.added':
      return 'system';
    
    default:
      return 'system';
  }
}
