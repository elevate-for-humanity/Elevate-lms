// Gradebook Calculator - Weighted Grade Calculations

import {
  Grade,
  GradeCategory,
  StudentGradeSummary,
  CategoryGrade,
  GradeScale,
  DEFAULT_GRADE_SCALE,
  Assignment,
} from './types';

/**
 * Calculate weighted grade for a student
 */
export function calculateWeightedGrade(
  grades: Grade[],
  assignments: Assignment[],
  categories: GradeCategory[],
): StudentGradeSummary {
  const categoryGrades: CategoryGrade[] = [];

  // Calculate grade for each category
  for (const category of categories) {
    const categoryAssignments = assignments.filter((a) => a.categoryId === category.id);
    const categoryGradeData = grades.filter((g) =>
      categoryAssignments.some((a) => a.id === g.assignmentId),
    );

    // Filter out excused and dropped grades
    const validGrades = categoryGradeData.filter((g) => !g.isExcused && !g.isDropped);

    // Drop lowest if configured
    const gradesToCount = dropLowestGrades(validGrades, category.dropLowest || 0);

    const earnedPoints = gradesToCount.reduce((sum, g) => sum + g.points, 0);
    const possiblePoints = gradesToCount.reduce((sum, g) => sum + g.maxPoints, 0);
    const percentage = possiblePoints > 0 ? (earnedPoints / possiblePoints) * 100 : 0;

    categoryGrades.push({
      categoryId: category.id,
      categoryName: category.name,
      weight: category.weight,
      earnedPoints,
      possiblePoints,
      percentage,
      droppedAssignments: categoryGradeData.filter((g) => g.isDropped).map((g) => g.assignmentId),
    });
  }

  // Calculate overall weighted grade
  const overallPercentage = categoryGrades.reduce((sum, cg) => {
    return sum + cg.percentage * (cg.weight / 100);
  }, 0);

  const letterGrade = getLetterGrade(overallPercentage, DEFAULT_GRADE_SCALE);
  const trend = calculateTrend(grades);

  return {
    studentId: grades[0]?.studentId || '',
    courseId: '', // Set by caller
    categoryGrades,
    overallGrade: overallPercentage,
    overallPercentage,
    letterGrade,
    trend,
  };
}

/**
 * Drop lowest N grades
 */
function dropLowestGrades(grades: Grade[], dropCount: number): Grade[] {
  if (dropCount === 0 || grades.length <= dropCount) {
    return grades;
  }

  // Sort by percentage (lowest first)
  const sorted = [...grades].sort((a, b) => a.percentage - b.percentage);

  // Mark lowest N as dropped
  sorted.slice(0, dropCount).forEach((g) => (g.isDropped = true));

  // Return grades that aren't dropped
  return sorted.slice(dropCount);
}

/**
 * Convert percentage to letter grade
 */
export function getLetterGrade(
  percentage: number,
  scale: GradeScale = DEFAULT_GRADE_SCALE,
): string {
  if (percentage >= scale['A']) return 'A';
  if (percentage >= scale['A-']) return 'A-';
  if (percentage >= scale['B+']) return 'B+';
  if (percentage >= scale['B']) return 'B';
  if (percentage >= scale['B-']) return 'B-';
  if (percentage >= scale['C+']) return 'C+';
  if (percentage >= scale['C']) return 'C';
  if (percentage >= scale['C-']) return 'C-';
  if (percentage >= scale['D+']) return 'D+';
  if (percentage >= scale['D']) return 'D';
  if (percentage >= scale['D-']) return 'D-';
  return 'F';
}

/**
 * Calculate grade trend
 */
function calculateTrend(grades: Grade[]): 'improving' | 'declining' | 'stable' {
  if (grades.length < 3) return 'stable';

  // Sort by graded date
  const sorted = [...grades].sort(
    (a, b) => new Date(a.gradedAt).getTime() - new Date(b.gradedAt).getTime(),
  );

  // Compare recent half vs older half
  const midpoint = Math.floor(sorted.length / 2);
  const olderGrades = sorted.slice(0, midpoint);
  const recentGrades = sorted.slice(midpoint);

  const olderAvg = olderGrades.reduce((sum, g) => sum + g.percentage, 0) / olderGrades.length;
  const recentAvg = recentGrades.reduce((sum, g) => sum + g.percentage, 0) / recentGrades.length;

  const diff = recentAvg - olderAvg;

  if (diff > 5) return 'improving';
  if (diff < -5) return 'declining';
  return 'stable';
}

/**
 * Calculate rubric score
 */
export function calculateRubricScore(rubricScores: any[], totalPoints: number): number {
  const earnedPoints = rubricScores.reduce((sum, score) => sum + score.points, 0);
  return (earnedPoints / totalPoints) * 100;
}

/**
 * Apply late penalty
 */
export function applyLatePenalty(
  points: number,
  dueDate: Date,
  submittedAt: Date,
  penaltyPerDay: number,
): number {
  const daysLate = Math.ceil((submittedAt.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));

  if (daysLate <= 0) return points;

  const penalty = (penaltyPerDay / 100) * points * daysLate;
  return Math.max(0, points - penalty);
}

/**
 * Calculate what-if grade
 */
export function calculateWhatIfGrade(
  currentGrades: Grade[],
  hypotheticalGrade: {
    assignmentId: string;
    points: number;
    maxPoints: number;
  },
  assignments: Assignment[],
  categories: GradeCategory[],
): number {
  const allGrades = [
    ...currentGrades,
    {
      ...hypotheticalGrade,
      id: 'what-if',
      submissionId: 'what-if',
      studentId: currentGrades[0]?.studentId || '',
      percentage: (hypotheticalGrade.points / hypotheticalGrade.maxPoints) * 100,
      gradedBy: 'system',
      gradedAt: new Date(),
      isExcused: false,
      isDropped: false,
    } as Grade,
  ];

  const summary = calculateWeightedGrade(allGrades, assignments, categories);
  return summary.overallPercentage;
}
