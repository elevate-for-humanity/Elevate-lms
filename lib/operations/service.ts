/**
 * Authoritative Data Layer - Operations Service
 * Single Source of Truth for all platform operations
 */

import { SupabaseClient } from '@supabase/supabase-js';
import type {
  OperationsService,
  Organization,
  OrganizationUpdate,
  ProgramRegistry,
  ProgramRegistryUpdate,
  FundingRule,
  VerifiedClaim,
  ClaimDisplay,
  WorkflowInstance,
  WorkflowType,
  WorkflowStatus,
  WorkflowEvent,
  WorkflowEventType,
  NotificationOutbox,
  NotificationType,
  NotificationStatus,
} from './types';

/**
 * Create an operations service instance
 */
export function createOperationsService(supabase: SupabaseClient): OperationsService {
  return new OperationsServiceImpl(supabase);
}

/**
 * Operations Service Implementation
 */
class OperationsServiceImpl implements OperationsService {
  constructor(private supabase: SupabaseClient) {}

  // ===========================================================================
  // ORGANIZATION METHODS
  // ===========================================================================

  async getOrganization(slug: string): Promise<Organization | null> {
    const { data, error } = await this.supabase
      .from('organizations')
      .select('*')
      .eq('slug', slug)
      .eq('is_active', true)
      .single();

    if (error || !data) return null;
    return data as Organization;
  }

  async getOrganizationById(id: string): Promise<Organization | null> {
    const { data, error } = await this.supabase
      .from('organizations')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) return null;
    return data as Organization;
  }

  async updateOrganization(id: string, update: OrganizationUpdate): Promise<Organization> {
    const { data, error } = await this.supabase
      .from('organizations')
      .update(update)
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(`Failed to update organization: ${error.message}`);
    return data as Organization;
  }

  // ===========================================================================
  // PROGRAM REGISTRY METHODS
  // ===========================================================================

  async getProgram(slug: string): Promise<ProgramRegistry | null> {
    const { data, error } = await this.supabase
      .from('program_registry')
      .select('*')
      .eq('slug', slug)
      .eq('is_active', true)
      .single();

    if (error || !data) return null;
    return data as ProgramRegistry;
  }

  async getPrograms(filters?: { category?: string; isPublished?: boolean }): Promise<ProgramRegistry[]> {
    let query = this.supabase
      .from('program_registry')
      .select('*')
      .eq('is_active', true)
      .order('name');

    if (filters?.category) {
      query = query.eq('category', filters.category);
    }
    if (filters?.isPublished !== undefined) {
      query = query.eq('is_published', filters.isPublished);
    }

    const { data, error } = await query;
    if (error) throw new Error(`Failed to fetch programs: ${error.message}`);
    return (data || []) as ProgramRegistry[];
  }

  async getActiveFundingForProgram(programId: string): Promise<FundingRule[]> {
    const { data, error } = await this.supabase.rpc('get_active_funding_for_program', {
      p_program_id: programId,
    });

    if (error) throw new Error(`Failed to fetch funding: ${error.message}`);
    return (data || []) as FundingRule[];
  }

  async validateProgramForEnrollment(programId: string): Promise<{ valid: boolean; errors: string[] }> {
    const program = await this.getProgramById(programId);
    const errors: string[] = [];

    if (!program) {
      return { valid: false, errors: ['Program not found'] };
    }

    // Check program status
    if (!program.is_active) {
      errors.push('Program is not active');
    }
    if (!program.is_published) {
      errors.push('Program is not published');
    }

    // Check required fields
    if (!program.program_holder_id) {
      errors.push('Program has no program holder assigned');
    }
    if (!program.application_route) {
      errors.push('Program has no application route configured');
    }

    // Check content requirements
    if (!program.has_syllabus) {
      errors.push('Program has no syllabus');
    }
    if (!program.has_orientation) {
      errors.push('Program has no orientation defined');
    }
    if (!program.has_handbook) {
      errors.push('Program has no handbook');
    }

    // Check Stripe configuration (if paid program)
    if (program.tuition && program.tuition > 0) {
      if (!program.stripe_price_id) {
        errors.push('Program is missing Stripe price ID');
      }
    }

    // Check validity period
    if (program.sunset_date && new Date(program.sunset_date) < new Date()) {
      errors.push('Program has expired');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  private async getProgramById(id: string): Promise<ProgramRegistry | null> {
    const { data, error } = await this.supabase
      .from('program_registry')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) return null;
    return data as ProgramRegistry;
  }

  // ===========================================================================
  // VERIFIED CLAIMS METHODS
  // ===========================================================================

  async getActiveClaims(location?: string): Promise<ClaimDisplay[]> {
    let query = this.supabase
      .from('verified_claims')
      .select('claim_key, claim_value, badge_name, badge_color, display_locations')
      .eq('is_active', true)
      .eq('is_verified', true)
      .eq('display_on_website', true)
      .order('display_priority');

    // Filter by valid_until if column exists and we want only current claims
    const { data, error } = await query;
    if (error) throw new Error(`Failed to fetch claims: ${error.message}`);

    let claims = (data || []) as ClaimDisplay[];

    // Filter by location if specified
    if (location) {
      claims = claims.filter(claim => 
        claim.display_locations?.includes(location as any)
      );
    }

    return claims;
  }

  async isClaimValid(claimKey: string): Promise<boolean> {
    const { data, error } = await this.supabase.rpc('is_claim_valid', {
      p_claim_key: claimKey,
    });

    if (error) {
      console.error(`Failed to check claim validity: ${error.message}`);
      return false;
    }

    return data ?? false;
  }

  async getClaimStatus(claimKey: string): Promise<VerifiedClaim | null> {
    const { data, error } = await this.supabase
      .from('verified_claims')
      .select('*')
      .eq('claim_key', claimKey)
      .eq('is_active', true)
      .single();

    if (error || !data) return null;
    return data as VerifiedClaim;
  }

  // ===========================================================================
  // WORKFLOW METHODS
  // ===========================================================================

  async getWorkflow(entityType: string, entityId: string): Promise<WorkflowInstance | null> {
    const { data, error } = await this.supabase.rpc('get_workflow_state', {
      p_entity_type: entityType,
      p_entity_id: entityId,
    });

    if (error || !data || data.length === 0) return null;
    return data[0] as WorkflowInstance;
  }

  async createWorkflow(data: Partial<WorkflowInstance>): Promise<WorkflowInstance> {
    const { data: workflow, error } = await this.supabase
      .from('workflow_instances')
      .insert({
        organization_id: data.organization_id,
        workflow_type: data.workflow_type,
        workflow_version: data.workflow_version || 1,
        entity_type: data.entity_type,
        entity_id: data.entity_id,
        current_state: data.current_state || 'initiated',
        context: data.context || {},
        metadata: data.metadata || {},
        status: 'active',
        created_by: data.created_by,
        assigned_to: data.assigned_to,
      })
      .select()
      .single();

    if (error) throw new Error(`Failed to create workflow: ${error.message}`);

    // Log the creation event
    await this.logWorkflowEvent({
      workflow_instance_id: workflow.id,
      organization_id: workflow.organization_id,
      event_type: 'state_change',
      event_name: 'Workflow initiated',
      from_state: null,
      to_state: workflow.current_state,
      event_data: { initial: true },
      actor_type: 'system',
      actor_name: 'Workflow Engine',
    });

    return workflow as WorkflowInstance;
  }

  async advanceWorkflow(
    workflowId: string,
    newState: string,
    context?: Record<string, unknown>
  ): Promise<WorkflowInstance> {
    // Get current workflow state
    const { data: current, error: fetchError } = await this.supabase
      .from('workflow_instances')
      .select('*')
      .eq('id', workflowId)
      .single();

    if (fetchError || !current) {
      throw new Error('Workflow not found');
    }

    const previousState = current.current_state;
    const stateEnteredAt = new Date();

    // Update workflow state
    const { data: workflow, error } = await this.supabase
      .from('workflow_instances')
      .update({
        previous_state: previousState,
        current_state: newState,
        state_entered_at: stateEnteredAt.toISOString(),
        completed_steps: current.completed_steps + 1,
        progress_percentage: Math.min(
          100,
          ((current.completed_steps + 1) / (current.total_steps || 1)) * 100
        ),
        context: context ? { ...current.context, ...context } : current.context,
        updated_at: new Date().toISOString(),
      })
      .eq('id', workflowId)
      .select()
      .single();

    if (error) throw new Error(`Failed to advance workflow: ${error.message}`);

    // Log the state change
    await this.logWorkflowEvent({
      workflow_instance_id: workflowId,
      organization_id: workflow.organization_id,
      event_type: 'state_change',
      event_name: `State changed: ${previousState} → ${newState}`,
      from_state: previousState,
      to_state: newState,
      event_data: context || {},
      actor_type: 'system',
      actor_name: 'Workflow Engine',
    });

    return workflow as WorkflowInstance;
  }

  async logWorkflowEvent(event: Partial<WorkflowEvent>): Promise<void> {
    await this.supabase.from('workflow_events').insert({
      workflow_instance_id: event.workflow_instance_id,
      organization_id: event.organization_id,
      event_type: event.event_type,
      event_name: event.event_name,
      from_state: event.from_state,
      to_state: event.to_state,
      step_id: event.step_id,
      step_name: event.step_name,
      event_data: event.event_data || {},
      actor_type: event.actor_type || 'system',
      actor_id: event.actor_id,
      actor_name: event.actor_name,
      duration_ms: event.duration_ms,
      source: event.source,
      source_ip: event.source_ip,
      is_error: event.is_error || false,
      error_message: event.error_message,
      error_stack: event.error_stack,
    });
  }

  async completeWorkflow(workflowId: string): Promise<WorkflowInstance> {
    const { data: workflow, error } = await this.supabase
      .from('workflow_instances')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        progress_percentage: 100,
        updated_at: new Date().toISOString(),
      })
      .eq('id', workflowId)
      .select()
      .single();

    if (error) throw new Error(`Failed to complete workflow: ${error.message}`);

    // Log completion
    await this.logWorkflowEvent({
      workflow_instance_id: workflowId,
      organization_id: workflow.organization_id,
      event_type: 'state_change',
      event_name: 'Workflow completed',
      from_state: workflow.current_state,
      to_state: 'completed',
      event_data: { duration_ms: Date.now() - new Date(workflow.started_at).getTime() },
      actor_type: 'system',
      actor_name: 'Workflow Engine',
    });

    return workflow as WorkflowInstance;
  }

  async cancelWorkflow(workflowId: string, reason: string): Promise<WorkflowInstance> {
    const { data: current, error: fetchError } = await this.supabase
      .from('workflow_instances')
      .select('organization_id, current_state')
      .eq('id', workflowId)
      .single();

    if (fetchError || !current) {
      throw new Error('Workflow not found');
    }

    const { data: workflow, error } = await this.supabase
      .from('workflow_instances')
      .update({
        status: 'cancelled',
        cancelled_at: new Date().toISOString(),
        cancellation_reason: reason,
        updated_at: new Date().toISOString(),
      })
      .eq('id', workflowId)
      .select()
      .single();

    if (error) throw new Error(`Failed to cancel workflow: ${error.message}`);

    // Log cancellation
    await this.logWorkflowEvent({
      workflow_instance_id: workflowId,
      organization_id: current.organization_id,
      event_type: 'state_change',
      event_name: 'Workflow cancelled',
      from_state: current.current_state,
      to_state: 'cancelled',
      event_data: { reason },
      actor_type: 'system',
      actor_name: 'Workflow Engine',
    });

    return workflow as WorkflowInstance;
  }

  // ===========================================================================
  // NOTIFICATION METHODS
  // ===========================================================================

  async queueNotification(data: Partial<NotificationOutbox>): Promise<NotificationOutbox> {
    const { data: notification, error } = await this.supabase
      .from('notification_outbox')
      .insert({
        organization_id: data.organization_id,
        notification_type: data.notification_type || 'email',
        idempotency_key: data.idempotency_key,
        recipient_type: data.recipient_type || 'email',
        recipient_id: data.recipient_id,
        recipient_address: data.recipient_address,
        subject: data.subject,
        body: data.body,
        html_body: data.html_body,
        template_id: data.template_id,
        template_data: data.template_data || {},
        priority: data.priority || 5,
        scheduled_for: data.scheduled_for,
        expires_at: data.expires_at,
        status: 'pending',
        max_attempts: data.max_attempts || 3,
        related_entity_type: data.related_entity_type,
        related_entity_id: data.related_entity_id,
        metadata: data.metadata || {},
        created_by: data.created_by,
      })
      .select()
      .single();

    if (error) throw new Error(`Failed to queue notification: ${error.message}`);
    return notification as NotificationOutbox;
  }

  async getPendingNotifications(limit: number = 100): Promise<NotificationOutbox[]> {
    const { data, error } = await this.supabase
      .from('notification_outbox')
      .select('*')
      .eq('status', 'pending')
      .or(`scheduled_for.is.null,scheduled_for.lte.${new Date().toISOString()}`)
      .order('priority', { ascending: true })
      .order('created_at', { ascending: true })
      .limit(limit);

    if (error) throw new Error(`Failed to fetch pending notifications: ${error.message}`);
    return (data || []) as NotificationOutbox[];
  }

  async markNotificationSent(id: string, providerMessageId?: string): Promise<void> {
    const { error } = await this.supabase
      .from('notification_outbox')
      .update({
        status: 'sent',
        sent_at: new Date().toISOString(),
        provider_message_id: providerMessageId,
        attempts: this.supabase.rpc('increment', { row_id: id }) as any,
      })
      .eq('id', id);

    if (error) throw new Error(`Failed to mark notification as sent: ${error.message}`);
  }

  async markNotificationDelivered(id: string): Promise<void> {
    const { error } = await this.supabase
      .from('notification_outbox')
      .update({
        status: 'delivered',
        delivered_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (error) throw new Error(`Failed to mark notification as delivered: ${error.message}`);
  }

  async markNotificationFailed(id: string, errorMessage: string): Promise<void> {
    // Get current attempt count
    const { data: current } = await this.supabase
      .from('notification_outbox')
      .select('attempts, max_attempts, next_attempt_at')
      .eq('id', id)
      .single();

    if (!current) return;

    const newAttempts = (current.attempts || 0) + 1;
    const isDeadLetter = newAttempts >= (current.max_attempts || 3);

    const { error } = await this.supabase
      .from('notification_outbox')
      .update({
        status: isDeadLetter ? 'dead_letter' : 'pending',
        attempts: newAttempts,
        last_attempt_at: new Date().toISOString(),
        next_attempt_at: isDeadLetter ? null : this.calculateNextAttempt(newAttempts),
        error_message: errorMessage,
        dead_letter_reason: isDeadLetter ? `Max attempts (${current.max_attempts}) reached` : null,
      })
      .eq('id', id);

    if (error) throw new Error(`Failed to mark notification as failed: ${error.message}`);
  }

  async markNotificationDeadLetter(id: string, reason: string): Promise<void> {
    const { error } = await this.supabase
      .from('notification_outbox')
      .update({
        status: 'dead_letter',
        dead_letter_reason: reason,
      })
      .eq('id', id);

    if (error) throw new Error(`Failed to mark notification as dead letter: ${error.message}`);
  }

  private calculateNextAttempt(attemptCount: number): string {
    // Exponential backoff: 1min, 5min, 15min, 1hr, 4hr
    const delays = [1, 5, 15, 60, 240];
    const minutes = delays[Math.min(attemptCount, delays.length - 1)] || 240;
    const nextDate = new Date();
    nextDate.setMinutes(nextDate.getMinutes() + minutes);
    return nextDate.toISOString();
  }

  // ===========================================================================
  // UTILITY METHODS
  // ===========================================================================

  /**
   * Check if a placeholder phone/address exists in organization
   */
  async hasPlaceholderContactInfo(): Promise<boolean> {
    const org = await this.getOrganization('elevate-for-humanity');
    if (!org) return false;

    const placeholderPatterns = [
      /placeholder/i,
      /example\.com/i,
      /555-?1234/i,
      /xxx-?xxx-?xxxx/i,
      /000-?000-?0000/i,
    ];

    const checkField = (value: string | undefined): boolean => {
      if (!value) return false;
      return placeholderPatterns.some(pattern => pattern.test(value));
    };

    return (
      checkField(org.phone_main) ||
      checkField(org.phone_toll_free) ||
      checkField(org.email_primary) ||
      checkField(org.email_support) ||
      checkField(org.email_admissions) ||
      checkField(org.address_street) ||
      checkField(org.address_city)
    );
  }
}

// =============================================================================
// FACTORY FUNCTION
// =============================================================================

let _serviceInstance: OperationsService | null = null;

export function getOperationsService(supabase?: SupabaseClient): OperationsService {
  if (!supabase) {
    // Lazy load supabase client
    const { createClient } = require('@/lib/supabase/client');
    supabase = createClient();
  }

  if (!_serviceInstance || process.env.NODE_ENV === 'test') {
    _serviceInstance = createOperationsService(supabase);
  }

  return _serviceInstance;
}

export default getOperationsService;
