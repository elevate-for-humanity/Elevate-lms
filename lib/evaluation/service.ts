/**
 * AI Evaluation Studio - Service Layer
 * Handles all CRUD operations and business logic for evaluations
 */

import { createPublicClient } from '@/lib/supabase/server';
import type {
  EvaluationTaskDefinition,
  EvaluationChecker,
  ReferenceSolution,
  ScoringRubric,
  TestCase,
  EvaluationResult,
  ReviewQueueItem,
  VersionHistory,
  EvaluationWorkflowState,
  WORKFLOW_TRANSITIONS,
  CheckerResult,
  RubricScores,
  RubricCategory,
  PaginationParams,
  FilterParams,
  BatchEvaluationRequest,
  BatchEvaluationResponse,
} from './types';

const supabase = createPublicClient();

// ============================================================================
// TASK DEFINITION SERVICE
// ============================================================================

export class EvaluationTaskService {
  /**
   * Create a new evaluation task definition
   */
  async create(
    task: Omit<EvaluationTaskDefinition, 'id' | 'createdAt' | 'updatedAt' | 'version'>,
    userId: string
  ): Promise<EvaluationTaskDefinition> {
    const now = new Date().toISOString();
    const id = `task_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

    const newTask: EvaluationTaskDefinition = {
      ...task,
      id,
      createdAt: now,
      updatedAt: now,
      version: {
        version: 1,
        author: userId,
        createdAt: now,
      },
    };

    const { data, error } = await supabase
      .from('evaluation_tasks')
      .insert(newTask)
      .select()
      .single();

    if (error) throw new Error(`Failed to create task: ${error.message}`);
    return data;
  }

  /**
   * Get task by ID
   */
  async getById(id: string): Promise<EvaluationTaskDefinition | null> {
    const { data, error } = await supabase
      .from('evaluation_tasks')
      .select('*')
      .eq('id', id)
      .single();

    if (error && error.code !== 'PGRST116') throw new Error(`Failed to get task: ${error.message}`);
    return data;
  }

  /**
   * Get task by slug
   */
  async getBySlug(slug: string): Promise<EvaluationTaskDefinition | null> {
    const { data, error } = await supabase
      .from('evaluation_tasks')
      .select('*')
      .eq('slug', slug)
      .single();

    if (error && error.code !== 'PGRST116') throw new Error(`Failed to get task: ${error.message}`);
    return data;
  }

  /**
   * List tasks with pagination and filters
   */
  async list(
    pagination: PaginationParams,
    filters: FilterParams = {}
  ): Promise<{ tasks: EvaluationTaskDefinition[]; total: number }> {
    let query = supabase
      .from('evaluation_tasks')
      .select('*', { count: 'exact' });

    // Apply filters
    if (filters.status?.length) {
      query = query.in('status', filters.status);
    }
    if (filters.domain?.length) {
      query = query.in('domain', filters.domain);
    }
    if (filters.category?.length) {
      query = query.in('category', filters.category);
    }
    if (filters.tags?.length) {
      query = query.contains('tags', filters.tags);
    }
    if (filters.createdBy) {
      query = query.eq('createdBy', filters.createdBy);
    }
    if (filters.dateFrom) {
      query = query.gte('createdAt', filters.dateFrom);
    }
    if (filters.dateTo) {
      query = query.lte('createdAt', filters.dateTo);
    }

    // Apply pagination
    const { page, limit, sortBy, sortOrder } = pagination;
    query = query.range((page - 1) * limit, page * limit);

    if (sortBy) {
      query = query.order(sortBy, { ascending: sortOrder === 'asc' });
    } else {
      query = query.order('createdAt', { ascending: false });
    }

    const { data, error, count } = await query;
    if (error) throw new Error(`Failed to list tasks: ${error.message}`);

    return { tasks: data || [], total: count || 0 };
  }

  /**
   * Update task
   */
  async update(
    id: string,
    updates: Partial<EvaluationTaskDefinition>,
    userId: string,
    changeNote?: string
  ): Promise<EvaluationTaskDefinition> {
    const existing = await this.getById(id);
    if (!existing) throw new Error('Task not found');

    const now = new Date().toISOString();
    const newVersion = existing.version.version + 1;

    // Record version history
    await this.recordVersionChange('task', id, existing, updates, userId, changeNote);

    const { data, error } = await supabase
      .from('evaluation_tasks')
      .update({
        ...updates,
        updatedAt: now,
        version: {
          ...existing.version,
          version: newVersion,
          author: userId,
          createdAt: now,
          changeNote,
          previousVersion: existing.version.version,
        },
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(`Failed to update task: ${error.message}`);
    return data;
  }

  /**
   * Delete task
   */
  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('evaluation_tasks')
      .delete()
      .eq('id', id);

    if (error) throw new Error(`Failed to delete task: ${error.message}`);
  }
}

// ============================================================================
// CHECKER SERVICE
// ============================================================================

export class CheckerService {
  /**
   * Create a new checker
   */
  async create(
    checker: Omit<EvaluationChecker, 'id' | 'createdAt' | 'updatedAt' | 'version'>,
    userId: string
  ): Promise<EvaluationChecker> {
    const now = new Date().toISOString();
    const id = `check_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

    const newChecker: EvaluationChecker = {
      ...checker,
      id,
      createdAt: now,
      updatedAt: now,
      version: {
        version: 1,
        author: userId,
        createdAt: now,
      },
    };

    const { data, error } = await supabase
      .from('evaluation_checkers')
      .insert(newChecker)
      .select()
      .single();

    if (error) throw new Error(`Failed to create checker: ${error.message}`);
    return data;
  }

  /**
   * Get checkers for a task
   */
  async getByTaskId(taskId: string): Promise<EvaluationChecker[]> {
    const { data, error } = await supabase
      .from('evaluation_checkers')
      .select('*')
      .eq('taskId', taskId);

    if (error) throw new Error(`Failed to get checkers: ${error.message}`);
    return data || [];
  }

  /**
   * Execute a checker against data
   */
  async execute(
    checker: EvaluationChecker,
    data: Record<string, unknown>
  ): Promise<CheckerResult> {
    const result: CheckerResult = {
      checkerId: checker.id,
      checkerName: checker.name,
      passed: false,
      severity: checker.severity,
    };

    try {
      switch (checker.config.type) {
        case 'required_fields':
          result.passed = this.checkRequiredFields(checker.config, data, result);
          break;
        case 'regex_match':
          result.passed = this.checkRegexMatch(checker.config, data, result);
          break;
        case 'range_check':
          result.passed = this.checkRange(checker.config, data, result);
          break;
        case 'mapping_complete':
          result.passed = this.checkMappingComplete(checker.config, data, result);
          break;
        case 'custom':
          result.passed = await this.executeCustomChecker(checker.config, data, result);
          break;
        default:
          result.message = `Unknown checker type`;
          result.passed = false;
      }
    } catch (err) {
      result.passed = false;
      result.message = `Checker execution error: ${(err as Error).message}`;
    }

    return result;
  }

  private checkRequiredFields(
    config: { fields: { path: string; description: string }[] },
    data: Record<string, unknown>,
    result: CheckerResult
  ): boolean {
    const missing: string[] = [];
    for (const field of config.fields) {
      const value = this.getNestedValue(data, field.path);
      if (value === undefined || value === null || value === '') {
        missing.push(`${field.path} (${field.description})`);
      }
    }
    if (missing.length > 0) {
      result.message = `Missing required fields: ${missing.join(', ')}`;
      result.details = { missingFields: missing };
      return false;
    }
    result.message = 'All required fields present';
    return true;
  }

  private checkRegexMatch(
    config: { field: string; pattern: string },
    data: Record<string, unknown>,
    result: CheckerResult
  ): boolean {
    const value = this.getNestedValue(data, config.field);
    if (typeof value !== 'string') {
      result.message = `Field ${config.field} is not a string`;
      return false;
    }
    const regex = new RegExp(config.pattern);
    const passed = regex.test(value);
    result.message = passed
      ? `Field ${config.field} matches pattern`
      : `Field ${config.field} does not match pattern: ${config.pattern}`;
    result.details = { value, pattern: config.pattern };
    return passed;
  }

  private checkRange(
    config: { field: string; min?: number; max?: number },
    data: Record<string, unknown>,
    result: CheckerResult
  ): boolean {
    const value = this.getNestedValue(data, config.field) as number;
    if (typeof value !== 'number') {
      result.message = `Field ${config.field} is not a number`;
      return false;
    }
    const minOk = config.min === undefined || value >= config.min;
    const maxOk = config.max === undefined || value <= config.max;
    const passed = minOk && maxOk;
    result.message = passed
      ? `Field ${config.field} is within range`
      : `Field ${config.field} is out of range (min: ${config.min}, max: ${config.max})`;
    result.details = { value, min: config.min, max: config.max };
    return passed;
  }

  private checkMappingComplete(
    config: { sourceField: string; targetField: string; mappingRules: { source: string; target: string; required: boolean }[] },
    data: Record<string, unknown>,
    result: CheckerResult
  ): boolean {
    const missing: string[] = [];
    for (const rule of config.mappingRules) {
      if (rule.required) {
        const sourceValue = this.getNestedValue(data, rule.source);
        const targetValue = this.getNestedValue(data, rule.target);
        if (!targetValue && sourceValue) {
          missing.push(`${rule.source} -> ${rule.target}`);
        }
      }
    }
    if (missing.length > 0) {
      result.message = `Incomplete mappings: ${missing.join(', ')}`;
      result.details = { missingMappings: missing };
      return false;
    }
    result.message = 'All required mappings complete';
    return true;
  }

  private async executeCustomChecker(
    config: { functionName: string; functionPath: string; parameters?: Record<string, unknown> },
    data: Record<string, unknown>,
    result: CheckerResult
  ): Promise<boolean> {
    // Dynamic import of custom checker
    try {
      const module = await import(config.functionPath);
      const checkerFn = module[config.functionName];
      if (typeof checkerFn !== 'function') {
        result.message = `Custom checker ${config.functionName} not found`;
        return false;
      }
      const passed = await checkerFn(data, config.parameters);
      result.message = passed ? 'Custom checker passed' : 'Custom checker failed';
      return passed;
    } catch (err) {
      result.message = `Failed to execute custom checker: ${(err as Error).message}`;
      return false;
    }
  }

  private getNestedValue(obj: Record<string, unknown>, path: string): unknown {
    return path.split('.').reduce((current: unknown, key: string) => {
      if (current && typeof current === 'object') {
        return (current as Record<string, unknown>)[key];
      }
      return undefined;
    }, obj);
  }
}

// ============================================================================
// RUBRIC SERVICE
// ============================================================================

export class RubricService {
  /**
   * Create a new rubric
   */
  async create(
    rubric: Omit<ScoringRubric, 'id' | 'createdAt' | 'updatedAt' | 'version'>,
    userId: string
  ): Promise<ScoringRubric> {
    const now = new Date().toISOString();
    const id = `rubric_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

    const newRubric: ScoringRubric = {
      ...rubric,
      id,
      createdAt: now,
      updatedAt: now,
      version: {
        version: 1,
        author: userId,
        createdAt: now,
      },
    };

    const { data, error } = await supabase
      .from('evaluation_rubrics')
      .insert(newRubric)
      .select()
      .single();

    if (error) throw new Error(`Failed to create rubric: ${error.message}`);
    return data;
  }

  /**
   * Score output against rubric
   */
  async score(
    rubric: ScoringRubric,
    output: Record<string, unknown>
  ): Promise<RubricScores> {
    const categoryScores: Record<RubricCategory, number> = {
      completeness: 0,
      accuracy: 0,
      compliance: 0,
      quality: 0,
      safety: 0,
    };

    const breakdown: RubricScores['breakdown'] = [];
    let totalScore = 0;
    let totalWeight = 0;

    for (const category of rubric.categories) {
      const rules = rubric.categoryRules[category] || [];
      const weight = rubric.categoryWeights[category] || 0;
      let categoryScore = 0;
      let maxCategoryScore = 0;
      const feedback: string[] = [];

      for (const rule of rules) {
        maxCategoryScore += rule.maxPoints;
        const ruleScore = await this.evaluateRule(rule, output);
        categoryScore += ruleScore;
        if (ruleScore < rule.maxPoints) {
          feedback.push(`${rule.description}: ${ruleScore}/${rule.maxPoints}`);
        }
      }

      // Calculate percentage
      const percentage = maxCategoryScore > 0 ? (categoryScore / maxCategoryScore) * 100 : 0;
      categoryScores[category] = Math.round(percentage * 10) / 10;

      breakdown.push({
        category,
        score: categoryScore,
        maxScore: maxCategoryScore,
        passed: percentage >= 70,
        feedback,
      });

      totalScore += percentage * weight;
      totalWeight += weight;
    }

    const finalScore = totalWeight > 0 ? totalScore / totalWeight : 0;

    return {
      rubricId: rubric.id,
      categoryScores,
      totalScore: Math.round(finalScore * 10) / 10,
      breakdown,
    };
  }

  private async evaluateRule(
    rule: { id: string; criteria: string; points: number; maxPoints: number },
    output: Record<string, unknown>
  ): Promise<number> {
    // Simple implementation - in production this would be more sophisticated
    // For now, return full points if the criteria key exists in output
    const value = this.getNestedValue(output, rule.criteria);
    if (value !== undefined && value !== null) {
      return rule.maxPoints;
    }
    // Check for partial credit based on penalties
    return Math.floor(rule.maxPoints * 0.5); // 50% partial credit
  }

  private getNestedValue(obj: Record<string, unknown>, path: string): unknown {
    return path.split('.').reduce((current: unknown, key: string) => {
      if (current && typeof current === 'object') {
        return (current as Record<string, unknown>)[key];
      }
      return undefined;
    }, obj);
  }
}

// ============================================================================
// EVALUATION ENGINE
// ============================================================================

export class EvaluationEngine {
  private taskService = new EvaluationTaskService();
  private checkerService = new CheckerService();
  private rubricService = new RubricService();

  /**
   * Run full evaluation on an output
   */
  async evaluate(
    taskId: string,
    input: Record<string, unknown>,
    output: unknown,
    options: {
      executeCheckers: boolean;
      executeRubric: boolean;
    } = { executeCheckers: true, executeRubric: true }
  ): Promise<EvaluationResult> {
    const startTime = Date.now();
    const task = await this.taskService.getById(taskId);
    if (!task) throw new Error('Task not found');

    const result: EvaluationResult = {
      id: `eval_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
      taskId,
      input,
      output,
      checkerResults: [],
      pass: false,
      status: 'needs_review',
      reviewStatus: 'draft',
      evaluatedAt: new Date().toISOString(),
      evaluator: 'system',
      executionTimeMs: Date.now() - startTime,
    };

    // Execute checkers
    if (options.executeCheckers && task.checkerIds.length > 0) {
      for (const checkerId of task.checkerIds) {
        const checkers = await this.checkerService.getByTaskId(taskId);
        const checker = checkers.find(c => c.id === checkerId);
        if (checker) {
          const checkerResult = await this.checkerService.execute(checker, output as Record<string, unknown>);
          result.checkerResults.push(checkerResult);
        }
      }
    }

    // Calculate rubric scores
    if (options.executeRubric && task.rubricId) {
      const rubricData = await supabase
        .from('evaluation_rubrics')
        .select('*')
        .eq('id', task.rubricId)
        .single();
      
      if (rubricData.data) {
        result.rubricScores = await this.rubricService.score(
          rubricData.data,
          output as Record<string, unknown>
        );
        result.overallScore = result.rubricScores.totalScore;
      }
    }

    // Determine overall pass/fail
    const hasErrors = result.checkerResults.some(r => !r.passed && r.severity === 'error');
    result.pass = !hasErrors;

    if (hasErrors) {
      result.status = 'failed';
    } else if (result.checkerResults.some(r => r.severity === 'warning')) {
      result.status = 'needs_review';
    } else {
      result.status = 'passed';
    }

    return result;
  }

  /**
   * Batch evaluate multiple inputs
   */
  async batchEvaluate(
    request: BatchEvaluationRequest
  ): Promise<BatchEvaluationResponse> {
    const results: EvaluationResult[] = [];
    let passed = 0;
    let failed = 0;
    let needsReview = 0;

    for (const input of request.inputs) {
      const result = await this.evaluate(
        request.taskId,
        input,
        input, // Using input as output for batch testing
        {
          executeCheckers: request.executeCheckers,
          executeRubric: request.executeRubric,
        }
      );
      results.push(result);

      if (result.status === 'passed') passed++;
      else if (result.status === 'failed') failed++;
      else needsReview++;
    }

    return {
      taskId: request.taskId,
      total: request.inputs.length,
      passed,
      failed,
      needsReview,
      results,
    };
  }
}

// ============================================================================
// WORKFLOW SERVICE
// ============================================================================

export class WorkflowService {
  private readonly transitions = [
    { from: 'draft', to: 'submitted', action: 'submit', allowedRoles: ['admin', 'editor', 'ai_agent'] },
    { from: 'submitted', to: 'automated_validation', action: 'start_validation', allowedRoles: ['system'], autoTransition: true },
    { from: 'automated_validation', to: 'automated_passed', action: 'validation_passed', allowedRoles: ['system'], autoTransition: true },
    { from: 'automated_validation', to: 'automated_failed', action: 'validation_failed', allowedRoles: ['system'], autoTransition: true },
    { from: 'automated_failed', to: 'pending_human_review', action: 'escalate', allowedRoles: ['system'], autoTransition: true },
    { from: 'automated_passed', to: 'approved', action: 'auto_approve', allowedRoles: ['system'] },
    { from: 'automated_passed', to: 'pending_human_review', action: 'request_review', allowedRoles: ['system', 'admin'] },
    { from: 'pending_human_review', to: 'in_review', action: 'start_review', allowedRoles: ['reviewer', 'admin'] },
    { from: 'in_review', to: 'approved', action: 'approve', allowedRoles: ['reviewer', 'admin'] },
    { from: 'in_review', to: 'rejected', action: 'reject', allowedRoles: ['reviewer', 'admin'] },
    { from: 'in_review', to: 'changes_requested', action: 'request_changes', allowedRoles: ['reviewer', 'admin'] },
    { from: 'changes_requested', to: 'draft', action: 'revise', allowedRoles: ['admin', 'editor', 'ai_agent'] },
    { from: 'approved', to: 'published', action: 'publish', allowedRoles: ['admin'] },
  ];

  /**
   * Get available transitions for current state
   */
  getAvailableTransitions(
    currentState: EvaluationWorkflowState,
    userRole: string
  ): { to: EvaluationWorkflowState; action: string }[] {
    return this.transitions
      .filter(t => t.from === currentState && t.allowedRoles.includes(userRole))
      .map(t => ({ to: t.to, action: t.action }));
  }

  /**
   * Execute a workflow transition
   */
  async executeTransition(
    entityType: 'task' | 'result',
    entityId: string,
    action: string,
    userId: string,
    userRole: string,
    note?: string
  ): Promise<{ success: boolean; newState?: EvaluationWorkflowState; error?: string }> {
    // Get current state
    const table = entityType === 'task' ? 'evaluation_tasks' : 'evaluation_results';
    const { data: current } = await supabase
      .from(table)
      .select('status')
      .eq('id', entityId)
      .single();

    if (!current) return { success: false, error: 'Entity not found' };

    const currentState = current.status as EvaluationWorkflowState;

    // Find valid transition
    const transition = this.transitions.find(
      t => t.from === currentState && t.action === action
    );

    if (!transition) {
      return { success: false, error: `Invalid transition: ${action} from ${currentState}` };
    }

    if (!transition.allowedRoles.includes(userRole) && !transition.allowedRoles.includes('system')) {
      return { success: false, error: `Role ${userRole} not allowed for this action` };
    }

    // Update state
    const updates: Record<string, unknown> = { status: transition.to };
    if (note) {
      updates[`${entityType}Notes`] = note;
    }

    const { error } = await supabase
      .from(table)
      .update(updates)
      .eq('id', entityId);

    if (error) {
      return { success: false, error: error.message };
    }

    // Record history
    await this.recordTransition(entityType, entityId, currentState, transition.to, userId, note);

    return { success: true, newState: transition.to };
  }

  private async recordTransition(
    entityType: string,
    entityId: string,
    fromState: string,
    toState: string,
    userId: string,
    note?: string
  ): Promise<void> {
    await supabase.from('evaluation_workflow_history').insert({
      entityType,
      entityId,
      fromState,
      toState,
      userId,
      note,
      createdAt: new Date().toISOString(),
    });
  }
}

// ============================================================================
// REVIEW QUEUE SERVICE
// ============================================================================

export class ReviewQueueService {
  /**
   * Add result to review queue
   */
  async addToQueue(
    resultId: string,
    taskId: string,
    failureReasons: string[]
  ): Promise<ReviewQueueItem> {
    const id = `queue_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    const now = new Date().toISOString();

    const item: ReviewQueueItem = {
      id,
      resultId,
      taskId,
      status: 'pending',
      priority: failureReasons.some(r => r.includes('safety') || r.includes('compliance'))
        ? 'critical'
        : 'high',
      routedFrom: 'automated',
      failureReasons,
      createdAt: now,
      updatedAt: now,
    };

    const { data, error } = await supabase
      .from('review_queue')
      .insert(item)
      .select()
      .single();

    if (error) throw new Error(`Failed to add to queue: ${error.message}`);
    return data;
  }

  /**
   * Get pending review items
   */
  async getPending(
    pagination: PaginationParams,
    filters: { priority?: string; assignedTo?: string } = {}
  ): Promise<{ items: ReviewQueueItem[]; total: number }> {
    let query = supabase
      .from('review_queue')
      .select('*', { count: 'exact' })
      .eq('status', 'pending');

    if (filters.priority) {
      query = query.eq('priority', filters.priority);
    }
    if (filters.assignedTo) {
      query = query.eq('assignedTo', filters.assignedTo);
    }

    const { page, limit } = pagination;
    query = query.range((page - 1) * limit, page * limit);
    query = query.order('priority', { ascending: false });
    query = query.order('createdAt', { ascending: true });

    const { data, error, count } = await query;
    if (error) throw new Error(`Failed to get queue: ${error.message}`);

    return { items: data || [], total: count || 0 };
  }

  /**
   * Assign review item
   */
  async assign(id: string, userId: string): Promise<void> {
    const { error } = await supabase
      .from('review_queue')
      .update({
        assignedTo: userId,
        assignedAt: new Date().toISOString(),
        status: 'in_review',
      })
      .eq('id', id);

    if (error) throw new Error(`Failed to assign: ${error.message}`);
  }

  /**
   * Complete review
   */
  async complete(
    id: string,
    decision: 'approve' | 'reject' | 'request_changes',
    note: string
  ): Promise<void> {
    const { error } = await supabase
      .from('review_queue')
      .update({
        status: 'completed',
        decision,
        decisionNote: note,
        decidedAt: new Date().toISOString(),
      })
      .eq('id', id);

    if (error) throw new Error(`Failed to complete: ${error.message}`);
  }
}

// ============================================================================
// VERSION HISTORY SERVICE
// ============================================================================

export class VersionHistoryService {
  async recordVersionChange(
    entityType: 'task' | 'checker' | 'rubric' | 'reference' | 'test_case',
    entityId: string,
    oldData: unknown,
    newData: unknown,
    userId: string,
    changeNote?: string
  ): Promise<void> {
    const changes: { field: string; oldValue: unknown; newValue: unknown }[] = [];
    
    for (const key of Object.keys(newData as Record<string, unknown>)) {
      const oldVal = (oldData as Record<string, unknown>)[key];
      const newVal = (newData as Record<string, unknown>)[key];
      if (JSON.stringify(oldVal) !== JSON.stringify(newVal)) {
        changes.push({ field: key, oldValue: oldVal, newValue: newVal });
      }
    }

    if (changes.length === 0) return;

    const { error } = await supabase.from('evaluation_version_history').insert({
      entityType,
      entityId,
      changes,
      author: userId,
      authorId: userId,
      changeNote,
      createdAt: new Date().toISOString(),
    });

    if (error) console.error(`Failed to record version: ${error.message}`);
  }

  async getHistory(
    entityType: string,
    entityId: string
  ): Promise<VersionHistory[]> {
    const { data, error } = await supabase
      .from('evaluation_version_history')
      .select('*')
      .eq('entityType', entityType)
      .eq('entityId', entityId)
      .order('createdAt', { ascending: false });

    if (error) throw new Error(`Failed to get history: ${error.message}`);
    return data || [];
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

export function validateTaskDefinition(task: Partial<EvaluationTaskDefinition>): string[] {
  const errors: string[] = [];

  if (!task.objective) errors.push('Objective is required');
  if (!task.name) errors.push('Name is required');
  if (!task.slug) errors.push('Slug is required');
  if (!task.domain) errors.push('Domain is required');

  // Validate category weights sum to 100
  if (task.completionCriteria) {
    const requiredWeight = task.completionCriteria
      .filter(c => c.isRequired)
      .reduce((sum, c) => sum + c.weight, 0);
    if (requiredWeight > 100) {
      errors.push('Required criteria weights exceed 100%');
    }
  }

  return errors;
}

export function calculateOverallScore(
  scores: RubricScores,
  rubric: ScoringRubric
): number {
  let total = 0;
  let weightSum = 0;

  for (const category of rubric.categories) {
    const weight = rubric.categoryWeights[category] || 0;
    const score = scores.categoryScores[category] || 0;
    total += score * weight;
    weightSum += weight;
  }

  return weightSum > 0 ? Math.round((total / weightSum) * 10) / 10 : 0;
}

// Export singleton instances
export const evaluationTaskService = new EvaluationTaskService();
export const checkerService = new CheckerService();
export const rubricService = new RubricService();
export const evaluationEngine = new EvaluationEngine();
export const workflowService = new WorkflowService();
export const reviewQueueService = new ReviewQueueService();
export const versionHistoryService = new VersionHistoryService();
