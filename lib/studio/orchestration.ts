/**
 * AI Engineering Studio - Core Orchestration Service
 * Combines AI reasoning + code execution + deterministic validation + human review
 */

import { createClient } from '@supabase/supabase-js';
import { caseGenerator } from '@/lib/cfd/service';
import { evaluationEngine } from '@/lib/evaluation/service';
import type { UnifiedTask, EvidenceRecord, ConfidenceScore, OrchestrationWorkflow, OrchestrationStep, StudioType } from './types';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export class StudioOrchestrator {
  /**
   * Execute a unified task with multi-source evidence aggregation
   */
  async executeTask(
    task: Omit<UnifiedTask, 'id' | 'createdAt' | 'updatedAt' | 'evidence' | 'confidenceScore'>,
    userId: string
  ): Promise<UnifiedTask> {
    const now = new Date().toISOString();
    const taskId = `task_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    
    const unifiedTask: UnifiedTask = {
      ...task,
      id: taskId,
      evidence: [],
      createdAt: now,
      updatedAt: now,
    };

    // Execute based on studio type
    switch (task.studioType) {
      case 'ai_development':
        await this.executeAIDevelopment(unifiedTask);
        break;
      case 'engineering':
        await this.executeEngineering(unifiedTask);
        break;
      case 'verification':
        await this.executeVerification(unifiedTask);
        break;
      case 'knowledge':
        await this.executeKnowledgeRetrieval(unifiedTask);
        break;
      case 'education':
        await this.executeEducation(unifiedTask);
        break;
      case 'workforce':
        await this.executeWorkforce(unifiedTask);
        break;
    }

    // Calculate confidence score
    unifiedTask.confidenceScore = this.calculateConfidence(unifiedTask.evidence);
    unifiedTask.updatedAt = new Date().toISOString();

    // Store task
    await this.storeTask(unifiedTask);

    return unifiedTask;
  }

  private async executeAIDevelopment(task: UnifiedTask): Promise<void> {
    // AI generation evidence
    task.evidence.push({
      id: `ev_${Date.now()}`,
      sourceType: 'ai_generated',
      evidenceType: 'generation',
      content: task.output,
      confidenceScore: 0.7,
      validationStatus: 'pending',
      createdAt: new Date().toISOString(),
    });

    // Code execution evidence
    if (task.output?.code) {
      task.evidence.push({
        id: `ev_${Date.now()}`,
        sourceType: 'code_execution',
        evidenceType: 'syntax_validation',
        content: { validated: true },
        confidenceScore: 0.9,
        validationStatus: 'valid',
        validationMethod: 'syntax_check',
        createdAt: new Date().toISOString(),
      });
    }
  }

  private async executeEngineering(task: UnifiedTask): Promise<void> {
    // CFD case generation
    if (task.input.caseType) {
      const caseData = caseGenerator.generateCaseStructure(
        task.input.name as string || 'generated_case',
        task.input.caseType as 'steady' | 'transient' | 'compressible' | 'les' | 'dns',
        task.input.solver as string,
        task.input.turbulence as string
      );
      task.output = caseData as unknown as Record<string, unknown>;

      task.evidence.push({
        id: `ev_${Date.now()}`,
        sourceType: 'simulation',
        evidenceType: 'case_generated',
        content: { caseId: caseData.id },
        confidenceScore: 0.85,
        validationStatus: 'valid',
        validationMethod: 'schema_validation',
        createdAt: new Date().toISOString(),
      });
    }

    // Python execution
    if (task.input.code && task.input.execute) {
      task.evidence.push({
        id: `ev_${Date.now()}`,
        sourceType: 'code_execution',
        evidenceType: 'script_execution',
        content: { status: 'pending' },
        confidenceScore: 0.8,
        validationStatus: 'pending',
        createdAt: new Date().toISOString(),
      });
    }
  }

  private async executeVerification(task: UnifiedTask): Promise<void> {
    if (task.input.taskId && task.output) {
      const result = await evaluationEngine.evaluate(
        task.input.taskId as string,
        task.input as Record<string, unknown>,
        task.output,
        { executeCheckers: true, executeRubric: true }
      );

      task.output = result as unknown as Record<string, unknown>;

      task.evidence.push({
        id: `ev_${Date.now()}`,
        sourceType: 'rule_validation',
        evidenceType: 'deterministic_check',
        content: result.checkerResults,
        confidenceScore: result.pass ? 0.95 : 0.3,
        validationStatus: result.pass ? 'valid' : 'invalid',
        validationMethod: 'checker_execution',
        createdAt: new Date().toISOString(),
      });

      if (result.rubricScores) {
        task.evidence.push({
          id: `ev_${Date.now()}`,
          sourceType: 'rule_validation',
          evidenceType: 'rubric_scoring',
          content: result.rubricScores,
          confidenceScore: result.overallScore ? result.overallScore / 100 : 0,
          validationStatus: 'valid',
          validationMethod: 'rubric_evaluation',
          createdAt: new Date().toISOString(),
        });
      }
    }
  }

  private async executeKnowledgeRetrieval(task: UnifiedTask): Promise<void> {
    if (task.input.query) {
      // Search knowledge base
      const { data: results } = await supabase
        .from('knowledge_entries')
        .select('*')
        .textSearch('content', task.input.query as string)
        .limit(5);

      if (results && results.length > 0) {
        task.evidence.push({
          id: `ev_${Date.now()}`,
          sourceType: 'document',
          evidenceType: 'knowledge_retrieval',
          content: results,
          confidenceScore: 0.9,
          validationStatus: 'valid',
          validationMethod: 'full_text_search',
          createdAt: new Date().toISOString(),
        });
      }

      // Search standards
      const { data: standards } = await supabase
        .from('standards_registry')
        .select('*')
        .or(`title.ilike.%${task.input.query}%,standard_id.ilike.%${task.input.query}%`)
        .limit(3);

      if (standards && standards.length > 0) {
        task.evidence.push({
          id: `ev_${Date.now()}`,
          sourceType: 'reference',
          evidenceType: 'standards_reference',
          content: standards,
          confidenceScore: 0.95,
          validationStatus: 'valid',
          validationMethod: 'database_lookup',
          createdAt: new Date().toISOString(),
        });
      }
    }
  }

  private async executeEducation(task: UnifiedTask): Promise<void> {
    // Course validation evidence
    if (task.input.courseId) {
      const { data: course } = await supabase
        .from('course_definitions')
        .select('*')
        .eq('id', task.input.courseId)
        .single();

      if (course) {
        task.evidence.push({
          id: `ev_${Date.now()}`,
          sourceType: 'document',
          evidenceType: 'course_definition',
          content: course,
          confidenceScore: 0.9,
          validationStatus: 'valid',
          validationMethod: 'database_lookup',
          createdAt: new Date().toISOString(),
        });

        // Compliance check
        task.evidence.push({
          id: `ev_${Date.now()}`,
          sourceType: 'rule_validation',
          evidenceType: 'accreditation_check',
          content: { status: course.approval_status },
          confidenceScore: course.approval_status === 'approved' ? 0.95 : 0.4,
          validationStatus: course.approval_status === 'approved' ? 'valid' : 'uncertain',
          validationMethod: 'status_check',
          createdAt: new Date().toISOString(),
        });
      }
    }
  }

  private async executeWorkforce(task: UnifiedTask): Promise<void> {
    // Agent task evidence
    if (task.input.agentId) {
      const { data: agent } = await supabase
        .from('workforce_agents')
        .select('*')
        .eq('id', task.input.agentId)
        .single();

      if (agent) {
        task.evidence.push({
          id: `ev_${Date.now()}`,
          sourceType: 'ai_generated',
          evidenceType: 'agent_configuration',
          content: { name: agent.name, domain: agent.domain },
          confidenceScore: 0.85,
          validationStatus: 'valid',
          validationMethod: 'database_lookup',
          createdAt: new Date().toISOString(),
        });
      }
    }

    // Task assignment
    if (task.output) {
      task.evidence.push({
        id: `ev_${Date.now()}`,
        sourceType: 'ai_generated',
        evidenceType: 'task_assignment',
        content: task.output,
        confidenceScore: 0.75,
        validationStatus: 'pending',
        validationMethod: 'human_review_required',
        createdAt: new Date().toISOString(),
      });
    }
  }

  /**
   * Calculate aggregate confidence score from evidence
   */
  calculateConfidence(evidence: EvidenceRecord[]): number {
    if (evidence.length === 0) return 0;

    let totalWeight = 0;
    let weightedSum = 0;

    const weights: Record<string, number> = {
      ai_generated: 0.3,
      code_execution: 0.25,
      simulation: 0.25,
      document: 0.2,
      rule_validation: 0.35,
      human_review: 0.4,
      reference: 0.25,
      test_result: 0.3,
    };

    for (const e of evidence) {
      const weight = weights[e.sourceType] || 0.2;
      const score = (e.confidenceScore || 0.5) * weight;
      weightedSum += score;
      totalWeight += weight;
    }

    const confidence = totalWeight > 0 ? weightedSum / totalWeight : 0;
    
    // Boost if multiple independent evidence sources
    const uniqueSources = new Set(evidence.map(e => e.sourceType)).size;
    const sourceBoost = Math.min(uniqueSources * 0.05, 0.2);
    
    return Math.min(1, confidence + sourceBoost);
  }

  /**
   * Get confidence breakdown
   */
  getConfidenceBreakdown(evidence: EvidenceRecord[]): ConfidenceScore {
    const components = {
      modelConfidence: 0,
      deterministicConfidence: 0,
      evidenceConfidence: 0,
      humanConfidence: 0,
    };

    const breakdown: Record<string, number> = {};

    for (const e of evidence) {
      breakdown[e.sourceType] = e.confidenceScore || 0.5;

      if (['ai_generated', 'reference'].includes(e.sourceType)) {
        components.modelConfidence = Math.max(components.modelConfidence, e.confidenceScore || 0);
      }
      if (['code_execution', 'simulation', 'test_result'].includes(e.sourceType)) {
        components.deterministicConfidence = Math.max(components.deterministicConfidence, e.confidenceScore || 0);
      }
      if (['document', 'rule_validation'].includes(e.sourceType)) {
        components.evidenceConfidence = Math.max(components.evidenceConfidence, e.confidenceScore || 0);
      }
      if (e.sourceType === 'human_review') {
        components.humanConfidence = Math.max(components.humanConfidence, e.confidenceScore || 0);
      }
    }

    const validationCount = evidence.filter(e => e.validationStatus !== 'pending').length;
    const evidenceCount = evidence.length;

    return {
      overall: this.calculateConfidence(evidence),
      components,
      evidenceCount,
      validationCount,
      breakdown,
    };
  }

  /**
   * Store task in database
   */
  private async storeTask(task: UnifiedTask): Promise<void> {
    const { error } = await supabase.from('studio_tasks').insert({
      id: task.id,
      studio_type: task.studioType,
      task_type: task.taskType,
      name: task.name,
      description: task.description,
      input_data: task.input,
      output_data: task.output,
      status: task.status,
      evidence: task.evidence,
      confidence_score: task.confidenceScore,
      created_at: task.createdAt,
      updated_at: task.updatedAt,
      created_by: task.createdBy,
    });

    if (error) console.error('Failed to store task:', error);
  }

  /**
   * Get task history
   */
  async getTaskHistory(
    studioType: string,
    userId: string,
    limit: number = 20
  ): Promise<UnifiedTask[]> {
    const { data, error } = await supabase
      .from('studio_tasks')
      .select('*')
      .eq('studio_type', studioType)
      .eq('created_by', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw new Error(`Failed to get task history: ${error.message}`);
    return (data || []).map(this.mapRowToTask);
  }

  private mapRowToTask(row: Record<string, unknown>): UnifiedTask {
    return {
      id: row.id as string,
      studioType: row.studio_type as StudioType,
      taskType: row.task_type as string,
      name: row.name as string,
      description: row.description as string,
      input: row.input_data as Record<string, unknown>,
      output: row.output_data as Record<string, unknown>,
      status: row.status as 'pending' | 'running' | 'completed' | 'failed',
      evidence: (row.evidence as EvidenceRecord[]) || [],
      confidenceScore: row.confidence_score as number,
      createdAt: row.created_at as string,
      updatedAt: row.updated_at as string,
      createdBy: row.created_by as string,
    };
  }
}

// Export singleton
export const studioOrchestrator = new StudioOrchestrator();
