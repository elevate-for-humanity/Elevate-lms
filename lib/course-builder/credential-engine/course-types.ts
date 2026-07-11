/**
 * Course Type Detection & Classification
 * 
 * First decision: What KIND of course are we building?
 * This determines the entire generation pipeline.
 */

export type CourseType = 
  | 'academic'           // College/workforce curricula
  | 'credential'         // Exam-focused (EPA 608, NHA, OSHA)
  | 'apprenticeship'    // DOL-registered apprenticeship
  | 'licensure'         // State licensing exam prep
  | 'continuing-ed'      // CE credits
  | 'employer-training'  // Company-specific
  | 'government'         // WIOA, etc.
  | 'internal-sop';      // Internal procedures

export interface CourseTypeConfig {
  type: CourseType;
  label: string;
  description: string;
  generationMode: GenerationMode;
  requiresBlueprint: boolean;
  hasExamComponent: boolean;
  hasLabComponent: boolean;
  credentialFocus: boolean;
}

export type GenerationMode = 
  | 'academic'      // Learning objectives → content
  | 'exam-prep'     // Blueprint → practice questions
  | 'apprenticeship' // Competencies → OJT + RTI
  | 'licensure'      // State board → pass exam
  | 'ce'            // Credit hours → certificate
  | 'onboarding';    // SOP → task completion

export const COURSE_TYPES: Record<CourseType, CourseTypeConfig> = {
  credential: {
    type: 'credential',
    label: 'Certification Exam Prep',
    description: 'Exam-focused course to prepare students for professional certification',
    generationMode: 'exam-prep',
    requiresBlueprint: true,
    hasExamComponent: true,
    hasLabComponent: false,
    credentialFocus: true,
  },
  apprenticeship: {
    type: 'apprenticeship',
    label: 'Registered Apprenticeship',
    description: 'DOL-registered apprenticeship with OJT + RTI requirements',
    generationMode: 'apprenticeship',
    requiresBlueprint: true,
    hasExamComponent: true,
    hasLabComponent: true,
    credentialFocus: true,
  },
  licensure: {
    type: 'licensure',
    label: 'State Licensure Exam Prep',
    description: 'State licensing board exam preparation',
    generationMode: 'licensure',
    requiresBlueprint: true,
    hasExamComponent: true,
    hasLabComponent: true,
    credentialFocus: true,
  },
  academic: {
    type: 'academic',
    label: 'Academic Course',
    description: 'College or workforce development curriculum',
    generationMode: 'academic',
    requiresBlueprint: false,
    hasExamComponent: true,
    hasLabComponent: true,
    credentialFocus: false,
  },
  'continuing-ed': {
    type: 'continuing-ed',
    label: 'Continuing Education',
    description: 'CE credits for license renewal',
    generationMode: 'ce',
    requiresBlueprint: true,
    hasExamComponent: false,
    hasLabComponent: false,
    credentialFocus: true,
  },
  'employer-training': {
    type: 'employer-training',
    label: 'Employer Training',
    description: 'Company-specific training and onboarding',
    generationMode: 'onboarding',
    requiresBlueprint: false,
    hasExamComponent: false,
    hasLabComponent: true,
    credentialFocus: false,
  },
  government: {
    type: 'government',
    label: 'Government Funded Training',
    description: 'WIOA, TAA, and other government programs',
    generationMode: 'academic',
    requiresBlueprint: true,
    hasExamComponent: true,
    hasLabComponent: true,
    credentialFocus: true,
  },
  'internal-sop': {
    type: 'internal-sop',
    label: 'Internal SOP',
    description: 'Standard operating procedures',
    generationMode: 'onboarding',
    requiresBlueprint: false,
    hasExamComponent: false,
    hasLabComponent: false,
    credentialFocus: false,
  },
};

/**
 * Detect course type from user request
 */
export function detectCourseType(input: string): CourseType {
  const lower = input.toLowerCase();
  
  // Credential keywords
  if (lower.includes('certification') || lower.includes('exam prep') || 
      lower.includes('epa 608') || lower.includes('nha') || lower.includes('osha') ||
      lower.includes('nccer') || lower.includes('certiport') || lower.includes('careersafe')) {
    return 'credential';
  }
  
  // Apprenticeship keywords
  if (lower.includes('apprenticeship') || lower.includes('ojt') || 
      lower.includes('registered apprenticeship')) {
    return 'apprenticeship';
  }
  
  // Licensure keywords
  if (lower.includes('licensure') || lower.includes('state board') || 
      lower.includes('state exam') || lower.includes('barber license') ||
      lower.includes('cosmetology license')) {
    return 'licensure';
  }
  
  // Continuing education
  if (lower.includes('continuing education') || lower.includes('ce credit') ||
      lower.includes('renewal')) {
    return 'continuing-ed';
  }
  
  // Employer training
  if (lower.includes('onboarding') || lower.includes('employer') || 
      lower.includes('corporate training') || lower.includes('company training')) {
    return 'employer-training';
  }
  
  // Government
  if (lower.includes('wioa') || lower.includes('government') || 
      lower.includes('workforce')) {
    return 'government';
  }
  
  // SOP
  if (lower.includes('sop') || lower.includes('procedure') || 
      lower.includes('standard operating')) {
    return 'internal-sop';
  }
  
  // Default to academic
  return 'academic';
}

/**
 * Get generation mode for course type
 */
export function getGenerationMode(type: CourseType): GenerationMode {
  return COURSE_TYPES[type].generationMode;
}
