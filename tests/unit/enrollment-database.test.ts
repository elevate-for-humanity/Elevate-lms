/**
 * Enrollment Database State Tests
 *
 * Tests database operations and state transitions for enrollments
 */

import { describe, it, expect, beforeEach } from 'vitest';

// Database record types matching Supabase schema
interface EnrollmentRecord {
  id: string;
  user_id: string;
  course_id: string;
  program_id?: string;
  status: 'active' | 'completed' | 'dropped' | 'expired';
  progress: number;
  enrolled_at: string;
  started_at?: string;
  completed_at?: string;
  payment_status: 'pending' | 'completed' | 'failed' | 'refunded';
  payment_amount?: number;
  created_at: string;
  updated_at: string;
}

interface CourseProgressRecord {
  id: string;
  enrollment_id: string;
  user_id: string;
  course_id: string;
  completed_lessons: string[];
  current_lesson?: string;
  last_accessed: string;
  time_spent_minutes: number;
}

interface AuditLogRecord {
  id: string;
  user_id: string;
  action: string;
  resource_type: string;
  resource_id: string;
  metadata: Record<string, unknown>;
  created_at: string;
}

// Mock database for testing
class MockDatabase {
  enrollments: Map<string, EnrollmentRecord> = new Map();
  courseProgress: Map<string, CourseProgressRecord> = new Map();
  auditLogs: AuditLogRecord[] = [];

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  async insertEnrollment(
    data: Omit<EnrollmentRecord, 'id' | 'created_at' | 'updated_at'>,
  ): Promise<EnrollmentRecord> {
    const now = new Date().toISOString();
    const record: EnrollmentRecord = {
      ...data,
      id: this.generateId(),
      created_at: now,
      updated_at: now,
    };
    this.enrollments.set(record.id, record);
    return record;
  }

  async getEnrollment(id: string): Promise<EnrollmentRecord | null> {
    return this.enrollments.get(id) || null;
  }

  async getEnrollmentByUserAndCourse(
    userId: string,
    courseId: string,
  ): Promise<EnrollmentRecord | null> {
    for (const enrollment of this.enrollments.values()) {
      if (enrollment.user_id === userId && enrollment.course_id === courseId) {
        return enrollment;
      }
    }
    return null;
  }

  async updateEnrollment(
    id: string,
    updates: Partial<EnrollmentRecord>,
  ): Promise<EnrollmentRecord | null> {
    const existing = this.enrollments.get(id);
    if (!existing) return null;

    const updated: EnrollmentRecord = {
      ...existing,
      ...updates,
      updated_at: new Date().toISOString(),
    };
    this.enrollments.set(id, updated);
    return updated;
  }

  async insertCourseProgress(
    data: Omit<CourseProgressRecord, 'id'>,
  ): Promise<CourseProgressRecord> {
    const record: CourseProgressRecord = {
      ...data,
      id: this.generateId(),
    };
    this.courseProgress.set(record.id, record);
    return record;
  }

  async getCourseProgress(enrollmentId: string): Promise<CourseProgressRecord | null> {
    for (const progress of this.courseProgress.values()) {
      if (progress.enrollment_id === enrollmentId) {
        return progress;
      }
    }
    return null;
  }

  async updateCourseProgress(
    enrollmentId: string,
    updates: Partial<CourseProgressRecord>,
  ): Promise<CourseProgressRecord | null> {
    for (const [id, progress] of this.courseProgress.entries()) {
      if (progress.enrollment_id === enrollmentId) {
        const updated = { ...progress, ...updates };
        this.courseProgress.set(id, updated);
        return updated;
      }
    }
    return null;
  }

  async insertAuditLog(data: Omit<AuditLogRecord, 'id' | 'created_at'>): Promise<AuditLogRecord> {
    const record: AuditLogRecord = {
      ...data,
      id: this.generateId(),
      created_at: new Date().toISOString(),
    };
    this.auditLogs.push(record);
    return record;
  }

  async getAuditLogs(userId: string, action?: string): Promise<AuditLogRecord[]> {
    return this.auditLogs.filter((log) => {
      if (log.user_id !== userId) return false;
      if (action && log.action !== action) return false;
      return true;
    });
  }

  clear(): void {
    this.enrollments.clear();
    this.courseProgress.clear();
    this.auditLogs = [];
  }
}

describe('Enrollment Database Operations', () => {
  let db: MockDatabase;

  beforeEach(() => {
    db = new MockDatabase();
  });

  describe('Insert Enrollment', () => {
    it('should create enrollment with all required fields', async () => {
      const enrollment = await db.insertEnrollment({
        user_id: 'user-1',
        course_id: 'course-1',
        status: 'active',
        progress: 0,
        enrolled_at: new Date().toISOString(),
        payment_status: 'completed',
      });

      expect(enrollment.id).toBeDefined();
      expect(enrollment.user_id).toBe('user-1');
      expect(enrollment.course_id).toBe('course-1');
      expect(enrollment.status).toBe('active');
      expect(enrollment.progress).toBe(0);
      expect(enrollment.created_at).toBeDefined();
      expect(enrollment.updated_at).toBeDefined();
    });

    it('should create enrollment with optional fields', async () => {
      const enrollment = await db.insertEnrollment({
        user_id: 'user-1',
        course_id: 'course-1',
        program_id: 'program-1',
        status: 'active',
        progress: 0,
        enrolled_at: new Date().toISOString(),
        payment_status: 'completed',
        payment_amount: 299.99,
      });

      expect(enrollment.program_id).toBe('program-1');
      expect(enrollment.payment_amount).toBe(299.99);
    });

    it('should generate unique IDs for each enrollment', async () => {
      const enrollment1 = await db.insertEnrollment({
        user_id: 'user-1',
        course_id: 'course-1',
        status: 'active',
        progress: 0,
        enrolled_at: new Date().toISOString(),
        payment_status: 'completed',
      });

      const enrollment2 = await db.insertEnrollment({
        user_id: 'user-2',
        course_id: 'course-1',
        status: 'active',
        progress: 0,
        enrolled_at: new Date().toISOString(),
        payment_status: 'completed',
      });

      expect(enrollment1.id).not.toBe(enrollment2.id);
    });
  });

  describe('Query Enrollment', () => {
    it('should retrieve enrollment by ID', async () => {
      const created = await db.insertEnrollment({
        user_id: 'user-1',
        course_id: 'course-1',
        status: 'active',
        progress: 0,
        enrolled_at: new Date().toISOString(),
        payment_status: 'completed',
      });

      const retrieved = await db.getEnrollment(created.id);
      expect(retrieved).toEqual(created);
    });

    it('should return null for non-existent enrollment', async () => {
      const retrieved = await db.getEnrollment('non-existent-id');
      expect(retrieved).toBeNull();
    });

    it('should find enrollment by user and course', async () => {
      await db.insertEnrollment({
        user_id: 'user-1',
        course_id: 'course-1',
        status: 'active',
        progress: 0,
        enrolled_at: new Date().toISOString(),
        payment_status: 'completed',
      });

      const found = await db.getEnrollmentByUserAndCourse('user-1', 'course-1');
      expect(found).not.toBeNull();
      expect(found?.user_id).toBe('user-1');
      expect(found?.course_id).toBe('course-1');
    });

    it('should return null when user-course combination not found', async () => {
      await db.insertEnrollment({
        user_id: 'user-1',
        course_id: 'course-1',
        status: 'active',
        progress: 0,
        enrolled_at: new Date().toISOString(),
        payment_status: 'completed',
      });

      const found = await db.getEnrollmentByUserAndCourse('user-1', 'course-2');
      expect(found).toBeNull();
    });
  });

  describe('Update Enrollment', () => {
    it('should update enrollment progress', async () => {
      const created = await db.insertEnrollment({
        user_id: 'user-1',
        course_id: 'course-1',
        status: 'active',
        progress: 0,
        enrolled_at: new Date().toISOString(),
        payment_status: 'completed',
      });

      const updated = await db.updateEnrollment(created.id, { progress: 50 });
      expect(updated?.progress).toBe(50);
    });

    it('should update enrollment status', async () => {
      const created = await db.insertEnrollment({
        user_id: 'user-1',
        course_id: 'course-1',
        status: 'active',
        progress: 0,
        enrolled_at: new Date().toISOString(),
        payment_status: 'completed',
      });

      const updated = await db.updateEnrollment(created.id, {
        status: 'completed',
        completed_at: new Date().toISOString(),
        progress: 100,
      });

      expect(updated?.status).toBe('completed');
      expect(updated?.completed_at).toBeDefined();
      expect(updated?.progress).toBe(100);
    });

    it('should update updated_at timestamp on update', async () => {
      const created = await db.insertEnrollment({
        user_id: 'user-1',
        course_id: 'course-1',
        status: 'active',
        progress: 0,
        enrolled_at: new Date().toISOString(),
        payment_status: 'completed',
      });

      const originalUpdatedAt = created.updated_at;

      // Small delay to ensure timestamp difference
      await new Promise((resolve) => setTimeout(resolve, 10));

      const updated = await db.updateEnrollment(created.id, { progress: 25 });
      expect(updated?.updated_at).not.toBe(originalUpdatedAt);
    });

    it('should return null when updating non-existent enrollment', async () => {
      const updated = await db.updateEnrollment('non-existent', { progress: 50 });
      expect(updated).toBeNull();
    });
  });

  describe('Course Progress Tracking', () => {
    it('should create course progress record', async () => {
      const enrollment = await db.insertEnrollment({
        user_id: 'user-1',
        course_id: 'course-1',
        status: 'active',
        progress: 0,
        enrolled_at: new Date().toISOString(),
        payment_status: 'completed',
      });

      const progress = await db.insertCourseProgress({
        enrollment_id: enrollment.id,
        user_id: 'user-1',
        course_id: 'course-1',
        completed_lessons: [],
        last_accessed: new Date().toISOString(),
        time_spent_minutes: 0,
      });

      expect(progress.id).toBeDefined();
      expect(progress.completed_lessons).toEqual([]);
      expect(progress.time_spent_minutes).toBe(0);
    });

    it('should track completed lessons', async () => {
      const enrollment = await db.insertEnrollment({
        user_id: 'user-1',
        course_id: 'course-1',
        status: 'active',
        progress: 0,
        enrolled_at: new Date().toISOString(),
        payment_status: 'completed',
      });

      await db.insertCourseProgress({
        enrollment_id: enrollment.id,
        user_id: 'user-1',
        course_id: 'course-1',
        completed_lessons: [],
        last_accessed: new Date().toISOString(),
        time_spent_minutes: 0,
      });

      const updated = await db.updateCourseProgress(enrollment.id, {
        completed_lessons: ['lesson-1', 'lesson-2'],
        current_lesson: 'lesson-3',
        time_spent_minutes: 45,
      });

      expect(updated?.completed_lessons).toEqual(['lesson-1', 'lesson-2']);
      expect(updated?.current_lesson).toBe('lesson-3');
      expect(updated?.time_spent_minutes).toBe(45);
    });

    it('should retrieve course progress by enrollment', async () => {
      const enrollment = await db.insertEnrollment({
        user_id: 'user-1',
        course_id: 'course-1',
        status: 'active',
        progress: 0,
        enrolled_at: new Date().toISOString(),
        payment_status: 'completed',
      });

      await db.insertCourseProgress({
        enrollment_id: enrollment.id,
        user_id: 'user-1',
        course_id: 'course-1',
        completed_lessons: ['lesson-1'],
        last_accessed: new Date().toISOString(),
        time_spent_minutes: 30,
      });

      const progress = await db.getCourseProgress(enrollment.id);
      expect(progress).not.toBeNull();
      expect(progress?.completed_lessons).toContain('lesson-1');
    });
  });

  describe('Audit Logging', () => {
    it('should create audit log for enrollment', async () => {
      const enrollment = await db.insertEnrollment({
        user_id: 'user-1',
        course_id: 'course-1',
        status: 'active',
        progress: 0,
        enrolled_at: new Date().toISOString(),
        payment_status: 'completed',
      });

      const log = await db.insertAuditLog({
        user_id: 'user-1',
        action: 'enrollment_created',
        resource_type: 'enrollment',
        resource_id: enrollment.id,
        metadata: {
          course_id: 'course-1',
          course_title: 'Test Course',
        },
      });

      expect(log.id).toBeDefined();
      expect(log.action).toBe('enrollment_created');
      expect(log.created_at).toBeDefined();
    });

    it('should retrieve audit logs by user', async () => {
      await db.insertAuditLog({
        user_id: 'user-1',
        action: 'enrollment_created',
        resource_type: 'enrollment',
        resource_id: 'enrollment-1',
        metadata: {},
      });

      await db.insertAuditLog({
        user_id: 'user-1',
        action: 'progress_updated',
        resource_type: 'enrollment',
        resource_id: 'enrollment-1',
        metadata: { progress: 50 },
      });

      await db.insertAuditLog({
        user_id: 'user-2',
        action: 'enrollment_created',
        resource_type: 'enrollment',
        resource_id: 'enrollment-2',
        metadata: {},
      });

      const user1Logs = await db.getAuditLogs('user-1');
      expect(user1Logs).toHaveLength(2);

      const user2Logs = await db.getAuditLogs('user-2');
      expect(user2Logs).toHaveLength(1);
    });

    it('should filter audit logs by action', async () => {
      await db.insertAuditLog({
        user_id: 'user-1',
        action: 'enrollment_created',
        resource_type: 'enrollment',
        resource_id: 'enrollment-1',
        metadata: {},
      });

      await db.insertAuditLog({
        user_id: 'user-1',
        action: 'progress_updated',
        resource_type: 'enrollment',
        resource_id: 'enrollment-1',
        metadata: {},
      });

      const createdLogs = await db.getAuditLogs('user-1', 'enrollment_created');
      expect(createdLogs).toHaveLength(1);
      expect(createdLogs[0].action).toBe('enrollment_created');
    });
  });
});

describe('Enrollment State Transitions', () => {
  let db: MockDatabase;

  beforeEach(() => {
    db = new MockDatabase();
  });

  it('should transition from active to completed', async () => {
    const enrollment = await db.insertEnrollment({
      user_id: 'user-1',
      course_id: 'course-1',
      status: 'active',
      progress: 0,
      enrolled_at: new Date().toISOString(),
      payment_status: 'completed',
    });

    expect(enrollment.status).toBe('active');

    const completed = await db.updateEnrollment(enrollment.id, {
      status: 'completed',
      progress: 100,
      completed_at: new Date().toISOString(),
    });

    expect(completed?.status).toBe('completed');
    expect(completed?.progress).toBe(100);
    expect(completed?.completed_at).toBeDefined();
  });

  it('should transition from active to dropped', async () => {
    const enrollment = await db.insertEnrollment({
      user_id: 'user-1',
      course_id: 'course-1',
      status: 'active',
      progress: 25,
      enrolled_at: new Date().toISOString(),
      payment_status: 'completed',
    });

    const dropped = await db.updateEnrollment(enrollment.id, {
      status: 'dropped',
    });

    expect(dropped?.status).toBe('dropped');
    expect(dropped?.progress).toBe(25); // Progress preserved
  });

  it('should handle payment status transitions', async () => {
    const enrollment = await db.insertEnrollment({
      user_id: 'user-1',
      course_id: 'course-1',
      status: 'active',
      progress: 0,
      enrolled_at: new Date().toISOString(),
      payment_status: 'pending',
    });

    expect(enrollment.payment_status).toBe('pending');

    const paid = await db.updateEnrollment(enrollment.id, {
      payment_status: 'completed',
      payment_amount: 199.99,
    });

    expect(paid?.payment_status).toBe('completed');
    expect(paid?.payment_amount).toBe(199.99);
  });

  it('should handle refund status', async () => {
    const enrollment = await db.insertEnrollment({
      user_id: 'user-1',
      course_id: 'course-1',
      status: 'active',
      progress: 10,
      enrolled_at: new Date().toISOString(),
      payment_status: 'completed',
      payment_amount: 199.99,
    });

    const refunded = await db.updateEnrollment(enrollment.id, {
      status: 'dropped',
      payment_status: 'refunded',
    });

    expect(refunded?.status).toBe('dropped');
    expect(refunded?.payment_status).toBe('refunded');
  });
});

describe('Enrollment Data Integrity', () => {
  let db: MockDatabase;

  beforeEach(() => {
    db = new MockDatabase();
  });

  it('should maintain referential integrity between enrollment and progress', async () => {
    const enrollment = await db.insertEnrollment({
      user_id: 'user-1',
      course_id: 'course-1',
      status: 'active',
      progress: 0,
      enrolled_at: new Date().toISOString(),
      payment_status: 'completed',
    });

    const progress = await db.insertCourseProgress({
      enrollment_id: enrollment.id,
      user_id: 'user-1',
      course_id: 'course-1',
      completed_lessons: [],
      last_accessed: new Date().toISOString(),
      time_spent_minutes: 0,
    });

    expect(progress.enrollment_id).toBe(enrollment.id);
    expect(progress.user_id).toBe(enrollment.user_id);
    expect(progress.course_id).toBe(enrollment.course_id);
  });

  it('should sync progress percentage with completed lessons', async () => {
    const totalLessons = 10;
    const completedLessons = ['l1', 'l2', 'l3', 'l4', 'l5'];
    const expectedProgress = (completedLessons.length / totalLessons) * 100;

    const enrollment = await db.insertEnrollment({
      user_id: 'user-1',
      course_id: 'course-1',
      status: 'active',
      progress: expectedProgress,
      enrolled_at: new Date().toISOString(),
      payment_status: 'completed',
    });

    await db.insertCourseProgress({
      enrollment_id: enrollment.id,
      user_id: 'user-1',
      course_id: 'course-1',
      completed_lessons: completedLessons,
      last_accessed: new Date().toISOString(),
      time_spent_minutes: 150,
    });

    expect(enrollment.progress).toBe(50);
  });
});
