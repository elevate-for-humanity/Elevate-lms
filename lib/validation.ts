// Form validation utilities
import { createClient } from '@/lib/supabase/server';

// Enhanced validation functions
export async function checkDuplicateEnrollment(
  studentId: string,
  programId: string
): Promise<{ isDuplicate: boolean; existingEnrollmentId?: string }> {
  const supabase = await createClient();
  const { data: existing } = await supabase
    .from('program_enrollments')
    .select('id')
    .eq('student_id', studentId)
    .eq('program_id', programId)
    .in('status', ['active', 'completed'])
    .single();

  return {
    isDuplicate: !!existing,
    existingEnrollmentId: existing?.id,
  };
}

export async function verifyCertificateEligibility(enrollmentId: string) {
  const supabase = await createClient();
  const { data: enrollment } = await supabase
    .from('program_enrollments')
    .select(
      '*, program:programs(required_lessons), progress:lesson_progress(completed_at)'
    )
    .eq('id', enrollmentId)
    .single();

  if (!enrollment || enrollment.status !== 'completed') {
    return { eligible: false, reason: 'Program not completed' };
  }

  const completedLessons =
    enrollment.progress?.filter((p: any) => p.completed_at).length || 0;
  const requiredLessons = enrollment.program?.required_lessons || 0;
  const completionPercentage =
    requiredLessons > 0 ? (completedLessons / requiredLessons) * 100 : 0;

  if (completionPercentage < 100) {
    return {
      eligible: false,
      reason: `Only ${completionPercentage.toFixed(0)}% completed`,
      completionPercentage,
    };
  }

  return { eligible: true, completionPercentage: 100 };
}

export const validators = {
  required: (value: any) => {
    if (!value || (typeof value === 'string' && !value.trim())) {
      return 'This field is required';
    }
    return null;
  },

  email: (value: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) {
      return 'Please enter a valid email address';
    }
    return null;
  },

  phone: (value: string) => {
    const phoneRegex = /^\(?([0-9]{3})\)?[-. ]?([0-9]{3})[-. ]?([0-9]{4})$/;
    if (!phoneRegex.test(value)) {
      return 'Please enter a valid phone number';
    }
    return null;
  },

  minLength: (min: number) => (value: string) => {
    if (value.length < min) {
      return `Must be at least ${min} characters`;
    }
    return null;
  },

  maxLength: (max: number) => (value: string) => {
    if (value.length > max) {
      return `Must be no more than ${max} characters`;
    }
    return null;
  },

  zip: (value: string) => {
    const zipRegex = /^\d{5}(-\d{4})?$/;
    if (!zipRegex.test(value)) {
      return 'Please enter a valid ZIP code';
    }
    return null;
  },

  ssn: (value: string) => {
    const ssnRegex = /^\d{3}-?\d{2}-?\d{4}$/;
    if (!ssnRegex.test(value)) {
      return 'Please enter a valid SSN (XXX-XX-XXXX)';
    }
    return null;
  },

  date: (value: string) => {
    const date = new Date(value);
    if (isNaN(date.getTime())) {
      return 'Please enter a valid date';
    }
    return null;
  },

  minAge: (min: number) => (value: string) => {
    const birthDate = new Date(value);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    // Adjust age if birthday hasn't occurred yet this year
    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birthDate.getDate())
    ) {
      age--;
    }

    if (age < min) {
      return `Must be at least ${min} years old`;
    }
    return null;
  },
};

export function validateForm(
  values: Record<string, any>,
  rules: Record<string, Array<(data: any) => string | null>>
): Record<string, string> {
  const errors: Record<string, string> = {};

  Object.keys(rules).forEach((field) => {
    const fieldRules = rules[field];
    const value = values[field];

    for (const rule of fieldRules) {
      const error = rule(value);
      if (error) {
        errors[field] = error;
        break;
      }
    }
  });

  return errors;
}
