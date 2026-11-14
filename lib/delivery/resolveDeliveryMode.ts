/**
 * Delivery Mode Resolver
 * Determines how learning is delivered for a given enrollment.
 */

export type DeliveryMode = 'internal' | 'partner' | 'hybrid';

export type EnrollmentSource =
  | 'enrollments'
  | 'course_enrollments'
  | 'program_enrollments'
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

export function resolveDeliveryMode(
  source: EnrollmentSource,
  program?: ProgramRow | null,
): DeliveryModeResult {
  if (program?.delivery_mode) {
    return {
      mode: program.delivery_mode as DeliveryMode,
      inferred: false,
    };
  }

  return {
    mode: inferFromSource(source),
    inferred: true,
  };
}

function inferFromSource(source: EnrollmentSource): DeliveryMode {
  switch (source) {
    case 'partner_lms_enrollments':
    case 'partner_enrollments':
      return 'partner';
    case 'program_enrollments':
      return 'hybrid';
    case 'course_enrollments':
    case 'enrollments':
    default:
      return 'internal';
  }
}

/** Return the canonical learning destination for an enrollment. */
export function getContinueLearningUrl(
  deliveryMode: DeliveryMode,
  enrollment: {
    enrollment_id: string;
    course_id?: string | null;
    program_slug?: string | null;
  },
): string {
  switch (deliveryMode) {
    case 'partner':
      return `/partner-learning/${enrollment.enrollment_id}`;
    case 'hybrid':
    case 'internal':
    default:
      if (enrollment.course_id) {
        return `/lms/courses/${enrollment.course_id}`;
      }
      return '/lms/dashboard';
  }
}
