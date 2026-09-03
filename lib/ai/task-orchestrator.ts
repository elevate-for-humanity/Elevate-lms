/**
 * AI Gateway Module - Task Orchestrator
 *
 * Unified task orchestration with priority queue, auto-retry,
 * timeout handling, and event subscriptions.
 */

import {
  AIAgent,
  AgentIntent,
  TaskPriority,
  TaskStatus,
} from './types';

import type {
  TaskPayload,
  TaskCreationOptions,
  TaskFilterOptions,
} from './types';

// ============================================================
// Priority Queue Implementation
// ============================================================

class PriorityQueue {
  private items: TaskPayload[] = [];

  get length(): number {
    return this.items.length;
  }

  enqueue(item: TaskPayload): void {
    this.items.push(item);
    this.bubbleUp(this.items.length - 1);
  }

  dequeue(): TaskPayload | undefined {
    if (this.items.length === 0) return undefined;
    
    const result = this.items[0];
    const last = this.items.pop();
    
    if (this.items.length > 0 && last) {
      this.items[0] = last;
      this.bubbleDown(0);
    }
    
    return result;
  }

  peek(): TaskPayload | undefined {
    return this.items[0];
  }

  remove(predicate: (item: TaskPayload) => boolean): TaskPayload | undefined {
    const index = this.items.findIndex(predicate);
    if (index === -1) return undefined;
    
    const result = this.items[index];
    const last = this.items.pop();
    
    if (index < this.items.length && last) {
      this.items[index] = last;
      this.bubbleDown(index);
    }
    
    return result;
  }

  private bubbleUp(index: number): void {
    while (index > 0) {
      const parentIndex = Math.floor((index - 1) / 2);
      if (this.compare(this.items[index], this.items[parentIndex]) >= 0) break;
      [this.items[index], this.items[parentIndex]] = [this.items[parentIndex], this.items[index]];
      index = parentIndex;
    }
  }

  private bubbleDown(index: number): void {
    const length = this.items.length;
    while (true) {
      const leftChild = 2 * index + 1;
      const rightChild = 2 * index + 2;
      let smallest = index;

      if (leftChild < length && this.compare(this.items[leftChild], this.items[smallest]) < 0) {
        smallest = leftChild;
      }
      if (rightChild < length && this.compare(this.items[rightChild], this.items[smallest]) < 0) {
        smallest = rightChild;
      }
      if (smallest === index) break;

      [this.items[index], this.items[smallest]] = [this.items[smallest], this.items[index]];
      index = smallest;
    }
  }

  private compare(a: TaskPayload, b: TaskPayload): number {
    // Higher priority comes first
    const priorityOrder = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
    const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
    if (priorityDiff !== 0) return priorityDiff;

    // Earlier creation time comes first
    return a.createdAt - b.createdAt;
  }

  toArray(): TaskPayload[] {
    return [...this.items];
  }
}

// ============================================================
// Task Orchestrator Implementation
// ============================================================

export class TaskOrchestrator {
  private tasks: Map<string, TaskPayload> = new Map();
  private taskQueue: PriorityQueue = new PriorityQueue();
  private taskSubscriptions: Map<string, Set<(task: TaskPayload) => void>> = new Map();
  private timeoutTimers: Map<string, ReturnType<typeof setTimeout>> = new Map();
  private retryTimers: Map<string, ReturnType<typeof setTimeout>> = new Map();
  
  private readonly defaultTimeout = 5 * 60 * 1000; // 5 minutes
  private readonly maxRetries = 3;
  private readonly retryDelay = 5000; // 5 seconds

  constructor() {
    // Start the queue processor
    this.processQueue();
  }

  /**
   * Generate a unique task ID
   */
  private generateTaskId(): string {
    return `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get priority from options or default to MEDIUM
   */
  private getPriority(options?: TaskCreationOptions): TaskPriority {
    return options?.priority || TaskPriority.MEDIUM;
  }

  /**
   * Get timeout from options or default
   */
  private getTimeout(options?: TaskCreationOptions): number {
    return options?.timeout || this.defaultTimeout;
  }

  /**
   * Get max attempts from options or default
   */
  private getMaxAttempts(options?: TaskCreationOptions): number {
    return options?.maxAttempts || this.maxRetries;
  }

  /**
   * Create a new task
   */
  createTask(
    agent: AIAgent,
    intent: AgentIntent,
    payload: TaskPayload['payload'],
    priority?: TaskPriority
  ): string {
    const taskId = this.generateTaskId();
    const now = Date.now();

    const task: TaskPayload = {
      id: taskId,
      agentType: agent,
      intent,
      payload,
      priority: priority || this.getPriority({ agent, intent, payload, priority }),
      status: TaskStatus.QUEUED,
      attempts: 0,
      maxAttempts: this.getMaxAttempts(),
      timeout: this.getTimeout(),
      createdAt: now,
      updatedAt: now,
    };

    this.tasks.set(taskId, task);
    this.taskQueue.enqueue(task);
    this.notifySubscribers(task);

    // Set timeout for task
    this.setTaskTimeout(taskId);

    return taskId;
  }

  /**
   * Create task from TaskCreationOptions
   */
  createTaskFromOptions(options: TaskCreationOptions): string {
    return this.createTask(
      options.agent,
      options.intent,
      options.payload,
      options.priority
    );
  }

  /**
   * Get a task by ID
   */
  getTask(taskId: string): TaskPayload | null {
    return this.tasks.get(taskId) || null;
  }

  /**
   * Update task with partial updates
   */
  updateTask(taskId: string, updates: Partial<TaskPayload>): void {
    const task = this.tasks.get(taskId);
    if (!task) {
      throw new Error(`Task not found: ${taskId}`);
    }

    const updatedTask: TaskPayload = {
      ...task,
      ...updates,
      updatedAt: Date.now(),
    };

    this.tasks.set(taskId, updatedTask);
    this.notifySubscribers(updatedTask);
  }

  /**
   * Mark task as completed
   */
  completeTask(taskId: string, result: unknown): void {
    const task = this.tasks.get(taskId);
    if (!task) {
      throw new Error(`Task not found: ${taskId}`);
    }

    this.clearTaskTimeout(taskId);
    this.clearTaskRetry(taskId);

    const completedTask: TaskPayload = {
      ...task,
      status: TaskStatus.COMPLETED,
      result,
      completedAt: Date.now(),
      updatedAt: Date.now(),
    };

    this.tasks.set(taskId, completedTask);
    this.notifySubscribers(completedTask);
  }

  /**
   * Mark task as failed
   */
  failTask(taskId: string, error: string): void {
    const task = this.tasks.get(taskId);
    if (!task) {
      throw new Error(`Task not found: ${taskId}`);
    }

    const failedTask: TaskPayload = {
      ...task,
      status: TaskStatus.FAILED,
      error,
      attempts: task.attempts + 1,
      updatedAt: Date.now(),
    };

    this.tasks.set(taskId, failedTask);
    this.notifySubscribers(failedTask);

    // Auto-retry if attempts remaining
    if (failedTask.attempts < failedTask.maxAttempts) {
      this.scheduleRetry(taskId);
    } else {
      this.clearTaskTimeout(taskId);
    }
  }

  /**
   * Start processing a task
   */
  startTask(taskId: string): void {
    const task = this.tasks.get(taskId);
    if (!task) {
      throw new Error(`Task not found: ${taskId}`);
    }

    // Remove from queue if present
    this.taskQueue.remove((t) => t.id === taskId);

    const startedTask: TaskPayload = {
      ...task,
      status: TaskStatus.IN_PROGRESS,
      startedAt: Date.now(),
      updatedAt: Date.now(),
    };

    this.tasks.set(taskId, startedTask);
    this.notifySubscribers(startedTask);
    this.setTaskTimeout(taskId);
  }

  /**
   * Set task to pending approval
   */
  pendingApproval(taskId: string): void {
    this.updateTask(taskId, { status: TaskStatus.PENDING_APPROVAL });
  }

  /**
   * Get all tasks for an agent
   */
  getTasksByAgent(agent: AIAgent): TaskPayload[] {
    return Array.from(this.tasks.values()).filter((t) => t.agentType === agent);
  }

  /**
   * Get all tasks by status
   */
  getTasksByStatus(status: TaskStatus): TaskPayload[] {
    return Array.from(this.tasks.values()).filter((t) => t.status === status);
  }

  /**
   * Get pending tasks from queue
   */
  getPendingTasks(limit?: number): TaskPayload[] {
    const pending = this.taskQueue.toArray().filter((t) => t.status === TaskStatus.QUEUED);
    if (limit) {
      return pending.slice(0, limit);
    }
    return pending;
  }

  /**
   * Get tasks with optional filters
   */
  getTasks(filter?: TaskFilterOptions): TaskPayload[] {
    let tasks = Array.from(this.tasks.values());

    if (filter?.agent) {
      tasks = tasks.filter((t) => t.agentType === filter.agent);
    }
    if (filter?.status) {
      tasks = tasks.filter((t) => t.status === filter.status);
    }
    if (filter?.intent) {
      tasks = tasks.filter((t) => t.intent === filter.intent);
    }

    // Sort by priority and creation time
    const priorityOrder: Record<TaskPriority, number> = {
      [TaskPriority.CRITICAL]: 0,
      [TaskPriority.HIGH]: 1,
      [TaskPriority.MEDIUM]: 2,
      [TaskPriority.LOW]: 3,
    };

    tasks.sort((a, b) => {
      const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
      if (priorityDiff !== 0) return priorityDiff;
      return a.createdAt - b.createdAt;
    });

    if (filter?.offset) {
      tasks = tasks.slice(filter.offset);
    }
    if (filter?.limit) {
      tasks = tasks.slice(0, filter.limit);
    }

    return tasks;
  }

  /**
   * Subscribe to task updates
   */
  subscribeToTask(taskId: string, callback: (task: TaskPayload) => void): () => void {
    if (!this.taskSubscriptions.has(taskId)) {
      this.taskSubscriptions.set(taskId, new Set());
    }
    this.taskSubscriptions.get(taskId)!.add(callback);

    // Return unsubscribe function
    return () => {
      const subs = this.taskSubscriptions.get(taskId);
      if (subs) {
        subs.delete(callback);
      }
    };
  }

  /**
   * Notify subscribers of task update
   */
  private notifySubscribers(task: TaskPayload): void {
    const subs = this.taskSubscriptions.get(task.id);
    if (subs) {
      subs.forEach((callback) => {
        try {
          callback(task);
        } catch (error) {
          console.error(`Error in task subscription callback:`, error);
        }
      });
    }
  }

  /**
   * Set timeout for task
   */
  private setTaskTimeout(taskId: string): void {
    const task = this.tasks.get(taskId);
    if (!task) return;

    // Clear existing timeout
    this.clearTaskTimeout(taskId);

    const timer = setTimeout(() => {
      this.handleTaskTimeout(taskId);
    }, task.timeout);

    this.timeoutTimers.set(taskId, timer);
  }

  /**
   * Handle task timeout
   */
  private handleTaskTimeout(taskId: string): void {
    const task = this.tasks.get(taskId);
    if (!task) return;

    // Only fail if still in progress
    if (task.status === TaskStatus.IN_PROGRESS) {
      this.failTask(taskId, `Task timed out after ${task.timeout}ms`);
    }

    this.timeoutTimers.delete(taskId);
  }

  /**
   * Clear task timeout
   */
  private clearTaskTimeout(taskId: string): void {
    const timer = this.timeoutTimers.get(taskId);
    if (timer) {
      clearTimeout(timer);
      this.timeoutTimers.delete(taskId);
    }
  }

  /**
   * Schedule retry for failed task
   */
  private scheduleRetry(taskId: string): void {
    const task = this.tasks.get(taskId);
    if (!task) return;

    // Clear existing retry timer
    this.clearTaskRetry(taskId);

    const timer = setTimeout(() => {
      const retriedTask = this.tasks.get(taskId);
      if (retriedTask && retriedTask.status === TaskStatus.FAILED) {
        // Re-queue the task
        const retryTask: TaskPayload = {
          ...retriedTask,
          status: TaskStatus.QUEUED,
          updatedAt: Date.now(),
        };
        this.tasks.set(taskId, retryTask);
        this.taskQueue.enqueue(retryTask);
        this.notifySubscribers(retryTask);
        this.setTaskTimeout(taskId);
      }
      this.retryTimers.delete(taskId);
    }, this.retryDelay);

    this.retryTimers.set(taskId, timer);
  }

  /**
   * Clear task retry timer
   */
  private clearTaskRetry(taskId: string): void {
    const timer = this.retryTimers.get(taskId);
    if (timer) {
      clearTimeout(timer);
      this.retryTimers.delete(taskId);
    }
  }

  /**
   * Process the task queue
   */
  private processQueue(): void {
    // Process tasks in queue every 100ms
    setInterval(() => {
      const task = this.taskQueue.peek();
      if (task && task.status === TaskStatus.QUEUED) {
        // Task is available for processing
        // The actual execution would be handled by the agent executor
      }
    }, 100);
  }

  /**
   * Get orchestrator statistics
   */
  getStats(): {
    total: number;
    queued: number;
    inProgress: number;
    completed: number;
    failed: number;
    pendingApproval: number;
    byAgent: Record<string, number>;
    byIntent: Record<string, number>;
    queueDepth: number;
  } {
    const tasks = Array.from(this.tasks.values());

    const stats = {
      total: tasks.length,
      queued: tasks.filter((t) => t.status === TaskStatus.QUEUED).length,
      inProgress: tasks.filter((t) => t.status === TaskStatus.IN_PROGRESS).length,
      completed: tasks.filter((t) => t.status === TaskStatus.COMPLETED).length,
      failed: tasks.filter((t) => t.status === TaskStatus.FAILED).length,
      pendingApproval: tasks.filter((t) => t.status === TaskStatus.PENDING_APPROVAL).length,
      byAgent: {} as Record<string, number>,
      byIntent: {} as Record<string, number>,
      queueDepth: this.taskQueue.length,
    };

    tasks.forEach((task) => {
      stats.byAgent[task.agentType] = (stats.byAgent[task.agentType] || 0) + 1;
      stats.byIntent[task.intent] = (stats.byIntent[task.intent] || 0) + 1;
    });

    return stats;
  }

  /**
   * Cancel a task
   */
  cancelTask(taskId: string): boolean {
    const task = this.tasks.get(taskId);
    if (!task) return false;

    if (task.status === TaskStatus.QUEUED) {
      // Remove from queue
      this.taskQueue.remove((t) => t.id === taskId);
    }

    this.clearTaskTimeout(taskId);
    this.clearTaskRetry(taskId);

    const cancelledTask: TaskPayload = {
      ...task,
      status: TaskStatus.FAILED,
      error: 'Task cancelled',
      updatedAt: Date.now(),
    };

    this.tasks.set(taskId, cancelledTask);
    this.notifySubscribers(cancelledTask);

    return true;
  }

  /**
   * Clear completed tasks older than specified time
   */
  clearCompletedTasks(olderThanMs?: number): number {
    const cutoff = olderThanMs ? Date.now() - olderThanMs : Date.now();
    let cleared = 0;

    this.tasks.forEach((task, taskId) => {
      if (task.status === TaskStatus.COMPLETED && task.completedAt && task.completedAt < cutoff) {
        this.tasks.delete(taskId);
        this.taskSubscriptions.delete(taskId);
        cleared++;
      }
    });

    return cleared;
  }
}

// ============================================================
// Singleton Instance
// ============================================================

let taskOrchestratorInstance: TaskOrchestrator | null = null;

export function getTaskOrchestrator(): TaskOrchestrator {
  if (!taskOrchestratorInstance) {
    taskOrchestratorInstance = new TaskOrchestrator();
  }
  return taskOrchestratorInstance;
}

export function resetTaskOrchestrator(): void {
  taskOrchestratorInstance = null;
}

export { AIAgent, AgentIntent, TaskPriority, TaskStatus };
export type { TaskPayload, TaskCreationOptions, TaskFilterOptions };
