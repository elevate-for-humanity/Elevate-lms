/**
 * Delivery Mode Resolver
 * Determines how learning is delivered for a given enrollment
 */

export type DeliveryMode = 'internal' | 'partner' | 'hybrid';

export type EnrollmentSource = 
  | 'enrollments' 
  | 'student_enrollments' 
  | 'partner_enrollments' 
  | 'partner_lms_enrollments';

export type DeliveryModeResult = {
  mode: DeliveryMode;
  inferred: boolean;
};

type ProgramRow = {
  delivery_mode?: DeliveryMode | null;
  [key: string]: unknown;
};

/**
 * Resolve delivery mode for an enrollment
 * 
 * Precedence:
 * 1. If program.delivery_mode is set → use it
 * 2. Else infer from enrollment source table
 * 3. Else fallback → 'internal'
 */
export function resolveDeliveryMode(
  source: EnrollmentSource,
  program?: ProgramRow | null
): DeliveryModeResult {
  // 1. Check explicit program configuration
  if (program?.delivery_mode) {
    return {
      mode: program.delivery_mode as DeliveryMode,
      inferred: false,
    };
  }

  // 2. Infer from enrollment source
  const inferredMode = inferFromSource(source);
  
  return {
    mode: inferredMode,
    inferred: true,
  };
}

/**
 * Infer delivery mode from enrollment source table
 */
function inferFromSource(source: EnrollmentSource): DeliveryMode {
  switch (source) {
    case 'partner_lms_enrollments':
    case 'partner_enrollments':
      return 'partner';
    
    case 'student_enrollments':
      // student_enrollments is used for barber apprenticeship (hybrid)
      return 'hybrid';
    
    case 'enrollments':
    default:
      return 'internal';
  }
}

/**
 * Get the appropriate "Continue Learning" URL for an enrollment
 */
export function getContinueLearningUrl(
  deliveryMode: DeliveryMode,
  enrollment: {
    enrollment_id: string;
    course_id?: string | null;
    program_slug?: string | null;
  }
): string {
  switch (deliveryMode) {
    case 'partner':
      return `/partner-learning/${enrollment.enrollment_id}`;
    
    case 'hybrid':
      // Hybrid enrollments go to case management or LMS dashboard
      if (enrollment.course_id) {
        return `/lms/courses/${enrollment.course_id}`;
      }
      return '/learner/dashboard';
    
    case 'internal':
    default:
      if (enrollment.course_id) {
        return `/lms/courses/${enrollment.course_id}`;
      }
      return '/learner/dashboard';
  }
}
