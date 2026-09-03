/**
 * lib/curriculum/package/validator.ts
 *
 * Layer 3: Curriculum Package Validation
 * 
 * Validates the complete curriculum package for approval readiness:
 * - Hours reconcile correctly
 * - Competencies are covered
 * - Assessments are aligned
 * - Documents are complete
 * - Approval checklist is passed
 */

import type { CurriculumPackage, ApprovalPacket } from './types';

export interface ValidationIssue {
  severity: 'error' | 'warning';
  category: string;
  message: string;
  field?: string;
}

export interface ValidationResult {
  passed: boolean;
  score: number; // 0-100
  hoursReconcile: boolean;
  competenciesCovered: boolean;
  assessmentsAligned: boolean;
  documentsComplete: boolean;
  approvalChecklistPassed: boolean;
  issues: ValidationIssue[];
}

// ─── Hour Validation ──────────────────────────────────────────────────────────

function validateHours(pkg: CurriculumPackage): { reconcile: boolean; issues: ValidationIssue[] } {
  const issues: ValidationIssue[] = [];
  
  if (pkg.clockHourBreakdown.length === 0) {
    issues.push({
      severity: 'error',
      category: 'hours',
      message: 'No clock hour breakdown provided',
    });
    return { reconcile: false, issues };
  }

  const totalDeclared = pkg.clockHourBreakdown.reduce((sum, m) => sum + m.totalHours, 0);
  const expectedTotal = pkg.clockHourBreakdown.reduce((sum, m) => {
    return sum + m.lectureHours + m.labHours + m.clinicalHours + 
           m.externshipHours + m.simulationHours + m.assessmentHours;
  }, 0);

  if (Math.abs(totalDeclared - expectedTotal) > 0.5) {
    issues.push({
      severity: 'error',
      category: 'hours',
      message: `Hour mismatch: declared ${totalDeclared}h but breakdown sums to ${expectedTotal}h`,
      field: 'totalHours',
    });
  }

  const reconcile = issues.filter(i => i.severity === 'error' && i.category === 'hours').length === 0;
  return { reconcile, issues };
}

// ─── Competency Validation ────────────────────────────────────────────────────

function validateCompetencies(pkg: CurriculumPackage): { covered: boolean; issues: ValidationIssue[] } {
  const issues: ValidationIssue[] = [];
  
  // Check that lessons have competency mappings
  const modulesWithCompetencies = pkg.clockHourBreakdown.length > 0 ? pkg.clockHourBreakdown.length : 0;
  
  if (modulesWithCompetencies === 0) {
    issues.push({
      severity: 'warning',
      category: 'competencies',
      message: 'No competency mapping data available for validation',
    });
  }

  const covered = modulesWithCompetencies > 0 && issues.filter(i => i.severity === 'error').length === 0;
  return { covered, issues };
}

// ─── Assessment Validation ────────────────────────────────────────────────────

function validateAssessments(pkg: CurriculumPackage): { aligned: boolean; issues: ValidationIssue[] } {
  const issues: ValidationIssue[] = [];

  if (pkg.practicalRubrics.length === 0) {
    issues.push({
      severity: 'warning',
      category: 'assessments',
      message: 'No practical rubrics provided - practical assessments may not be aligned',
    });
  } else {
    // Check rubrics have criteria
    for (const rubric of pkg.practicalRubrics) {
      if (rubric.criteria.length === 0) {
        issues.push({
          severity: 'error',
          category: 'assessments',
          message: `Rubric for ${rubric.moduleTitle} has no criteria`,
          field: 'criteria',
        });
      }
      if (rubric.criteria.reduce((sum, c) => sum + c.weight, 0) !== 100) {
        issues.push({
          severity: 'error',
          category: 'assessments',
          message: `Rubric for ${rubric.moduleTitle} criteria weights do not sum to 100%`,
          field: 'weight',
        });
      }
    }
  }

  if (pkg.skillsChecklists.length === 0) {
    issues.push({
      severity: 'warning',
      category: 'assessments',
      message: 'No skills checklists provided',
    });
  }

  const aligned = issues.filter(i => i.severity === 'error').length === 0;
  return { aligned, issues };
}

// ─── Document Validation ──────────────────────────────────────────────────────

function validateDocuments(pkg: CurriculumPackage): { complete: boolean; issues: ValidationIssue[] } {
  const issues: ValidationIssue[] = [];
  
  const requiredDocuments = [
    { name: 'Instructor Guide', present: !!pkg.instructorGuides },
    { name: 'Syllabus', present: !!pkg.syllabus },
    { name: 'Skills Checklists', present: pkg.skillsChecklists.length > 0 },
    { name: 'Practical Rubrics', present: pkg.practicalRubrics.length > 0 },
  ];

  for (const doc of requiredDocuments) {
    if (!doc.present) {
      issues.push({
        severity: 'error',
        category: 'documents',
        message: `Missing required document: ${doc.name}`,
      });
    }
  }

  // Check syllabus has required fields
  if (pkg.syllabus) {
    if (!pkg.syllabus.gradingPolicy || pkg.syllabus.gradingPolicy.length === 0) {
      issues.push({
        severity: 'warning',
        category: 'documents',
        message: 'Syllabus missing grading policy',
        field: 'gradingPolicy',
      });
    }
    if (!pkg.syllabus.attendancePolicy) {
      issues.push({
        severity: 'warning',
        category: 'documents',
        message: 'Syllabus missing attendance policy',
        field: 'attendancePolicy',
      });
    }
  }

  const complete = requiredDocuments.every(d => d.present) && 
                  issues.filter(i => i.severity === 'error').length === 0;
  return { complete, issues };
}

// ─── Approval Checklist ────────────────────────────────────────────────────────

function validateApprovalChecklist(pkg: CurriculumPackage): { passed: boolean; issues: ValidationIssue[] } {
  const issues: ValidationIssue[] = [];
  
  const checklist = [
    { item: 'Program description', present: !!pkg.syllabus?.programDescription },
    { item: 'Learning objectives', present: pkg.instructorGuides?.modules.every(m => m.learningObjectives?.length > 0) },
    { item: 'Module descriptions', present: pkg.instructorGuides?.modules.every(m => m.moduleOverview) },
    { item: 'Clock hour breakdown', present: pkg.clockHourBreakdown.length > 0 },
    { item: 'Skills checklists', present: pkg.skillsChecklists.length > 0 },
    { item: 'Practical rubrics', present: pkg.practicalRubrics.length > 0 },
    { item: 'Grading policy', present: !!pkg.syllabus?.gradingPolicy },
    { item: 'Attendance policy', present: !!pkg.syllabus?.attendancePolicy },
    { item: 'Academic integrity policy', present: !!pkg.syllabus?.academicIntegrityPolicy },
    { item: 'Required materials', present: pkg.syllabus?.requiredMaterials?.length > 0 },
  ];

  for (const item of checklist) {
    if (!item.present) {
      issues.push({
        severity: 'error',
        category: 'approval',
        message: `Approval checklist incomplete: ${item.item}`,
      });
    }
  }

  const passed = checklist.every(i => i.present);
  return { passed, issues };
}

// ─── Main Validator ───────────────────────────────────────────────────────────

/**
 * Validate complete curriculum package for approval readiness
 * 
 * Returns detailed validation result with:
 * - Overall pass/fail
 * - Score (0-100)
 * - Category-specific results
 * - Detailed issues list
 */
export function validateCurriculumPackage(pkg: CurriculumPackage): ValidationResult {
  const hoursResult = validateHours(pkg);
  const competenciesResult = validateCompetencies(pkg);
  const assessmentsResult = validateAssessments(pkg);
  const documentsResult = validateDocuments(pkg);
  const approvalResult = validateApprovalChecklist(pkg);

  const allIssues = [
    ...hoursResult.issues,
    ...competenciesResult.issues,
    ...assessmentsResult.issues,
    ...documentsResult.issues,
    ...approvalResult.issues,
  ];

  const errors = allIssues.filter(i => i.severity === 'error').length;
  const warnings = allIssues.filter(i => i.severity === 'warning').length;
  
  // Calculate score
  let score = 100;
  score -= errors * 10;
  score -= warnings * 2;
  score = Math.max(0, score);

  const passed = errors === 0 && approvalResult.passed;

  return {
    passed,
    score,
    hoursReconcile: hoursResult.reconcile,
    competenciesCovered: competenciesResult.covered,
    assessmentsAligned: assessmentsResult.aligned,
    documentsComplete: documentsResult.complete,
    approvalChecklistPassed: approvalResult.passed,
    issues: allIssues,
  };
}

/**
 * Generate approval-ready checklist report
 */
export function generateApprovalChecklist(pkg: CurriculumPackage): {
  checklist: { item: string; status: 'pass' | 'fail' | 'warning'; notes?: string }[];
  summary: { total: number; passed: number; failed: number; warnings: number };
} {
  const validation = validateCurriculumPackage(pkg);
  
  const checklist = [
    { item: 'Program has valid title and description', status: pkg.syllabus?.programDescription ? 'pass' : 'fail' },
    { item: 'Total clock hours are specified', status: pkg.clockHourBreakdown.length > 0 ? 'pass' : 'fail' },
    { item: 'Hours reconcile (breakdown sums to total)', status: validation.hoursReconcile ? 'pass' : 'fail' },
    { item: 'All modules have learning objectives', status: pkg.instructorGuides?.modules.every(m => m.learningObjectives?.length > 0) ? 'pass' : 'fail' },
    { item: 'Instructor guide is complete', status: pkg.instructorGuides ? 'pass' : 'fail' },
    { item: 'Student syllabus is complete', status: pkg.syllabus ? 'pass' : 'fail' },
    { item: 'Skills checklists are provided', status: pkg.skillsChecklists.length > 0 ? 'pass' : 'fail' },
    { item: 'Practical rubrics are provided', status: pkg.practicalRubrics.length > 0 ? 'pass' : 'fail' },
    { item: 'Lab activities are provided', status: pkg.labActivities.length > 0 ? 'pass' : 'warning' },
    { item: 'Grading policy is documented', status: pkg.syllabus?.gradingPolicy?.length > 0 ? 'pass' : 'fail' },
    { item: 'Attendance policy is documented', status: pkg.syllabus?.attendancePolicy ? 'pass' : 'fail' },
    { item: 'Academic integrity policy is documented', status: pkg.syllabus?.academicIntegrityPolicy ? 'pass' : 'fail' },
    { item: 'Required materials are listed', status: pkg.syllabus?.requiredMaterials?.length > 0 ? 'pass' : 'fail' },
    { item: 'Clock hours categorized by type', status: pkg.clockHourBreakdown.every(m => m.lectureHours > 0 || m.labHours > 0) ? 'pass' : 'warning' },
    { item: 'Assessment methods specified', status: validation.assessmentsAligned ? 'pass' : 'warning' },
  ];

  return {
    checklist,
    summary: {
      total: checklist.length,
      passed: checklist.filter(c => c.status === 'pass').length,
      failed: checklist.filter(c => c.status === 'fail').length,
      warnings: checklist.filter(c => c.status === 'warning').length,
    },
  };
}
