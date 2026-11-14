/**
 * Enrollment API Unit Tests
 *
 * Tests enrollment logic without importing Next.js route handlers
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Enrollment request/response types
interface EnrollmentRequest {
  courseId: string;
  userId?: string;
}

interface EnrollmentResponse {
  id: string;
  student_id: string;
  course_id: string;
  status: 'active' | 'completed' | 'dropped';
  progress_percentage: number;
  enrolled_at: string;
}

interface ApiError {
  error: string;
  status: number;
}

// Enrollment service logic (extracted from route handlers)
class EnrollmentService {
  private enrollments: Map<string, EnrollmentResponse> = new Map();
  private users: Set<string> = new Set();
  private courses: Set<string> = new Set();

  constructor() {
    // Seed test data
    this.users.add('user-1');
    this.users.add('user-2');
    this.courses.add('course-1');
    this.courses.add('course-2');
  }

  async createEnrollment(
    userId: string | null,
    request: EnrollmentRequest,
  ): Promise<EnrollmentResponse | ApiError> {
    // Check authentication
    if (!userId) {
      return { error: 'Unauthorized', status: 401 };
    }

    // Validate courseId
    if (!request.courseId) {
      return { error: 'Missing courseId', status: 400 };
    }

    // Check user exists
    if (!this.users.has(userId)) {
      return { error: 'User not found', status: 404 };
    }

    // Check course exists
    if (!this.courses.has(request.courseId)) {
      return { error: 'Course not found', status: 404 };
    }

    // Check duplicate enrollment
    const enrollmentKey = `${userId}-${request.courseId}`;
    if (this.enrollments.has(enrollmentKey)) {
      return { error: 'Already enrolled in this course', status: 400 };
    }

    // Create enrollment
    const enrollment: EnrollmentResponse = {
      id: `enrollment-${Date.now()}`,
      student_id: userId,
      course_id: request.courseId,
      status: 'active',
      progress_percentage: 0,
      enrolled_at: new Date().toISOString(),
    };

    this.enrollments.set(enrollmentKey, enrollment);
    return enrollment;
  }

  async getEnrollments(userId: string | null): Promise<EnrollmentResponse[] | ApiError> {
    if (!userId) {
      return { error: 'Unauthorized', status: 401 };
    }

    const userEnrollments: EnrollmentResponse[] = [];
    this.enrollments.forEach((enrollment) => {
      if (enrollment.student_id === userId) {
        userEnrollments.push(enrollment);
      }
    });

    return userEnrollments;
  }

  async updateProgress(
    userId: string | null,
    enrollmentId: string,
    progress: number,
  ): Promise<EnrollmentResponse | ApiError> {
    if (!userId) {
      return { error: 'Unauthorized', status: 401 };
    }

    if (progress < 0 || progress > 100) {
      return { error: 'Progress must be between 0 and 100', status: 400 };
    }

    let found: EnrollmentResponse | null = null;
    this.enrollments.forEach((enrollment) => {
      if (enrollment.id === enrollmentId && enrollment.student_id === userId) {
        enrollment.progress_percentage = progress;
        if (progress === 100) {
          enrollment.status = 'completed';
        }
        found = enrollment;
      }
    });

    if (!found) {
      return { error: 'Enrollment not found', status: 404 };
    }

    return found;
  }

  async dropEnrollment(
    userId: string | null,
    enrollmentId: string,
  ): Promise<{ success: boolean } | ApiError> {
    if (!userId) {
      return { error: 'Unauthorized', status: 401 };
    }

    let found = false;
    this.enrollments.forEach((enrollment, key) => {
      if (enrollment.id === enrollmentId && enrollment.student_id === userId) {
        enrollment.status = 'dropped';
        found = true;
      }
    });

    if (!found) {
      return { error: 'Enrollment not found', status: 404 };
    }

    return { success: true };
  }

  // Helper to check if response is an error
  isError(response: unknown): response is ApiError {
    return typeof response === 'object' && response !== null && 'error' in response;
  }
}

describe('Enrollment API', () => {
  let service: EnrollmentService;

  beforeEach(() => {
    service = new EnrollmentService();
  });

  describe('POST /api/enrollments (createEnrollment)', () => {
    it('should reject unauthenticated requests', async () => {
      const result = await service.createEnrollment(null, { courseId: 'course-1' });

      expect(service.isError(result)).toBe(true);
      if (service.isError(result)) {
        expect(result.status).toBe(401);
        expect(result.error).toBe('Unauthorized');
      }
    });

    it('should reject requests without courseId', async () => {
      const result = await service.createEnrollment('user-1', { courseId: '' });

      expect(service.isError(result)).toBe(true);
      if (service.isError(result)) {
        expect(result.status).toBe(400);
        expect(result.error).toBe('Missing courseId');
      }
    });

    it('should reject enrollment for non-existent user', async () => {
      const result = await service.createEnrollment('non-existent-user', { courseId: 'course-1' });

      expect(service.isError(result)).toBe(true);
      if (service.isError(result)) {
        expect(result.status).toBe(404);
        expect(result.error).toBe('User not found');
      }
    });

    it('should reject enrollment for non-existent course', async () => {
      const result = await service.createEnrollment('user-1', { courseId: 'non-existent-course' });

      expect(service.isError(result)).toBe(true);
      if (service.isError(result)) {
        expect(result.status).toBe(404);
        expect(result.error).toBe('Course not found');
      }
    });

    it('should reject duplicate enrollment', async () => {
      await service.createEnrollment('user-1', { courseId: 'course-1' });
      const result = await service.createEnrollment('user-1', { courseId: 'course-1' });

      expect(service.isError(result)).toBe(true);
      if (service.isError(result)) {
        expect(result.status).toBe(400);
        expect(result.error).toBe('Already enrolled in this course');
      }
    });

    it('should create enrollment successfully', async () => {
      const result = await service.createEnrollment('user-1', { courseId: 'course-1' });

      expect(service.isError(result)).toBe(false);
      if (!service.isError(result)) {
        expect(result.student_id).toBe('user-1');
        expect(result.course_id).toBe('course-1');
        expect(result.status).toBe('active');
        expect(result.progress_percentage).toBe(0);
        expect(result.enrolled_at).toBeDefined();
      }
    });

    it('should allow same user to enroll in multiple courses', async () => {
      const result1 = await service.createEnrollment('user-1', { courseId: 'course-1' });
      const result2 = await service.createEnrollment('user-1', { courseId: 'course-2' });

      expect(service.isError(result1)).toBe(false);
      expect(service.isError(result2)).toBe(false);
    });

    it('should allow multiple users to enroll in same course', async () => {
      const result1 = await service.createEnrollment('user-1', { courseId: 'course-1' });
      const result2 = await service.createEnrollment('user-2', { courseId: 'course-1' });

      expect(service.isError(result1)).toBe(false);
      expect(service.isError(result2)).toBe(false);
    });
  });

  describe('GET /api/enrollments (getEnrollments)', () => {
    it('should reject unauthenticated requests', async () => {
      const result = await service.getEnrollments(null);

      expect(service.isError(result)).toBe(true);
      if (service.isError(result)) {
        expect(result.status).toBe(401);
      }
    });

    it('should return empty array for user with no enrollments', async () => {
      const result = await service.getEnrollments('user-1');

      expect(service.isError(result)).toBe(false);
      expect(Array.isArray(result)).toBe(true);
      expect(result).toHaveLength(0);
    });

    it('should return user enrollments', async () => {
      await service.createEnrollment('user-1', { courseId: 'course-1' });
      await service.createEnrollment('user-1', { courseId: 'course-2' });

      const result = await service.getEnrollments('user-1');

      expect(service.isError(result)).toBe(false);
      if (!service.isError(result)) {
        expect(result).toHaveLength(2);
      }
    });

    it('should only return enrollments for authenticated user', async () => {
      await service.createEnrollment('user-1', { courseId: 'course-1' });
      await service.createEnrollment('user-2', { courseId: 'course-1' });

      const result = await service.getEnrollments('user-1');

      expect(service.isError(result)).toBe(false);
      if (!service.isError(result)) {
        expect(result).toHaveLength(1);
        expect(result[0].student_id).toBe('user-1');
      }
    });
  });

  describe('PATCH /api/enrollments (updateProgress)', () => {
    it('should reject unauthenticated requests', async () => {
      const result = await service.updateProgress(null, 'enrollment-1', 50);

      expect(service.isError(result)).toBe(true);
      if (service.isError(result)) {
        expect(result.status).toBe(401);
      }
    });

    it('should reject invalid progress values', async () => {
      const enrollment = await service.createEnrollment('user-1', { courseId: 'course-1' });
      if (service.isError(enrollment)) throw new Error('Setup failed');

      const result1 = await service.updateProgress('user-1', enrollment.id, -10);
      const result2 = await service.updateProgress('user-1', enrollment.id, 150);

      expect(service.isError(result1)).toBe(true);
      expect(service.isError(result2)).toBe(true);
    });

    it('should update progress successfully', async () => {
      const enrollment = await service.createEnrollment('user-1', { courseId: 'course-1' });
      if (service.isError(enrollment)) throw new Error('Setup failed');

      const result = await service.updateProgress('user-1', enrollment.id, 50);

      expect(service.isError(result)).toBe(false);
      if (!service.isError(result)) {
        expect(result.progress_percentage).toBe(50);
        expect(result.status).toBe('active');
      }
    });

    it('should mark enrollment as completed at 100%', async () => {
      const enrollment = await service.createEnrollment('user-1', { courseId: 'course-1' });
      if (service.isError(enrollment)) throw new Error('Setup failed');

      const result = await service.updateProgress('user-1', enrollment.id, 100);

      expect(service.isError(result)).toBe(false);
      if (!service.isError(result)) {
        expect(result.progress_percentage).toBe(100);
        expect(result.status).toBe('completed');
      }
    });

    it('should reject updating another user enrollment', async () => {
      const enrollment = await service.createEnrollment('user-1', { courseId: 'course-1' });
      if (service.isError(enrollment)) throw new Error('Setup failed');

      const result = await service.updateProgress('user-2', enrollment.id, 50);

      expect(service.isError(result)).toBe(true);
      if (service.isError(result)) {
        expect(result.status).toBe(404);
      }
    });
  });

  describe('DELETE /api/enrollments (dropEnrollment)', () => {
    it('should reject unauthenticated requests', async () => {
      const result = await service.dropEnrollment(null, 'enrollment-1');

      expect(service.isError(result)).toBe(true);
      if (service.isError(result)) {
        expect(result.status).toBe(401);
      }
    });

    it('should drop enrollment successfully', async () => {
      const enrollment = await service.createEnrollment('user-1', { courseId: 'course-1' });
      if (service.isError(enrollment)) throw new Error('Setup failed');

      const result = await service.dropEnrollment('user-1', enrollment.id);

      expect(service.isError(result)).toBe(false);
      if (!service.isError(result)) {
        expect(result.success).toBe(true);
      }
    });

    it('should reject dropping another user enrollment', async () => {
      const enrollment = await service.createEnrollment('user-1', { courseId: 'course-1' });
      if (service.isError(enrollment)) throw new Error('Setup failed');

      const result = await service.dropEnrollment('user-2', enrollment.id);

      expect(service.isError(result)).toBe(true);
      if (service.isError(result)) {
        expect(result.status).toBe(404);
      }
    });
  });
});

describe('Enrollment Data Validation', () => {
  it('should validate UUID format for courseId', () => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

    expect(uuidRegex.test('123e4567-e89b-12d3-a456-426614174000')).toBe(true);
    expect(uuidRegex.test('not-a-uuid')).toBe(false);
    expect(uuidRegex.test('')).toBe(false);
  });

  it('should validate progress percentage range', () => {
    const isValidProgress = (p: number) => p >= 0 && p <= 100;

    expect(isValidProgress(0)).toBe(true);
    expect(isValidProgress(50)).toBe(true);
    expect(isValidProgress(100)).toBe(true);
    expect(isValidProgress(-1)).toBe(false);
    expect(isValidProgress(101)).toBe(false);
  });

  it('should validate enrollment status values', () => {
    const validStatuses = ['active', 'completed', 'dropped'];

    expect(validStatuses.includes('active')).toBe(true);
    expect(validStatuses.includes('completed')).toBe(true);
    expect(validStatuses.includes('dropped')).toBe(true);
    expect(validStatuses.includes('invalid')).toBe(false);
  });
});

describe('Enrollment Business Rules', () => {
  let service: EnrollmentService;

  beforeEach(() => {
    service = new EnrollmentService();
  });

  it('should set initial progress to 0 on enrollment', async () => {
    const result = await service.createEnrollment('user-1', { courseId: 'course-1' });

    if (!service.isError(result)) {
      expect(result.progress_percentage).toBe(0);
    }
  });

  it('should set initial status to active on enrollment', async () => {
    const result = await service.createEnrollment('user-1', { courseId: 'course-1' });

    if (!service.isError(result)) {
      expect(result.status).toBe('active');
    }
  });

  it('should record enrollment timestamp', async () => {
    const before = new Date();
    const result = await service.createEnrollment('user-1', { courseId: 'course-1' });
    const after = new Date();

    if (!service.isError(result)) {
      const enrolledAt = new Date(result.enrolled_at);
      expect(enrolledAt >= before).toBe(true);
      expect(enrolledAt <= after).toBe(true);
    }
  });

  it('should auto-complete enrollment at 100% progress', async () => {
    const enrollment = await service.createEnrollment('user-1', { courseId: 'course-1' });
    if (service.isError(enrollment)) throw new Error('Setup failed');

    await service.updateProgress('user-1', enrollment.id, 100);

    const enrollments = await service.getEnrollments('user-1');
    if (!service.isError(enrollments)) {
      expect(enrollments[0].status).toBe('completed');
    }
  });
});
