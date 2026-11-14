/**
 * Course-specific completion requirements.
 *
 * Courses that include industry certification exams (EPA 608, OSHA, etc.)
 * require a logged and passing proctored exam session before a certificate
 * can be issued. This separates training completion from credentialing.
 *
 * The exam requirement enforces the chain of custody:
 *   Training → Quizzes Passed → Proctored Exam Logged → Certificate Issued
 */

export interface ExamRequirement {
  /** Exam provider name stored in exam_sessions.provider */
  provider: string;
  /** Human-readable exam name for error messages */
  examName: string;
  /** Required result value in exam_sessions.result */
  requiredResult: string;
}

export interface CourseRequirements {
  /** Minimum seat time hours before course can be completed */
  minimumSeatTimeHours: number | null;
  /** Proctored exam that must be passed before certificate issuance */
  examRequirement: ExamRequirement | null;
}

/**
 * Keyed by course slug. Courses not listed here use default requirements
 * (no exam, no minimum seat time).
 */
const COURSE_REQUIREMENTS: Record<string, CourseRequirements> = {
  'hvac-technician': {
    // LMS theory curriculum is 45.8 hours. Minimum 30 hours (~65%) ensures
    // genuine engagement while accounting for faster learners. The remaining
    // ~254 hours of the 300-hour program are in-person lab/shop time tracked
    // through hour_entries, not LMS seat time.
    minimumSeatTimeHours: 30,
    examRequirement: {
      provider: 'mainstream_epa608',
      examName: 'EPA 608 Universal Certification',
      requiredResult: 'pass',
    },
  },
};

const DEFAULT_REQUIREMENTS: CourseRequirements = {
  minimumSeatTimeHours: null,
  examRequirement: null,
};

export function getCourseRequirements(courseSlug: string): CourseRequirements {
  return COURSE_REQUIREMENTS[courseSlug] || DEFAULT_REQUIREMENTS;
}
