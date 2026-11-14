/**
 * Canonical input shape for program creation.
 *
 * One payload describes the whole program. Pass this to
 * createAndPublishProgram() — nothing else is needed.
 */

export type LessonType =
  | 'lesson'
  | 'quiz'
  | 'checkpoint'
  | 'lab'
  | 'assignment'
  | 'exam'
  | 'certification';

export interface ProgramLessonInput {
  slug: string;
  title: string;
  orderIndex: number;
  lessonType: LessonType;
  content?: Record<string, unknown>;
  /**
   * Required for checkpoint / quiz / exam / certification.
   * Must be 1–100.
   */
  passingScore?: number | null;
  isRequired?: boolean;
}

export interface ProgramModuleInput {
  slug: string;
  title: string;
  orderIndex: number;
  lessons: ProgramLessonInput[];
}

export interface ProgramCreateInput {
  /** Org slug to scope this program to. Defaults to 'elevate-core'. */
  orgSlug?: string;
  program: {
    slug: string;
    title: string;
    description: string;
    shortDescription?: string;
    /** Defaults to 'draft'. Set to 'published' only via publish:true. */
    status?: 'draft' | 'published';
    isActive?: boolean;
    /** programs.category — NOT NULL. Defaults to 'workforce'. */
    category?: string;
    deliveryModel?: string | null;
    enrollmentType?: string | null;
  };
  /** Course-level overrides. Defaults to program values when omitted. */
  course?: {
    title?: string;
    shortDescription?: string;
    description?: string;
  };
  modules: ProgramModuleInput[];
  /**
   * When true, calls publish_course() and marks the program published
   * after all rows are written. Fails loudly if the guard rejects.
   */
  publish?: boolean;
}

export interface ProgramCreateResult {
  programId: string;
  courseId: string;
  moduleCount: number;
  lessonCount: number;
  published: boolean;
}
