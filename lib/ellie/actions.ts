/**
 * Ellie action registry.
 *
 * Every action Ellie can propose is defined here. The registry is also the
 * canonical machine-enforced policy map for autonomous execution.
 */

export type EllieActionType =
  | 'send_reminder'
  | 'flag_at_risk'
  | 'unflag_at_risk'
  | 'approve_application'
  | 'reject_application'
  | 'approve_program_holder'
  | 'reject_program_holder'
  | 'issue_certificate'
  | 'send_magic_link'
  | 'assign_case_manager'
  | 'schedule_exam'
  | 'cancel_exam'
  | 'run_workflow'
  | 'navigate';

export type ActionExecutionPolicy =
  | 'AUTO'
  | 'RULE_VERIFIED'
  | 'APPROVAL'
  | 'PROHIBITED_AUTONOMOUS';

export interface EllieActionDef {
  type: EllieActionType;
  label: string;
  description: string;
  bulk: boolean;
  dangerLevel: 'low' | 'medium' | 'high';
  executionPolicy: ActionExecutionPolicy;
}

export const ELLIE_ACTION_REGISTRY: Record<EllieActionType, EllieActionDef> = {
  send_reminder: {
    type: 'send_reminder',
    label: 'Send Reminder',
    description: 'Send an email reminder to the selected student(s).',
    bulk: true,
    dangerLevel: 'low',
    executionPolicy: 'AUTO',
  },
  flag_at_risk: {
    type: 'flag_at_risk',
    label: 'Flag At-Risk',
    description: 'Mark enrollment(s) as at-risk and notify the assigned case manager.',
    bulk: true,
    dangerLevel: 'medium',
    executionPolicy: 'RULE_VERIFIED',
  },
  unflag_at_risk: {
    type: 'unflag_at_risk',
    label: 'Remove At-Risk Flag',
    description: 'Clear the at-risk flag on the selected enrollment(s).',
    bulk: true,
    dangerLevel: 'low',
    executionPolicy: 'RULE_VERIFIED',
  },
  approve_application: {
    type: 'approve_application',
    label: 'Approve Application',
    description: 'Approve the application and move the student to enrollment.',
    bulk: false,
    dangerLevel: 'medium',
    executionPolicy: 'APPROVAL',
  },
  reject_application: {
    type: 'reject_application',
    label: 'Reject Application',
    description: 'Reject the application and notify the applicant.',
    bulk: false,
    dangerLevel: 'high',
    executionPolicy: 'APPROVAL',
  },
  approve_program_holder: {
    type: 'approve_program_holder',
    label: 'Approve Program Holder',
    description: 'Approve the program holder application and activate their account.',
    bulk: false,
    dangerLevel: 'medium',
    executionPolicy: 'APPROVAL',
  },
  reject_program_holder: {
    type: 'reject_program_holder',
    label: 'Reject Program Holder',
    description: 'Reject the program holder application and notify the applicant.',
    bulk: false,
    dangerLevel: 'high',
    executionPolicy: 'APPROVAL',
  },
  issue_certificate: {
    type: 'issue_certificate',
    label: 'Issue Certificate',
    description: 'Request certificate issuance through the canonical completion gate.',
    bulk: false,
    dangerLevel: 'high',
    executionPolicy: 'PROHIBITED_AUTONOMOUS',
  },
  send_magic_link: {
    type: 'send_magic_link',
    label: 'Send Magic Link',
    description: 'Send a passwordless login link to the user\'s email.',
    bulk: false,
    dangerLevel: 'low',
    executionPolicy: 'APPROVAL',
  },
  assign_case_manager: {
    type: 'assign_case_manager',
    label: 'Assign Case Manager',
    description: 'Assign a case manager to the student enrollment. Updates assigned_staff_id and creates a case_manager_assignments row.',
    bulk: false,
    dangerLevel: 'low',
    executionPolicy: 'APPROVAL',
  },
  schedule_exam: {
    type: 'schedule_exam',
    label: 'Schedule Exam',
    description: 'Create an exam booking at the testing center. Requires firstName, lastName, email, examType, and preferredDate.',
    bulk: false,
    dangerLevel: 'low',
    executionPolicy: 'APPROVAL',
  },
  cancel_exam: {
    type: 'cancel_exam',
    label: 'Cancel Exam Booking',
    description: 'Cancel an exam booking by ID and queue a cancellation email to the student.',
    bulk: false,
    dangerLevel: 'medium',
    executionPolicy: 'APPROVAL',
  },
  run_workflow: {
    type: 'run_workflow',
    label: 'Run Workflow',
    description: 'Trigger the selected automation workflow.',
    bulk: false,
    dangerLevel: 'medium',
    executionPolicy: 'APPROVAL',
  },
  navigate: {
    type: 'navigate',
    label: 'Navigate',
    description: 'Open a page in the admin portal.',
    bulk: false,
    dangerLevel: 'low',
    executionPolicy: 'AUTO',
  },
};

export function getActionExecutionPolicy(actionType: EllieActionType): ActionExecutionPolicy {
  return ELLIE_ACTION_REGISTRY[actionType].executionPolicy;
}
